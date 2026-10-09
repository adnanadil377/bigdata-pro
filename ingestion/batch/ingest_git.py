#!/usr/bin/env python3
"""
Batch ingestion: clone repositories using Git Smart Protocol
(--filter=blob:none --no-checkout) and extract commit metadata.
Writes raw data as Parquet to HDFS under:

  hdfs://namenode:9000/raw/git_events/repository=<owner>__<name>/commits.parquet

Usage:
    python ingest_git.py --repos torvalds/linux apache/spark
    python ingest_git.py --repos-file repos.txt
"""
from __future__ import annotations

import argparse
import io
import os
import subprocess
import tempfile
from pathlib import Path

import hdfs as hdfs_lib
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

# ── HDFS / WebHDFS config ──────────────────────────────────────────────────
HDFS_NAMENODE_URL = os.getenv("HDFS_NAMENODE_URL", "http://namenode:9870")
HDFS_USER         = os.getenv("HDFS_USER", "root")
OUTPUT_BASE       = os.getenv("HDFS_BASE_PATH", "/raw")


def hdfs_client() -> hdfs_lib.InsecureClient:
    """Return a WebHDFS client pointed at the NameNode."""
    return hdfs_lib.InsecureClient(HDFS_NAMENODE_URL, user=HDFS_USER)



# ── Git extraction ─────────────────────────────────────────────────────────
GIT_LOG_FORMAT = (
    "%H\x1f"   # commit hash
    "%ae\x1f"  # author email
    "%an\x1f"  # author name
    "%ce\x1f"  # committer email
    "%ai\x1f"  # author date ISO
    "%ci\x1f"  # committer date ISO
    "%P\x1f"   # parent hashes (space-separated)
    "%s"        # subject (commit message first line)
)


def clone_repo(url: str, target_dir: str, depth: int | None = None, branch: str | None = None, token: str | None = None) -> None:
    """Clone repo — full single-branch history with no depth limit unless specified."""
    clone_url = url
    if token and token.strip() and "github.com" in url:
        # inject token securely
        clean_url = url.replace("https://", "").replace("http://", "")
        clone_url = f"https://x-access-token:{token.strip()}@{clean_url}"

    cmd = ["git", "clone", "--single-branch", "--no-checkout"]
    if branch:
        cmd.extend(["-b", branch])
    if depth and depth > 0:
        cmd.extend(["--depth", str(depth)])
    cmd.extend([clone_url, target_dir])
    subprocess.run(
        cmd,
        check=True,
        capture_output=True,
    )


def extract_commits(repo_dir: str) -> list[dict]:
    """Run git log and parse into structured records."""
    result = subprocess.run(
        ["git", "log", f"--pretty=format:{GIT_LOG_FORMAT}", "--numstat"],
        cwd=repo_dir,
        capture_output=True,
        text=True,
        check=True,
    )

    commits: list[dict] = []
    current: dict | None = None

    for line in result.stdout.splitlines():
        parts = line.split("\x1f")
        if len(parts) == 8:
            # New commit header
            if current:
                commits.append(current)
            current = {
                "hash":            parts[0],
                "author_email":    parts[1],
                "author_name":     parts[2],
                "committer_email": parts[3],
                "author_date":     parts[4],
                "committer_date":  parts[5],
                "parents":         parts[6].split() if parts[6] else [],
                "subject":         parts[7],
                "insertions":      0,
                "deletions":       0,
                "files_changed":   0,
            }
        elif line.strip() and current is not None:
            # numstat line: insertions \t deletions \t filename
            cols = line.split("\t")
            if len(cols) == 3 and cols[0].isdigit():
                current["insertions"]    += int(cols[0])
                current["deletions"]     += int(cols[1])
                current["files_changed"] += 1

    if current:
        commits.append(current)

    return commits


def to_parquet_bytes(commits: list[dict]) -> bytes:
    df = pd.DataFrame(commits)
    df["author_date"]    = pd.to_datetime(df["author_date"],    utc=True).dt.tz_localize(None).astype("datetime64[us]")
    df["committer_date"] = pd.to_datetime(df["committer_date"], utc=True).dt.tz_localize(None).astype("datetime64[us]")
    df["parent_count"]   = df["parents"].apply(len)
    df["is_merge"]       = df["parent_count"] > 1
    df.drop(columns=["parents"], inplace=True)

    table = pa.Table.from_pandas(df)
    sink  = pa.BufferOutputStream()
    pq.write_table(table, sink, compression="snappy", coerce_timestamps="us")
    return sink.getvalue().to_pybytes()


def upload_to_hdfs(data: bytes, hdfs_path: str) -> None:
    """Write bytes to HDFS via the WebHDFS REST API."""
    client = hdfs_client()
    # Ensure parent directory exists
    parent = str(Path(hdfs_path).parent)
    client.makedirs(parent)
    with client.write(hdfs_path, overwrite=True) as writer:
        writer.write(data)
    print(f"  ✓ Uploaded hdfs://namenode:9000{hdfs_path}  ({len(data) / 1024:.1f} KB)")


# ── Main ───────────────────────────────────────────────────────────────────

def ingest_repo(full_name: str, depth: int | None = None, branch: str | None = None, token: str | None = None) -> None:
    owner, name = full_name.strip().split("/")
    url = f"https://github.com/{full_name}.git"
    partition = f"repository={owner}__{name}"
    hdfs_path  = f"{OUTPUT_BASE}/git_events/{partition}/commits.parquet"

    print(f"\n→ Ingesting {full_name} (branch={branch or 'default'}, depth={depth or 'all (no limit)'})")
    with tempfile.TemporaryDirectory() as tmpdir:
        print(f"  Cloning…")
        clone_repo(url, tmpdir, depth=depth, branch=branch, token=token)

        print(f"  Extracting commit log…")
        commits = extract_commits(tmpdir)
        print(f"  Found {len(commits):,} commits")

        if not commits:
            print("  ⚠ No commits found, skipping.")
            return

        data = to_parquet_bytes(commits)
        upload_to_hdfs(data, hdfs_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Git batch ingestion → HDFS Parquet")
    group  = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--repos",      nargs="+", help="List of owner/repo strings")
    group.add_argument("--repos-file", type=Path, help="File with one owner/repo per line")
    parser.add_argument("--branch",    type=str, default=None, help="Target branch (default: remote default branch)")
    parser.add_argument("--token",     type=str, default=None, help="GitHub Personal Access Token for private repositories")
    parser.add_argument("--depth",     type=int, default=0, help="Commit depth limit (default: 0 for all / no depth limit)")
    args = parser.parse_args()

    repos: list[str]
    if args.repos:
        repos = args.repos
    else:
        repos = [
            line.strip()
            for line in args.repos_file.read_text().splitlines()
            if line.strip() and not line.startswith("#")
        ]

    depth = args.depth if args.depth > 0 else None
    for repo in repos:
        try:
            ingest_repo(repo, depth=depth, branch=args.branch, token=args.token)
        except Exception as exc:
            print(f"  ✗ Failed {repo}: {exc}")

    print("\n✓ Batch ingestion complete.")


if __name__ == "__main__":
    main()
