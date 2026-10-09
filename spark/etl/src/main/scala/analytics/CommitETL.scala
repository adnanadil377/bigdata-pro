package analytics

import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.functions._
import org.apache.spark.sql.types._

/**
 * Batch ETL: Raw Parquet (HDFS) → Apache Iceberg lakehouse tables
 *
 * Reads:
 *   hdfs://namenode:9000/raw/git_events/repository=*/commits.parquet
 *
 * Writes Iceberg tables (catalog: lakehouse):
 *   lakehouse.github.commits           - deduplicated commit records
 *   lakehouse.github.contributor_stats - monthly rollup per contributor/repo
 *   lakehouse.github.commit_types      - commit message classification
 *   lakehouse.github.file_hotspots     - file-change frequency per repo
 *
 * Run with:
 *   spark-submit --master spark://spark-master:7077 \
 *     --packages org.apache.iceberg:iceberg-spark-runtime-3.5_2.12:1.4.3 \
 *     --conf spark.sql.catalog.lakehouse=org.apache.iceberg.spark.SparkCatalog \
 *     --conf spark.sql.catalog.lakehouse.type=hadoop \
 *     --conf spark.sql.catalog.lakehouse.warehouse=hdfs://namenode:9000/warehouse/data \
 *     github-analytics-spark-assembly.jar analytics.CommitETL
 */
object CommitETL {

  // ── Commit-message classification patterns ────────────────────────────────
  private val commitTypeRules: Seq[(String, String)] = Seq(
    ("(?i)(fix|bug|patch|hotfix|error|exception|crash|defect)"   , "BUG_FIX"),
    ("(?i)(feat|feature|add|implement|new|introduce|support)"     , "FEATURE"),
    ("(?i)(refactor|clean|restructure|reorganize|rename|move)"    , "REFACTOR"),
    ("(?i)(doc|docs|readme|changelog|comment|javadoc|kdoc)"       , "DOCUMENTATION"),
    ("(?i)(perf|performance|optim|speed|fast|latency|memory)"     , "PERFORMANCE"),
    ("(?i)(test|spec|coverage|unit|integration|e2e)"              , "TEST"),
    ("(?i)(security|auth|cve|vuln|xss|sql.inject|sanitize)"       , "SECURITY"),
    ("(?i)(ci|cd|deploy|release|version|bump|publish|workflow)"   , "DEVOPS"),
  )

  def classifyCommit(subject: String): String = {
    if (subject == null) return "OTHER"
    commitTypeRules
      .find { case (pattern, _) => subject.matches(s".*$pattern.*") }
      .map(_._2)
      .getOrElse("OTHER")
  }

  def main(args: Array[String]): Unit = {

    val spark = SparkSession.builder()
      .appName("CommitETL")
      .config("spark.sql.extensions",
        "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions")
      .config("spark.sql.catalog.lakehouse",
        "org.apache.iceberg.spark.SparkCatalog")
      .config("spark.sql.catalog.lakehouse.type", "hadoop")
      .config("spark.sql.catalog.lakehouse.warehouse", "hdfs://namenode:9000/warehouse/data")
      // HDFS settings
      .config("spark.hadoop.fs.defaultFS", "hdfs://namenode:9000")
      .getOrCreate()

    import spark.implicits._

    // ── 1. Read raw Parquet ─────────────────────────────────────────────────
    val rawCommits = spark.read
      .option("mergeSchema", "true")
      .parquet("hdfs://namenode:9000/raw/git_events/")
      .withColumn("repository",
        regexp_replace(input_file_name(), ".*/repository=([^/]+)/.*", "$1"))

    // ── 2. Deduplicate by (repository, hash) ───────────────────────────────
    val commits = rawCommits
      .dropDuplicates("repository", "hash")
      .withColumn("commit_type",
        udf(classifyCommit _).apply($"subject"))
      .withColumn("author_month",
        date_trunc("month", $"author_date").cast(DateType))
      .cache()

    // ── 3. Create namespaces / tables if they don't exist ──────────────────
    spark.sql("CREATE NAMESPACE IF NOT EXISTS lakehouse.github")

    spark.sql("""
      CREATE TABLE IF NOT EXISTS lakehouse.github.commits (
        hash            STRING,
        repository      STRING,
        author_email    STRING,
        author_name     STRING,
        committer_email STRING,
        author_date     TIMESTAMP,
        committer_date  TIMESTAMP,
        author_month    DATE,
        subject         STRING,
        commit_type     STRING,
        insertions      LONG,
        deletions       LONG,
        files_changed   INT,
        parent_count    INT,
        is_merge        BOOLEAN
      )
      USING iceberg
      PARTITIONED BY (repository, author_month)
      TBLPROPERTIES ('write.parquet.compression-codec' = 'snappy')
    """)

    // ── 4. Write commits (merge to avoid duplicates on re-run) ─────────────
    commits.createOrReplaceTempView("new_commits")
    spark.sql("""
      MERGE INTO lakehouse.github.commits t
      USING new_commits s
        ON  t.repository = s.repository AND t.hash = s.hash
      WHEN NOT MATCHED THEN INSERT *
    """)

    // ── 5. Contributor monthly stats ───────────────────────────────────────
    val contribStats = commits
      .groupBy("repository", "author_email", "author_name", "author_month")
      .agg(
        count("*")             .as("commit_count"),
        sum("insertions")      .as("insertions"),
        sum("deletions")       .as("deletions"),
        sum("files_changed")   .as("files_changed"),
        sum(when($"is_merge", 0).otherwise(1)).as("non_merge_commits"),
      )

    spark.sql("""
      CREATE TABLE IF NOT EXISTS lakehouse.github.contributor_stats (
        repository    STRING,
        author_email  STRING,
        author_name   STRING,
        author_month  DATE,
        commit_count  LONG,
        insertions    LONG,
        deletions     LONG,
        files_changed LONG,
        non_merge_commits LONG
      )
      USING iceberg
      PARTITIONED BY (repository, author_month)
    """)
    contribStats.writeTo("lakehouse.github.contributor_stats")
      .option("merge-schema", "true")
      .overwritePartitions()

    // ── 6. Commit type distribution per repo/month ─────────────────────────
    val commitTypes = commits
      .groupBy("repository", "author_month", "commit_type")
      .agg(count("*").as("count"))

    spark.sql("""
      CREATE TABLE IF NOT EXISTS lakehouse.github.commit_types (
        repository   STRING,
        author_month DATE,
        commit_type  STRING,
        count        LONG
      )
      USING iceberg
      PARTITIONED BY (repository)
    """)
    commitTypes.writeTo("lakehouse.github.commit_types")
      .option("merge-schema", "true")
      .overwritePartitions()

    // ── 7. Done ─────────────────────────────────────────────────────────────
    println("✓ CommitETL complete.")
    println(s"  Total commits processed: ${commits.count()}")

    spark.stop()
  }
}
