"""
FastAPI serving layer for GitHub Contribution Analytics Lakehouse.

Endpoints:
  POST /repos/ingest                 – trigger asynchronous repo ingestion (unlimited depth, private token support)
  GET  /repos/jobs/{job_id}          – check ingestion job status & real-time progress
  GET  /repos/jobs                   – list recent ingestion jobs
  GET  /repos                        – list tracked repositories
  GET  /repos/{owner}/{name}/overview– comprehensive high-level analytics & metrics
  GET  /repos/{owner}/{name}/stats   – contributor stats (paginated, filterable by period)
  GET  /repos/{owner}/{name}/health  – project health score & breakdown
  GET  /repos/{owner}/{name}/busfactor– bus-factor per module
  GET  /repos/{owner}/{name}/graph   – collaboration graph edges (for D3 force graph)
  GET  /repos/{owner}/{name}/hotspots– top code modules and churn hot spots
  GET  /repos/{owner}/{name}/commit-types – commit type distribution
  POST /repos/{owner}/{name}/sync    – trigger an incremental sync / refresh
  DELETE /repos/{owner}/{name}       – delete repository and cascade analytics
  GET  /contributors/{login}/prediction – retention prediction + persona cluster
  GET  /realtime/events              – latest real-time events (SSE stream)
  GET  /health                       – service health check
"""
from __future__ import annotations

import asyncio
import json
import os
import uuid
from typing import AsyncGenerator

import asyncpg
from fastapi import BackgroundTasks, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from pipeline import parse_repo_url, run_ingestion_pipeline

# ── App ────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="GitHub Analytics Lakehouse API",
    description="Serves pre-computed analytics from the Spark + Iceberg lakehouse and manages asynchronous ingestion.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── DB pool ────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://analytics:analytics@postgres:5432/github_analytics",
)

_pool: asyncpg.Pool | None = None


async def pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    return _pool


@app.on_event("startup")
async def startup():
    await pool()


@app.on_event("shutdown")
async def shutdown():
    if _pool:
        await _pool.close()


# ── Health ─────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}


# ── Request Models ─────────────────────────────────────────────────────────
class IngestRequest(BaseModel):
    repo_url: str = Field(..., description="GitHub URL (e.g. https://github.com/owner/repo) or owner/repo shorthand")
    access_token: str | None = Field(None, description="GitHub Personal Access Token for private repositories")
    branch: str | None = Field(None, description="Target branch (defaults to remote default branch, e.g. main/master)")


# ── Ingestion Job Endpoints ────────────────────────────────────────────────
@app.post("/repos/ingest")
async def trigger_ingestion(req: IngestRequest, background_tasks: BackgroundTasks):
    """
    Submits a repository for ingestion:
    - Zero depth limits (full commit history on main/default branch).
    - Private repositories supported with personal access tokens.
    - Asynchronous processing with real-time status tracking.
    """
    try:
        owner, name = parse_repo_url(req.repo_url)
    except ValueError as e:
        raise HTTPException(400, str(e))

    job_id = uuid.uuid4()
    p = await pool()

    # Create job in PostgreSQL
    await p.execute(
        """
        INSERT INTO ingestion_jobs (id, repo_url, repo_owner, repo_name, branch, status, progress_pct, current_step)
        VALUES ($1, $2, $3, $4, $5, 'queued', 0, 'Queued in ingestion pipeline')
        """,
        job_id,
        req.repo_url,
        owner,
        name,
        req.branch or "main",
    )

    # Spawn async background worker
    background_tasks.add_task(
        run_ingestion_pipeline,
        str(job_id),
        req.repo_url,
        req.access_token,
        req.branch,
    )

    return {
        "job_id": str(job_id),
        "owner": owner,
        "name": name,
        "status": "queued",
        "message": f"Ingestion queued for {owner}/{name}. Poll /repos/jobs/{job_id} for progress.",
    }


