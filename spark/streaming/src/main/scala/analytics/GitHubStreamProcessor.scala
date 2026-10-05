package analytics

import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.functions._
import org.apache.spark.sql.streaming.Trigger

import java.util.concurrent.TimeUnit

/**
 * Spark Structured Streaming: Kafka → parse → deduplicate → Iceberg
 *
 * Topic:  github.events.raw
 * Output: lakehouse.github.realtime_events   (Iceberg, partitioned by event date)
 *         lakehouse.github.streaming_stats   (windowed aggregates per repo)
 *
 * Run with:
 *   spark-submit --master spark://spark-master:7077 \
 *     --packages \
 *       org.apache.iceberg:iceberg-spark-runtime-3.5_2.12:1.4.3,\
 *       org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0 \
 *     github-analytics-spark-assembly.jar analytics.GitHubStreamProcessor
 */
object GitHubStreamProcessor {

  def main(args: Array[String]): Unit = {

    val kafkaBootstrap = sys.env.getOrElse("KAFKA_BOOTSTRAP", "kafka:29092")
    val kafkaTopic     = sys.env.getOrElse("KAFKA_TOPIC",     "github.events.raw")
    val checkpointBase = sys.env.getOrElse("CHECKPOINT_DIR",  "s3a://warehouse/_checkpoints")

    val spark = SparkSession.builder()
      .appName("GitHubStreamProcessor")
      .config("spark.sql.extensions",
        "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions")
      .config("spark.sql.catalog.lakehouse",
        "org.apache.iceberg.spark.SparkCatalog")
      .config("spark.sql.catalog.lakehouse.type", "hadoop")
      .config("spark.sql.catalog.lakehouse.warehouse", "s3a://warehouse/data")
      .config("spark.hadoop.fs.s3a.endpoint",          "http://minio:9000")
      .config("spark.hadoop.fs.s3a.access.key",        "minioadmin")
      .config("spark.hadoop.fs.s3a.secret.key",        "minioadmin")
      .config("spark.hadoop.fs.s3a.path.style.access", "true")
      .config("spark.hadoop.fs.s3a.impl",
        "org.apache.hadoop.fs.s3a.S3AFileSystem")
      // Watermark tuning
      .config("spark.sql.shuffle.partitions", "8")
      .getOrCreate()

    import spark.implicits._

    // ── Kafka source ─────────────────────────────────────────────────────────
    val rawStream = spark.readStream
      .format("kafka")
      .option("kafka.bootstrap.servers", kafkaBootstrap)
      .option("subscribe",               kafkaTopic)
      .option("startingOffsets",         "latest")
      .option("failOnDataLoss",          "false")
      .load()

    // ── Parse JSON payload ───────────────────────────────────────────────────
    import org.apache.spark.sql.types._
    val eventSchema = new StructType()
      .add("repo",       StringType)
      .add("event_type", StringType)
      .add("actor",      StringType)
      .add("created_at", StringType)
      .add("payload",    StringType)   // keep as string for flexibility

    val events = rawStream
      .select(from_json($"value".cast(StringType), eventSchema).as("e"))
      .select("e.*")
      .withColumn("event_ts",
        to_timestamp($"created_at", "yyyy-MM-dd'T'HH:mm:ss'Z'"))
      .withColumn("event_date", $"event_ts".cast(DateType))
      // watermark for late-data handling
      .withWatermark("event_ts", "10 minutes")

    // ── Ensure table exists ──────────────────────────────────────────────────
    spark.sql("CREATE NAMESPACE IF NOT EXISTS lakehouse.github")
    spark.sql("""
      CREATE TABLE IF NOT EXISTS lakehouse.github.realtime_events (
        repo        STRING,
        event_type  STRING,
        actor       STRING,
        created_at  STRING,
        event_ts    TIMESTAMP,
        event_date  DATE,
        payload     STRING
      )
      USING iceberg
      PARTITIONED BY (event_date)
    """)

    // ── Sink 1: raw events → Iceberg ─────────────────────────────────────────
    val rawEventQuery = events.writeStream
      .format("iceberg")
      .outputMode("append")
      .option("path",             "lakehouse.github.realtime_events")
      .option("checkpointLocation", s"$checkpointBase/realtime_events")
      .trigger(Trigger.ProcessingTime(30, TimeUnit.SECONDS))
      .start()

    // ── Windowed aggregates ──────────────────────────────────────────────────
    val windowedStats = events
      .groupBy(
        window($"event_ts", "5 minutes", "1 minute"),
        $"repo",
        $"event_type",
      )
      .count()
      .withColumn("window_start", $"window.start")
      .withColumn("window_end",   $"window.end")
      .drop("window")

    spark.sql("""
      CREATE TABLE IF NOT EXISTS lakehouse.github.streaming_stats (
        repo         STRING,
        event_type   STRING,
        window_start TIMESTAMP,
        window_end   TIMESTAMP,
        count        LONG
      )
      USING iceberg
      PARTITIONED BY (days(window_start))
    """)

    val statsQuery = windowedStats.writeStream
      .format("iceberg")
      .outputMode("append")
      .option("path",             "lakehouse.github.streaming_stats")
      .option("checkpointLocation", s"$checkpointBase/streaming_stats")
      .trigger(Trigger.ProcessingTime(30, TimeUnit.SECONDS))
      .start()

    spark.streams.awaitAnyTermination()
  }
}
