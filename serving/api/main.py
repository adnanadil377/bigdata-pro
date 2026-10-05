"""
FastAPI serving layer for GitHub Contribution Analytics Lakehouse.

Endpoints:
  GET /repos                         – list tracked repositories
  GET /repos/{owner}/{name}/stats    – contributor stats (paginated, filterable by period)
  GET /repos/{owner}/{name}/health   – project health score
  GET /repos/{owner}/{name}/busfactor – bus-factor per module
  GET /repos/{owner}/{name}/graph    – collaboration graph edges (for D3 force graph)
  GET /contributors/{login}/prediction – retention prediction + cluster
  GET /realtime/events               – latest real-time events (SSE stream)
  GET /health                        – service health check
"""
from __future__ import annotations

import asyncio
import json
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncpg

# ── App ────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="GitHub Analytics Lakehouse API",
    description="Serves pre-computed analytics from the Spark + Iceberg lakehouse.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── DB pool ────────────────────────────────────────────────────────────────
import os
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://analytics:analytics@localhost:5432/github_analytics",
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


# ── Repositories ───────────────────────────────────────────────────────────
@app.get("/repos")
async def list_repos():
    p = await pool()
    rows = await p.fetch("""
        SELECT id, owner, name, full_name, stars, forks, language, synced_at
        FROM repositories
        ORDER BY stars DESC
    """)
    return [dict(r) for r in rows]


# ── Contributor stats ──────────────────────────────────────────────────────
@app.get("/repos/{owner}/{name}/stats")
async def repo_stats(
    owner: str,
    name:  str,
    limit: int = Query(50, le=500),
    period_from: str | None = None,
    period_to:   str | None = None,
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
    rows = await p.fetch(f"""
        SELECT c.github_login, c.email,
               cs.period, cs.commit_count, cs.insertions, cs.deletions,
               cs.files_changed
        FROM commit_stats cs
        JOIN contributors c ON c.id = cs.contributor_id
        WHERE {where}
        ORDER BY cs.commit_count DESC
        LIMIT ${ len(params)+1 }
    """, *params, limit)
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

    row = await p.fetchrow("""
        SELECT contributor_diversity, contributor_retention, collaboration,
               commit_consistency, bus_factor_safety, overall,
               bus_factor_count, top_contributor_pct, computed_at
        FROM health_scores
        WHERE repo_id = $1
        ORDER BY computed_at DESC
        LIMIT 1
    """, repo["id"])

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

    rows = await p.fetch("""
        SELECT module_path, bus_factor, top_owner, top_owner_pct, computed_at
        FROM bus_factor
        WHERE repo_id = $1
        ORDER BY top_owner_pct DESC
        LIMIT $2
    """, repo["id"], limit)
    return [dict(r) for r in rows]


# ── Collaboration graph ────────────────────────────────────────────────────
@app.get("/repos/{owner}/{name}/graph")
async def collab_graph(owner: str, name: str, min_weight: int = 2):
    p = await pool()
    repo = await p.fetchrow(
        "SELECT id FROM repositories WHERE owner=$1 AND name=$2", owner, name
    )
    if not repo:
        raise HTTPException(404, "Repository not found")

    rows = await p.fetch("""
        SELECT dev_a, dev_b, weight, relationship
        FROM collaboration_edges
        WHERE repo_id = $1 AND weight >= $2
        ORDER BY weight DESC
        LIMIT 2000
    """, repo["id"], min_weight)

    nodes = set()
    edges = []
    for r in rows:
        nodes.add(r["dev_a"])
        nodes.add(r["dev_b"])
        edges.append({"source": r["dev_a"], "target": r["dev_b"],
                      "weight": r["weight"], "type": r["relationship"]})

    return {
        "nodes": [{"id": n} for n in nodes],
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

    rows = await p.fetch("""
        SELECT window_days, probability, cluster_label, features, predicted_at
        FROM retention_predictions
        WHERE contributor_id = $1
        ORDER BY window_days
    """, contrib["id"])
    return [dict(r) for r in rows]


# ── Real-time SSE events ───────────────────────────────────────────────────
@app.get("/realtime/events")
async def realtime_events(repo: str | None = None):
    """
    Server-Sent Events stream of the latest GitHub events.
    The client polls Postgres for new rows every 2 seconds.
    """
    async def event_generator() -> AsyncGenerator[str, None]:
        p = await pool()
        last_id = 0
        while True:
            condition = "id > $1"
            params: list = [last_id]
            if repo:
                params.append(repo)
                condition += f" AND repo_full_name = ${len(params)}"

            rows = await p.fetch(f"""
                SELECT id, event_type, repo_full_name, actor_login, received_at
                FROM realtime_events
                WHERE {condition}
                ORDER BY id DESC
                LIMIT 20
            """, *params)

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

    rows = await p.fetch(f"""
        SELECT commit_type, SUM(count) AS total
        FROM commit_types
        WHERE repo_id = $1 {year_filter}
        GROUP BY commit_type
        ORDER BY total DESC
    """, *params)
    return [dict(r) for r in rows]