@app.get("/repos/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Fetch status, progress percentage, commit counts, and error details of an ingestion job."""
    p = await pool()
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(400, "Invalid UUID format for job_id")

    row = await p.fetchrow("SELECT * FROM ingestion_jobs WHERE id = $1", job_uuid)
    if not row:
        raise HTTPException(404, f"Ingestion job '{job_id}' not found")

    return dict(row)


@app.get("/repos/jobs")
async def list_jobs(limit: int = Query(30, le=100)):
    """List recent repository ingestion jobs."""
    p = await pool()
    rows = await p.fetch(
        """
        SELECT id, repo_url, repo_owner, repo_name, branch, status,
               progress_pct, current_step, total_commits, error_message,
               started_at, completed_at, created_at
        FROM ingestion_jobs
        ORDER BY created_at DESC
        LIMIT $1
        """,
        limit,
    )
    return [dict(r) for r in rows]


# ── Repositories ───────────────────────────────────────────────────────────
@app.get("/repos")
async def list_repos():
    """List all tracked repositories with synchronization metadata."""
    p = await pool()
    rows = await p.fetch("""
        SELECT id, owner, name, full_name, stars, forks, language,
               default_branch, head_commit_hash, is_private, synced_at
        FROM repositories
        ORDER BY synced_at DESC
    """)
    return [dict(r) for r in rows]


@app.get("/repos/{owner}/{name}/overview")
async def repo_overview(owner: str, name: str):
    """Returns high-level analytics, health scores, and metrics for a repository."""
    p = await pool()
    repo = await p.fetchrow(
        """
        SELECT id, owner, name, full_name, stars, forks, language,
               default_branch, head_commit_hash, is_private, synced_at
        FROM repositories
        WHERE owner=$1 AND name=$2
        """,
        owner,
        name,
    )
    if not repo:
        raise HTTPException(404, f"Repository {owner}/{name} not found")

    repo_id = repo["id"]

    # Health score
    health_row = await p.fetchrow(
        """
        SELECT contributor_diversity, contributor_retention, collaboration,
               commit_consistency, bus_factor_safety, overall,
               bus_factor_count, top_contributor_pct, computed_at
        FROM health_scores
        WHERE repo_id = $1
        ORDER BY computed_at DESC
        LIMIT 1
        """,
        repo_id,
    )

    # Aggregates from commit_stats
    stats_agg = await p.fetchrow(
        """
        SELECT COUNT(DISTINCT contributor_id) AS total_contributors,
               COALESCE(SUM(commit_count), 0) AS total_commits,
               COALESCE(SUM(insertions), 0)   AS total_insertions,
               COALESCE(SUM(deletions), 0)    AS total_deletions,
               COALESCE(SUM(files_changed), 0)AS total_files_changed,
               MIN(period)                    AS first_commit_period,
               MAX(period)                    AS last_commit_period
        FROM commit_stats
        WHERE repo_id = $1
        """,
        repo_id,
    )

    # Top modules from bus factor
    top_modules = await p.fetch(
        """
        SELECT module_path, bus_factor, top_owner, top_owner_pct
        FROM bus_factor
        WHERE repo_id = $1
        ORDER BY top_owner_pct DESC
        LIMIT 5
        """,
        repo_id,
    )

    return {
        "repository": dict(repo),
        "health": dict(health_row) if health_row else None,
        "metrics": dict(stats_agg) if stats_agg else {},
        "critical_modules": [dict(m) for m in top_modules],
    }


@app.get("/repos/{owner}/{name}/hotspots")
async def repo_hotspots(owner: str, name: str, limit: int = Query(20, le=50)):
    """Returns modules with high churn or high ownership concentration."""
    p = await pool()
    repo = await p.fetchrow(
        "SELECT id FROM repositories WHERE owner=$1 AND name=$2", owner, name
    )
    if not repo:
        raise HTTPException(404, f"Repository {owner}/{name} not found")

    rows = await p.fetch(
        """
        SELECT module_path, bus_factor, top_owner, top_owner_pct, computed_at
        FROM bus_factor
        WHERE repo_id = $1
        ORDER BY top_owner_pct DESC
        LIMIT $2
        """,
        repo["id"],
        limit,
    )
    return [dict(r) for r in rows]


@app.post("/repos/{owner}/{name}/sync")
async def resync_repo(owner: str, name: str, background_tasks: BackgroundTasks):
    """Triggers a re-synchronization of an existing tracked repository."""
    p = await pool()
    repo = await p.fetchrow(
        "SELECT default_branch FROM repositories WHERE owner=$1 AND name=$2", owner, name
    )
    if not repo:
        raise HTTPException(404, f"Repository {owner}/{name} not found")

    repo_url = f"https://github.com/{owner}/{name}"
    branch = repo["default_branch"] or "main"
    job_id = uuid.uuid4()

    await p.execute(
        """
        INSERT INTO ingestion_jobs (id, repo_url, repo_owner, repo_name, branch, status, progress_pct, current_step)
        VALUES ($1, $2, $3, $4, $5, 'queued', 0, 'Re-sync queued')
        """,
        job_id,
        repo_url,
        owner,
        name,
        branch,
    )

    background_tasks.add_task(
        run_ingestion_pipeline,
        str(job_id),
        repo_url,
        None,
        branch,
    )

    return {
        "job_id": str(job_id),
        "status": "queued",
        "message": f"Re-sync queued for {owner}/{name}",
    }


@app.delete("/repos/{owner}/{name}")
async def delete_repo(owner: str, name: str):
    """Deletes a repository and cleans up all associated analytics tables."""
    p = await pool()
    repo = await p.fetchrow(
        "SELECT id FROM repositories WHERE owner=$1 AND name=$2", owner, name
    )
    if not repo:
        raise HTTPException(404, f"Repository {owner}/{name} not found")

    repo_id = repo["id"]
    async with p.acquire() as conn:
        async with conn.transaction():
            await conn.execute("DELETE FROM commit_stats WHERE repo_id = $1", repo_id)
            await conn.execute("DELETE FROM commit_types WHERE repo_id = $1", repo_id)
            await conn.execute("DELETE FROM health_scores WHERE repo_id = $1", repo_id)
            await conn.execute("DELETE FROM bus_factor WHERE repo_id = $1", repo_id)
            await conn.execute("DELETE FROM collaboration_edges WHERE repo_id = $1", repo_id)
            await conn.execute("DELETE FROM retention_predictions WHERE repo_id = $1", repo_id)
            await conn.execute("DELETE FROM ingestion_jobs WHERE repo_owner = $1 AND repo_name = $2", owner, name)
            await conn.execute("DELETE FROM repositories WHERE id = $1", repo_id)

    return {"status": "deleted", "repository": f"{owner}/{name}"}


# ── Contributor stats ──────────────────────────────────────────────────────
@app.get("/repos/{owner}/{name}/stats")
async def repo_stats(
    owner: str,
    name: str,
    limit: int = Query(50, le=500),
    period_from: str | None = None,
    period_to: str | None = None,
):
    p = await pool()
    repo = await p.fetchrow(
        "SELECT id FROM repositories WHERE owner=$1 AND name=$2", owner, name
    )
    if not repo:
        raise HTTPException(404, f"Repository {owner}/{name} not found")

    filters = ["cs.repo_id = $1"]
    params: list = [repo["id"]]
    if period_from:
        params.append(period_from)
        filters.append(f"cs.period >= ${len(params)}")
    if period_to:
        params.append(period_to)
        filters.append(f"cs.period <= ${len(params)}")

    where = " AND ".join(filters)
    rows = await p.fetch(
        f"""
        SELECT c.github_login, c.email,
               cs.period, cs.commit_count, cs.insertions, cs.deletions,
               cs.files_changed
        FROM commit_stats cs
        JOIN contributors c ON c.id = cs.contributor_id
        WHERE {where}
        ORDER BY cs.commit_count DESC
        LIMIT ${ len(params)+1 }
        """,
        *params,
        limit,
    )
    return [dict(r) for r in rows]


# ── Project health score ───────────────────────────────────────────────────
@app.get("/repos/{owner}/{name}/health")
async def repo_health(owner: str, name: str):
    p = await pool()
    repo = await p.fetchrow(
        "SELECT id FROM repositories WHERE owner=$1 AND name=$2", owner, name
    )
    if not repo:
        raise HTTPException(404, "Repository not found")

    row = await p.fetchrow(
        """
        SELECT contributor_diversity, contributor_retention, collaboration,
               commit_consistency, bus_factor_safety, overall,
               bus_factor_count, top_contributor_pct, computed_at
        FROM health_scores
        WHERE repo_id = $1
        ORDER BY computed_at DESC
        LIMIT 1
        """,
        repo["id"],
    )

    if not row:
        raise HTTPException(404, "No health score computed yet for this repo")
    return dict(row)


# ── Bus factor ─────────────────────────────────────────────────────────────
@app.get("/repos/{owner}/{name}/busfactor")
async def bus_factor(owner: str, name: str, limit: int = Query(20, le=100)):
    p = await pool()
    repo = await p.fetchrow(
        "SELECT id FROM repositories WHERE owner=$1 AND name=$2", owner, name
    )
    if not repo:
        raise HTTPException(404, "Repository not found")

    rows = await p.fetch(
        """
        SELECT module_path, bus_factor, top_owner, top_owner_pct, computed_at
        FROM bus_factor
        WHERE repo_id = $1
        ORDER BY top_owner_pct DESC
        LIMIT $2
        """,
        repo["id"],
        limit,
    )
    return [dict(r) for r in rows]


# ── Collaboration graph ────────────────────────────────────────────────────
@app.get("/repos/{owner}/{name}/graph")
async def collab_graph(owner: str, name: str, min_weight: int = 1):
    p = await pool()
    repo = await p.fetchrow(
        "SELECT id FROM repositories WHERE owner=$1 AND name=$2", owner, name
    )
    if not repo:
        raise HTTPException(404, "Repository not found")

    rows = await p.fetch(
        """
        SELECT dev_a, dev_b, SUM(weight) AS weight, relationship
        FROM collaboration_edges
        WHERE repo_id = $1
        GROUP BY dev_a, dev_b, relationship
        HAVING SUM(weight) >= $2
        ORDER BY weight DESC
        LIMIT 2000
        """,
        repo["id"],
        min_weight,
    )

    nodes = set()
    edges = []
    for r in rows:
        nodes.add(r["dev_a"])
        nodes.add(r["dev_b"])
        edges.append(
            {
                "source": r["dev_a"],
                "target": r["dev_b"],
                "weight": r["weight"],
                "type": r["relationship"],
            }
        )

    return {
        "nodes": [{"id": n} for n in sorted(list(nodes))],
        "edges": edges,
    }


# ── ML predictions ─────────────────────────────────────────────────────────
@app.get("/contributors/{login}/prediction")
async def contributor_prediction(login: str):
    p = await pool()
    contrib = await p.fetchrow(
        "SELECT id FROM contributors WHERE github_login=$1", login
    )
    if not contrib:
        raise HTTPException(404, "Contributor not found")

    rows = await p.fetch(
        """
        SELECT window_days, probability, cluster_label, features, predicted_at
        FROM retention_predictions
        WHERE contributor_id = $1
        ORDER BY window_days
        """,
        contrib["id"],
    )
    return [dict(r) for r in rows]


# ── Real-time SSE events ───────────────────────────────────────────────────
@app.get("/realtime/events")
async def realtime_events(repo: str | None = None):
    """Server-Sent Events stream of the latest GitHub events."""
    async def event_generator() -> AsyncGenerator[str, None]:
        p = await pool()
        last_id = 0
        while True:
            condition = "id > $1"
            params: list = [last_id]
            if repo:
                params.append(repo)
                condition += f" AND repo_full_name = ${len(params)}"

            rows = await p.fetch(
                f"""
                SELECT id, event_type, repo_full_name, actor_login, received_at
                FROM realtime_events
                WHERE {condition}
                ORDER BY id DESC
                LIMIT 20
                """,
                *params,
            )

            for row in rows:
                last_id = max(last_id, row["id"])
                data = json.dumps(dict(row), default=str)
                yield f"data: {data}\n\n"

            await asyncio.sleep(2)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Commit type distribution ───────────────────────────────────────────────
@app.get("/repos/{owner}/{name}/commit-types")
async def commit_types(owner: str, name: str, year: int | None = None):
    p = await pool()
    repo = await p.fetchrow(
        "SELECT id FROM repositories WHERE owner=$1 AND name=$2", owner, name
    )
    if not repo:
        raise HTTPException(404, "Repository not found")

    params: list = [repo["id"]]
    year_filter = ""
    if year:
        params.append(str(year))
        year_filter = f"AND EXTRACT(YEAR FROM period) = ${len(params)}"

    rows = await p.fetch(
        f"""
        SELECT commit_type, SUM(count) AS total
        FROM commit_types
        WHERE repo_id = $1 {year_filter}
        GROUP BY commit_type
        ORDER BY total DESC
        """,
        *params,
    )
    return [dict(r) for r in rows]
