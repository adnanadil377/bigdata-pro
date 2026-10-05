# GitHub Contribution Analytics Lakehouse

> **A scalable lakehouse-based platform for large-scale GitHub contribution
> intelligence** — combining historical Git analysis, real-time event
> processing, distributed analytics, graph-based collaboration analysis, and
> contributor behaviour prediction.

---

## Architecture

```
                         ┌─────────────────┐
                         │     GitHub      │
                         └────────┬────────┘
                                  │
                ┌─────────────────┴──────────────────┐
                │                                    │
         Historical Data                       Live Events
                │                                    │
      Git Smart Protocol                         Kafka
      (blobless clone)                    (github.events.raw)
                │                                    │
                │                          Spark Structured
                │                              Streaming
                │                                    │
                └─────────────────┬──────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  Apache Spark   │
                         │  Scala + SQL    │
                         └────────┬────────┘
                                  │
                ┌─────────────────┼───────────────────┐
                │                 │                   │
                ▼                 ▼                   ▼
          Contribution       Temporal            Graph
           Analytics         Analytics          Analytics
         (CommitETL)    (temporal windows)  (GraphAnalytics)
                │                 │                   │
                └─────────────────┼───────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Apache Iceberg + Parquet│
                    │  on MinIO (S3-compat)   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                  Hive                    Spark ML
              (SQL analytics)      (ContributorMLPipeline)
                    │               · RetentionForest
                    │               · KMeans Clusters
                    └────────────┬────────────┘
                                 │
                                 ▼
                            PostgreSQL
                                 │
                             FastAPI
                                 │
                              React
                                 │
                          Analytics Dashboard
```

---

## Why This Stack?

| Technology | Role | Why here, not somewhere else |
|---|---|---|
| **Git Smart Protocol** | Historical ingestion | `--filter=blob:none` fetches only metadata; no 50 GB source trees |
| **Kafka** | Real-time GitHub Events | Makes streaming genuinely necessary, not artificially bolted on |
| **Apache Spark (Scala)** | Core processing engine | Unified batch + streaming; Scala gives type-safe, production-grade transforms |
| **Structured Streaming** | Real-time pipeline | Modern replacement for DStream; integrates with Iceberg sinks |
| **Apache Iceberg** | Lakehouse table format | Schema evolution, time-travel, ACID ops, partition evolution on Parquet |
| **Parquet** | Columnar storage | Efficient analytics queries; 10–50× smaller than raw JSON |
| **MinIO** | Object storage | Local S3-compatible layer; swap for AWS S3 / GCS with zero code changes |
| **Hive Metastore** | SQL catalog | External table layer over Iceberg for ad-hoc HiveQL queries |
| **Spark MLlib** | ML | Contributor retention prediction (RandomForest) + role clustering (K-Means) |
| **GraphX** | Graph analytics | PageRank + degree centrality for collaboration network; bus-factor analysis |
| **PostgreSQL** | Serving layer | Low-latency reads for dashboard; Spark writes pre-aggregated results here |
| **FastAPI** | API | Async, typed, SSE streaming for real-time feed |
| **React** | Dashboard | D3 force graph, charts, real-time event feed |

---

## Project Layout

```
bigdata-pro/
├── docker-compose.yml            ← entire stack: one command to start
│
├── ingestion/
│   ├── batch/
│   │   └── ingest_git.py         ← Git blobless clone → MinIO Parquet
│   └── streaming/
│       └── kafka_producer.py     ← GitHub Events API → Kafka (ETag polling)
│
├── spark/
│   ├── build.sbt                 ← Spark 3.5 + Iceberg 1.4 + Kafka connector
│   ├── etl/
│   │   └── .../CommitETL.scala   ← Batch ETL: raw Parquet → Iceberg tables
│   ├── streaming/
│   │   └── .../GitHubStreamProcessor.scala  ← Kafka → Iceberg (Structured Streaming)
│   ├── ml/
│   │   └── .../ContributorMLPipeline.scala  ← Retention RF + KMeans clustering
│   └── graph/
│       └── .../GraphAnalytics.scala         ← GraphX: PageRank, bus-factor
│
├── lakehouse/                    ← (Iceberg table DDL reference scripts)
│
├── serving/
│   ├── api/
│   │   ├── main.py               ← FastAPI async API + SSE real-time stream
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── db/
│       └── init.sql              ← PostgreSQL schema (auto-applied on first boot)
│
├── frontend/                     ← React analytics dashboard (next layer)
│
└── infra/
    └── postgres/
        └── init.sql              ← PostgreSQL schema
```

---

## Lakehouse Data Model

```
s3://raw/                           ← raw ingest
  git_events/
    repository=apache__spark/
      commits.parquet

s3://warehouse/                     ← Iceberg managed tables
  github/
    commits/                        ← partitioned by (repository, author_month)
    contributor_stats/              ← monthly rollup
    commit_types/                   ← message classification distribution
    realtime_events/                ← partitioned by event_date (streaming)
    streaming_stats/                ← 5-min window aggregates
    retention_predictions/          ← ML output
    graph_metrics/                  ← PageRank, degree centrality
    collab_edges/                   ← developer graph edges
    bus_factor/                     ← per-repo bus factor
```

