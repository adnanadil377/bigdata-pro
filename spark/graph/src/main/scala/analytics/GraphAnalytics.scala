package analytics

import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.functions._
import org.apache.spark.graphx.{Edge, Graph, VertexId}
import org.apache.spark.rdd.RDD

/**
 * Graph Analytics: Developer Collaboration Network
 *
 * Reads:  lakehouse.github.commits        (files changed per commit)
 * Writes: lakehouse.github.collab_edges   (developer collaboration edges)
 *         lakehouse.github.graph_metrics  (degree centrality, PageRank)
 *
 * Graph definition
 * ────────────────
 *   Vertex = developer (author_email)
 *   Edge   = weighted co-authorship (shared file, PR, etc.)
 *
 * Bus-factor analysis
 * ───────────────────
 *   For each repository/module, compute the fraction of commits
 *   owned by the top N contributors → bus factor = min N such that top N > 50%.
 */
object GraphAnalytics {

  def main(args: Array[String]): Unit = {

    val spark = SparkSession.builder()
      .appName("GraphAnalytics")
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
    val sc = spark.sparkContext

    // ── 1. Load commits ────────────────────────────────────────────────────
    val commits = spark.read
      .format("iceberg")
      .load("lakehouse.github.commits")

    // ── 2. Build developer index (String → Long vertex ID) ────────────────
    val developers = commits
      .select($"author_email")
      .distinct()
      .rdd
      .zipWithIndex()
      .map { case (row, idx) => (row.getString(0), idx) }

    val devIdMap: Map[String, VertexId] = developers.collectAsMap().toMap
    val devIdBc  = sc.broadcast(devIdMap)

    // Vertex RDD: (id, login)
    val vertices: RDD[(VertexId, String)] =
      sc.parallelize(devIdMap.toSeq.map { case (email, id) => (id, email) })

    // ── 3. Co-commit edges (two devs who touched the same repo in the same month)
    //       This is a proxy for collaboration; in production you'd use PR reviews.
    val repoMonthContribs = commits
      .select("repository", "author_month", "author_email")
      .distinct()

    // Self-join to find pairs within same repo/month
    val rawEdges = repoMonthContribs.as("a")
      .join(
        repoMonthContribs.as("b"),
        $"a.repository"  === $"b.repository" &&
        $"a.author_month" === $"b.author_month" &&
        $"a.author_email"  < $"b.author_email"   // avoid duplicates
      )
      .groupBy("a.author_email", "b.author_email")
      .agg(count("*").as("weight"))
      .filter($"weight" >= 2)   // at least 2 shared months

    // ── 4. GraphX graph ────────────────────────────────────────────────────
    val edgeRDD: RDD[Edge[Long]] = rawEdges.rdd.map { row =>
      val idMap = devIdBc.value
      val srcEmail = row.getString(0)
      val dstEmail = row.getString(1)
      Edge(
        idMap.getOrElse(srcEmail, -1L),
        idMap.getOrElse(dstEmail, -1L),
        row.getLong(2),
      )
    }.filter(e => e.srcId >= 0 && e.dstId >= 0)

    val graph: Graph[String, Long] = Graph(vertices, edgeRDD)

    // ── 5. Degree centrality ──────────────────────────────────────────────
    val degreeCentrality = graph.degrees
      .join(vertices)
      .map { case (id, (degree, email)) => (email, degree) }
      .toDF("author_email", "degree_centrality")

    // ── 6. PageRank ────────────────────────────────────────────────────────
    val pageRankGraph = graph.pageRank(0.0001)
    val pageRankScores = pageRankGraph.vertices
      .join(vertices)
      .map { case (id, (rank, email)) => (email, rank) }
      .toDF("author_email", "pagerank")

    // ── 7. Merge graph metrics ─────────────────────────────────────────────
    val graphMetrics = degreeCentrality
      .join(pageRankScores, "author_email")
      .orderBy(desc("pagerank"))

    spark.sql("""
      CREATE TABLE IF NOT EXISTS lakehouse.github.graph_metrics (
        author_email       STRING,
        degree_centrality  INT,
        pagerank           DOUBLE
      )
      USING iceberg
    """)
    graphMetrics.writeTo("lakehouse.github.graph_metrics")
      .overwritePartitions()

    println("── Top 20 contributors by PageRank ──────────────────────")
    graphMetrics.show(20, truncate = false)

    // ── 8. Bus-factor analysis ─────────────────────────────────────────────
    // Commit count per repo × author
    val repoAuthorCounts = commits
      .filter(!$"is_merge")   // ignore merge commits
      .groupBy("repository", "author_email")
      .agg(count("*").as("author_commits"))

    val repoTotals = repoAuthorCounts
      .groupBy("repository")
      .agg(sum("author_commits").as("total_commits"))

    val busFactor = repoAuthorCounts
      .join(repoTotals, "repository")
      .withColumn("pct", $"author_commits" / $"total_commits")
      .withColumn("rank",
        rank().over(
          org.apache.spark.sql.expressions.Window
            .partitionBy("repository")
            .orderBy(desc("author_commits"))
        )
      )

    // For display: show top contributor % per repo
    val topContrib = busFactor
      .filter($"rank" === 1)
      .select(
        $"repository",
        $"author_email".as("top_contributor"),
        $"pct".as("top_contributor_pct"),
      )
      .orderBy(desc("top_contributor_pct"))

    println("── Bus Factor Risk (top contributor %) ──────────────────")
    topContrib.show(20, truncate = false)

    spark.sql("""
      CREATE TABLE IF NOT EXISTS lakehouse.github.bus_factor (
        repository         STRING,
        author_email       STRING,
        author_commits     LONG,
        total_commits      LONG,
        pct                DOUBLE,
        rank               INT
      )
      USING iceberg
      PARTITIONED BY (repository)
    """)
    busFactor.writeTo("lakehouse.github.bus_factor")
      .overwritePartitions()

    // ── 9. Collaboration edges → Iceberg (for dashboard graph viz) ─────────
    spark.sql("""
      CREATE TABLE IF NOT EXISTS lakehouse.github.collab_edges (
        author_a  STRING,
        author_b  STRING,
        weight    LONG
      )
      USING iceberg
    """)
    rawEdges
      .withColumnRenamed("a.author_email", "author_a")
      .withColumnRenamed("b.author_email", "author_b")
      .writeTo("lakehouse.github.collab_edges")
      .overwritePartitions()

    println("✓ GraphAnalytics complete.")
    spark.stop()
  }
}
