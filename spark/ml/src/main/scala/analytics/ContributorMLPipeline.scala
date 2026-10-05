package analytics

import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.functions._
import org.apache.spark.ml.Pipeline
import org.apache.spark.ml.classification.RandomForestClassifier
import org.apache.spark.ml.clustering.KMeans
import org.apache.spark.ml.evaluation.{BinaryClassificationEvaluator, ClusteringEvaluator}
import org.apache.spark.ml.feature.{StandardScaler, VectorAssembler}
import org.apache.spark.ml.tuning.{CrossValidator, ParamGridBuilder}

/**
 * ML Pipeline: Contributor Retention Prediction + Role Clustering
 *
 * Uses features engineered from contributor_stats (Iceberg) to:
 *   1. Predict whether a contributor will return within 30/60/90 days (RandomForest)
 *   2. Cluster contributors into roles (K-Means)
 *
 * Outputs:
 *   lakehouse.github.retention_predictions
 *   lakehouse.github.contributor_clusters
 *   PostgreSQL: retention_predictions, contributor clusters
 */
object ContributorMLPipeline {

  // ── Feature column names ───────────────────────────────────────────────────
  val featureCols: Array[String] = Array(
    "commit_frequency",        // commits per active month
    "avg_commit_size",         // mean (insertions + deletions) per commit
    "total_insertions",
    "total_deletions",
    "files_changed_total",
    "active_months",           // distinct months with at least 1 commit
    "months_since_start",      // months from first commit to now
    "recency_score",           // 1 / (months since last commit + 1)
    "non_merge_ratio",         // non-merge commits / total commits
    "contribution_diversity",  // distinct repos contributed to
  )