---

## Getting Started

### 1. Prerequisites

```bash
# Required
docker >= 24.0
docker compose >= 2.20
python >= 3.11
sbt >= 1.9 (for Spark Scala jobs)
git
```

### 2. Start the stack

```bash
cd bigdata-pro
docker compose up -d
```

Services will be available at:

| Service | URL |
|---|---|
| Spark Master UI | http://localhost:8080 |
| Kafka UI | http://localhost:8090 |
| MinIO Console | http://localhost:9001 (minioadmin / minioadmin) |
| FastAPI docs | http://localhost:8000/docs |
| React Dashboard | http://localhost:3000 |

### 3. Ingest a demo repository

```bash
cd ingestion/batch
pip install boto3 pandas pyarrow

# For a small demo, use a personal or test repo first
GITHUB_TOKEN=ghp_xxx python ingest_git.py --repos torvalds/linux

# Or a smaller repo for faster testing
python ingest_git.py --repos expressjs/express
```

### 4. Run the batch ETL (Scala / Spark)

```bash
cd spark
sbt assembly   # builds the fat jar

docker exec spark-master spark-submit \
  --master spark://spark-master:7077 \
  --class analytics.CommitETL \
  /path/to/github-analytics-spark-assembly-0.1.0.jar
```

### 5. Start real-time Kafka producer

```bash
cd ingestion/streaming
pip install confluent-kafka requests

GITHUB_TOKEN=ghp_xxx \
KAFKA_BOOTSTRAP=localhost:9092 \
python kafka_producer.py --repos expressjs/express --interval 60
```

### 6. Start Structured Streaming job

```bash
docker exec spark-master spark-submit \
  --master spark://spark-master:7077 \
  --class analytics.GitHubStreamProcessor \
  /path/to/github-analytics-spark-assembly-0.1.0.jar
```

### 7. Run ML pipeline

```bash
# Predict 90-day contributor retention
docker exec spark-master spark-submit \
  --master spark://spark-master:7077 \
  --class analytics.ContributorMLPipeline \
  /path/to/github-analytics-spark-assembly-0.1.0.jar 90
```

### 8. Run Graph analytics

```bash
docker exec spark-master spark-submit \
  --master spark://spark-master:7077 \
  --class analytics.GraphAnalytics \
  /path/to/github-analytics-spark-assembly-0.1.0.jar
```

---

## Dashboard Capabilities

### Repository Overview
- Total commits, contributors, PRs, issues
- Activity timeline

### Contributor Analytics
- Top contributors by commits / insertions / retention probability
- New vs returning contributors per month
- Contributor churn heatmap

### Code Analytics
- Commit type distribution (Feature / Bug Fix / Refactor / Docs / Perf / Test)
- Code churn over time (insertions vs deletions)
- Monthly activity patterns

### Collaboration Network
- D3 force-directed graph of developer co-activity
- PageRank-based core maintainer identification
- Community detection / clusters

### ML Insights
- Contributor retention probability table (30 / 60 / 90 day windows)
- Contributor role clusters (K-Means k=5)
- ⚠ Bus-factor risk alerts per module

### Real-time Feed
- Live GitHub event stream (via Kafka + SSE)
- Active contributor list (last 60 minutes)
- Contribution spike detection

---

## Hive SQL Analytics (demonstration)

```sql
-- Run in HiveServer2 or Beeline against Iceberg external tables

-- Top contributors across all repos
SELECT author_email,
       SUM(commit_count)   AS total_commits,
       SUM(insertions)     AS total_insertions,
       SUM(deletions)      AS total_deletions
FROM   contributor_stats
GROUP  BY author_email
ORDER  BY total_commits DESC
LIMIT  20;

-- Monthly commit type distribution
SELECT   author_month,
         commit_type,
         SUM(count) AS count
FROM     commit_types
GROUP BY author_month, commit_type
ORDER BY author_month DESC;
```

Hive is used here as a **SQL analytics window** over the Iceberg lakehouse —
not as the primary processing engine. All heavy lifting happens in Spark.

---

## Presenting This Project

**Don't say**: *"We used Hadoop, Hive, Spark, Kafka and ML."*

**Say instead**:

> We built a scalable lakehouse-based platform for large-scale GitHub
> contribution intelligence. Historical commit data is extracted efficiently
> using Git's blobless clone protocol and stored as Parquet in object storage.
> Apache Iceberg provides the lakehouse table format with schema evolution,
> time-travel queries, and ACID semantics. Apache Spark (Scala) processes both
> the historical batch data and a live GitHub event stream via Structured
> Streaming. Spark MLlib predicts contributor retention and discovers
> collaboration clusters, while a GraphX-powered network analysis identifies
> core maintainers and modules at bus-factor risk.

---

## Roadmap

- [ ] React dashboard (D3 graph + chart components)
- [ ] Hive external table DDL scripts
- [ ] Project Health Score computation job
- [ ] GitHub App webhook receiver (replace polling)
- [ ] Temporal cohort analysis (contributor lifecycle)
- [ ] Spark vs Hive query comparison demo
- [ ] Tests: ScalaTest unit tests for ETL transforms
