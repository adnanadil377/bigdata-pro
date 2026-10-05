name := "github-analytics-spark"
version := "0.1.0"
scalaVersion := "2.12.18"

val sparkVersion  = "3.5.0"
val icebergVersion = "1.4.3"

libraryDependencies ++= Seq(
  // Spark core
  "org.apache.spark" %% "spark-core"                  % sparkVersion % "provided",
  "org.apache.spark" %% "spark-sql"                   % sparkVersion % "provided",
  "org.apache.spark" %% "spark-mllib"                 % sparkVersion % "provided",
  "org.apache.spark" %% "spark-graphx"                % sparkVersion % "provided",
  "org.apache.spark" %% "spark-sql-kafka-0-10"        % sparkVersion,

  // Iceberg
  "org.apache.iceberg" %% "iceberg-spark-runtime-3.5" % icebergVersion,
  "org.apache.iceberg"  % "iceberg-aws"               % icebergVersion,

  // AWS S3 / MinIO
  "org.apache.hadoop"   % "hadoop-aws"                % "3.3.4",
  "com.amazonaws"       % "aws-java-sdk-bundle"        % "1.12.367",

  // Testing
  "org.scalatest"      %% "scalatest"                  % "3.2.17" % Test,
)

// Spark is provided at runtime, don't shade it in the uber-jar
assembly / assemblyMergeStrategy := {
  case PathList("META-INF", _*) => MergeStrategy.discard
  case _                        => MergeStrategy.first
}

// Don't include Spark in the fat jar
assembly / assemblyExcludedJars := {
  val cp = (assembly / fullClasspath).value
  cp filter { f =>
    val n = f.data.getName
    n.startsWith("spark-") || n.startsWith("scala-library") || n.startsWith("hadoop-")
  }
}

Test / fork := true