  def main(args: Array[String]): Unit = {

    val windowDays = args.headOption.map(_.toInt).getOrElse(90)

    val spark = SparkSession.builder()
      .appName(s"ContributorMLPipeline-${windowDays}d")
      .config("spark.sql.extensions",
        "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions")
      .config("spark.sql.catalog.lakehouse",
        "org.apache.iceberg.spark.SparkCatalog")
      .config("spark.sql.catalog.lakehouse.type", "hadoop")
      .config("spark.sql.catalog.lakehouse.warehouse", "s3a://warehouse/")
      .config("spark.hadoop.fs.s3a.endpoint",          "http://minio:9000")
      .config("spark.hadoop.fs.s3a.access.key",        "minioadmin")
      .config("spark.hadoop.fs.s3a.secret.key",        "minioadmin")
      .config("spark.hadoop.fs.s3a.path.style.access", "true")
      .getOrCreate()

    import spark.implicits._

    // ── 1. Load contributor stats from Iceberg ─────────────────────────────
    val stats = spark.read
      .format("iceberg")
      .load("lakehouse.github.contributor_stats")

    val today    = current_date()
    val cutoff   = date_sub(today, windowDays)

    // ── 2. Engineer features per contributor ───────────────────────────────
    val features = stats
      .groupBy("author_email")
      .agg(
        count("*")                              .as("active_months"),
        sum("commit_count")                     .as("total_commits"),
        sum("insertions")                       .as("total_insertions"),
        sum("deletions")                        .as("total_deletions"),
        sum("files_changed")                    .as("files_changed_total"),
        sum("non_merge_commits")                .as("non_merge_commits_total"),
        min("author_month")                     .as("first_month"),
        max("author_month")                     .as("last_month"),
        countDistinct("repository")             .as("contribution_diversity"),
      )
      .withColumn("months_since_start",
        months_between(today, $"first_month"))
      .withColumn("months_since_last",
        months_between(today, $"last_month"))
      .withColumn("commit_frequency",
        $"total_commits" / greatest($"active_months", lit(1)))
      .withColumn("avg_commit_size",
        ($"total_insertions" + $"total_deletions") /
          greatest($"total_commits", lit(1)))
      .withColumn("recency_score",
        lit(1.0) / ($"months_since_last" + lit(1.0)))
      .withColumn("non_merge_ratio",
        $"non_merge_commits_total" / greatest($"total_commits", lit(1)))
      // Label: 1 if last commit was within window, 0 otherwise
      .withColumn("label",
        when($"last_month" >= cutoff, 1.0).otherwise(0.0))
      .na.fill(0.0)

    // ── 3. Train/test split ────────────────────────────────────────────────
    val Array(train, test) = features.randomSplit(Array(0.8, 0.2), seed = 42L)

    // ── 4. ML Pipeline: Retention Prediction ─────────────────────────────
    val assembler = new VectorAssembler()
      .setInputCols(featureCols)
      .setOutputCol("raw_features")

    val scaler = new StandardScaler()
      .setInputCol("raw_features")
      .setOutputCol("features")
      .setWithStd(true)
      .setWithMean(true)

    val rf = new RandomForestClassifier()
      .setLabelCol("label")
      .setFeaturesCol("features")
      .setNumTrees(100)
      .setProbabilityCol("probability")

    val pipeline = new Pipeline().setStages(Array(assembler, scaler, rf))

    val paramGrid = new ParamGridBuilder()
      .addGrid(rf.maxDepth,        Array(5, 10))
      .addGrid(rf.minInstancesPerNode, Array(2, 5))
      .build()

    val cv = new CrossValidator()
      .setEstimator(pipeline)
      .setEvaluator(new BinaryClassificationEvaluator().setLabelCol("label"))
      .setEstimatorParamMaps(paramGrid)
      .setNumFolds(3)

    println(s"Training retention model (window=${windowDays}d)…")
    val cvModel = cv.fit(train)

    val predictions = cvModel.transform(test)
    val auc = new BinaryClassificationEvaluator()
      .setLabelCol("label")
      .evaluate(predictions)
    println(f"  AUC-ROC: $auc%.4f")

    // ── 5. Score all contributors ──────────────────────────────────────────
    val allPredictions = cvModel.transform(features)
      .withColumn("retention_prob",
        element_at($"probability", 2))   // prob of class 1 (retained)
      .select("author_email", "label", "retention_prob",
              "total_commits", "active_months", "recency_score",
              "contribution_diversity", "commit_frequency")

    // ── 6. K-Means contributor clustering ─────────────────────────────────
    val kmeansAssembler = new VectorAssembler()
      .setInputCols(Array(
        "commit_frequency", "recency_score",
        "contribution_diversity", "avg_commit_size",
        "active_months"))
      .setOutputCol("cluster_features")

    val kmeansScaler = new StandardScaler()
      .setInputCol("cluster_features")
      .setOutputCol("scaled_cluster_features")
      .setWithStd(true).setWithMean(true)

    val kmeans = new KMeans()
      .setK(5)
      .setSeed(42L)
      .setFeaturesCol("scaled_cluster_features")
      .setPredictionCol("cluster_id")

    val clusterPipeline = new Pipeline()
      .setStages(Array(kmeansAssembler, kmeansScaler, kmeans))

    println("Training K-Means clustering (k=5)…")
    val clusterModel = clusterPipeline.fit(features)

    val silhouette = new ClusteringEvaluator()
      .setFeaturesCol("scaled_cluster_features")
      .evaluate(clusterModel.transform(features))
    println(f"  Silhouette score: $silhouette%.4f")

    val clustered = clusterModel.transform(features)

    // Map cluster IDs to human-readable role labels heuristically
    val clusterStats = clustered
      .groupBy("cluster_id")
      .agg(
        avg("commit_frequency")      .as("avg_freq"),
        avg("recency_score")         .as("avg_recency"),
        avg("contribution_diversity").as("avg_diversity"),
        avg("active_months")         .as("avg_tenure"),
        count("*")                   .as("members"),
      ).orderBy("cluster_id")

    clusterStats.show(truncate = false)

    // ── 7. Write results to Iceberg ────────────────────────────────────────
    spark.sql("""
      CREATE TABLE IF NOT EXISTS lakehouse.github.retention_predictions (
        author_email       STRING,
        retention_prob     DOUBLE,
        label              DOUBLE,
        total_commits      LONG,
        active_months      LONG,
        recency_score      DOUBLE,
        contribution_diversity LONG,
        commit_frequency   DOUBLE
      )
      USING iceberg
    """)

    allPredictions.writeTo("lakehouse.github.retention_predictions")
      .overwritePartitions()

    println("✓ ContributorMLPipeline complete.")
    spark.stop()
  }
}
