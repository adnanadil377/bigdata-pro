#!/usr/bin/env python3
"""
Sync aggregated analytics from HDFS raw / lakehouse Parquet directly into PostgreSQL serving tables:
  - repositories
  - contributors
  - commit_stats
  - commit_types
"""
import io
import os
import hdfs as hdfs_lib
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

HDFS_NAMENODE_URL = os.getenv("HDFS_NAMENODE_URL", "http://localhost:9870")
HDFS_USER         = os.getenv("HDFS_USER", "root")
HDFS_BASE_PATH    = os.getenv("HDFS_BASE_PATH", "/raw")
POSTGRES_HOST  = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT  = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB    = os.getenv("POSTGRES_DB", "github_analytics")
POSTGRES_USER  = os.getenv("POSTGRES_USER", "analytics")
POSTGRES_PASS  = os.getenv("POSTGRES_PASSWORD", "analytics")

def get_hdfs_client() -> hdfs_lib.InsecureClient:
    return hdfs_lib.InsecureClient(HDFS_NAMENODE_URL, user=HDFS_USER)

def sync_repo(repo_full_name: str):
    owner, name = repo_full_name.split("/")
    hdfs_path = f"{HDFS_BASE_PATH}/git_events/repository={owner}__{name}/commits.parquet"

    print(f"\n→ Reading hdfs://namenode:9000{hdfs_path} for PostgreSQL serving sync...")
    client = get_hdfs_client()
    with client.read(hdfs_path) as reader:
        df = pd.read_parquet(io.BytesIO(reader.read()))

    conn = psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        dbname=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASS,
    )
    cur = conn.cursor()

    # 1. Upsert repository
    cur.execute(
        """
        INSERT INTO repositories (owner, name, stars, forks, language, synced_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
        ON CONFLICT (owner, name) DO UPDATE
        SET synced_at = EXCLUDED.synced_at
        RETURNING id;
        """,
        (owner, name, 64000, 11000, "JavaScript"),
    )
    repo_id = cur.fetchone()[0]
    print(f"  ✓ Repository '{owner}/{name}' synced (ID={repo_id})")

    # 2. Upsert contributors
    contributors = (
        df.groupby(["author_email", "author_name"])
        .agg(
            first_seen=("author_date", "min"),
            last_seen=("author_date", "max"),
            total_commits=("hash", "count"),
        )
        .reset_index()
    )

    contrib_map = {}
    for _, row in contributors.iterrows():
        login = row["author_name"]
        email = row["author_email"]
        cur.execute(
            """
            INSERT INTO contributors (github_login, email, first_seen, last_seen, total_commits)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (github_login) DO UPDATE
            SET last_seen = EXCLUDED.last_seen,
                total_commits = contributors.total_commits + EXCLUDED.total_commits
            RETURNING id;
            """,
            (
                login,
                email,
                row["first_seen"].date(),
                row["last_seen"].date(),
                int(row["total_commits"]),
            ),
        )
        cid = cur.fetchone()[0]
        contrib_map[login] = cid

    print(f"  ✓ {len(contrib_map)} Contributors synced")

    # 3. Upsert commit_stats (monthly rollup per contributor)
    df["period"] = pd.to_datetime(df["author_date"]).dt.to_period("M").dt.to_timestamp().dt.date
    stats = (
        df.groupby(["author_name", "period"])
        .agg(
            commit_count=("hash", "count"),
            insertions=("insertions", "sum"),
            deletions=("deletions", "sum"),
            files_changed=("files_changed", "sum"),
        )
        .reset_index()
    )

    stat_records = [
        (
            repo_id,
            contrib_map[row["author_name"]],
            row["period"],
            int(row["commit_count"]),
            int(row["insertions"]),
            int(row["deletions"]),
            int(row["files_changed"]),
        )
        for _, row in stats.iterrows()
        if row["author_name"] in contrib_map
    ]

    execute_values(
        cur,
        """
        INSERT INTO commit_stats (repo_id, contributor_id, period, commit_count, insertions, deletions, files_changed)
        VALUES %s
        ON CONFLICT (repo_id, contributor_id, period) DO UPDATE
        SET commit_count  = EXCLUDED.commit_count,
            insertions    = EXCLUDED.insertions,
            deletions     = EXCLUDED.deletions,
            files_changed = EXCLUDED.files_changed;
        """,
        stat_records,
    )
    print(f"  ✓ {len(stat_records)} Commit monthly stats records synced")

    # 4. Commit types
    rules = [
        ("(?i)(fix|bug|patch|hotfix|error|exception|crash|defect)", "BUG_FIX"),
        ("(?i)(feat|feature|add|implement|new|introduce|support)", "FEATURE"),
        ("(?i)(refactor|clean|restructure|reorganize|rename|move)", "REFACTOR"),
        ("(?i)(doc|docs|readme|changelog|comment|javadoc|kdoc)", "DOCUMENTATION"),
        ("(?i)(perf|performance|optim|speed|fast|latency|memory)", "PERFORMANCE"),
        ("(?i)(test|spec|coverage|unit|integration|e2e)", "TEST"),
        ("(?i)(security|auth|cve|vuln|xss|sql.inject|sanitize)", "SECURITY"),
        ("(?i)(ci|cd|deploy|release|version|bump|publish|workflow)", "DEVOPS"),
    ]

    def classify(s):
        if not isinstance(s, str):
            return "OTHER"
        import re
        for pat, cat in rules:
            if re.search(pat, s):
                return cat
        return "OTHER"

    df["commit_type"] = df["subject"].apply(classify)
    type_stats = (
        df.groupby(["period", "commit_type"])
        .size()
        .reset_index(name="count")
    )

    type_records = [
        (repo_id, row["period"], row["commit_type"], int(row["count"]))
        for _, row in type_stats.iterrows()
    ]

    execute_values(
        cur,
        """
        INSERT INTO commit_types (repo_id, period, commit_type, count)
        VALUES %s
        ON CONFLICT (repo_id, period, commit_type) DO UPDATE
        SET count = EXCLUDED.count;
        """,
        type_records,
    )
    print(f"  ✓ {len(type_records)} Commit type records synced")

    conn.commit()
    cur.close()
    conn.close()
    print("✓ PostgreSQL serving layer sync complete!\n")

if __name__ == "__main__":
    sync_repo("expressjs/express")
