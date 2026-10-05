-- GitHub Analytics serving database schema
-- Applied automatically by postgres container on first boot

-- ──────────────────────────────────────────────────────────
-- Repositories
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS repositories (
    id              SERIAL PRIMARY KEY,
    owner           TEXT NOT NULL,
    name            TEXT NOT NULL,
    full_name       TEXT GENERATED ALWAYS AS (owner || '/' || name) STORED,
    stars           INT  DEFAULT 0,
    forks           INT  DEFAULT 0,
    language        TEXT,
    default_branch  TEXT DEFAULT 'main',
    head_commit_hash TEXT,
    is_private      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ,
    synced_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (owner, name)
);

-- ──────────────────────────────────────────────────────────
-- Contributors
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contributors (
    id              SERIAL PRIMARY KEY,
    github_login    TEXT UNIQUE NOT NULL,
    email           TEXT,
    first_seen      DATE,
    last_seen       DATE,
    total_commits   BIGINT  DEFAULT 0,
    total_prs       INT     DEFAULT 0,
    total_reviews   INT     DEFAULT 0,
    total_issues    INT     DEFAULT 0
);

-- ──────────────────────────────────────────────────────────
-- Commit stats (pre-aggregated from Spark)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commit_stats (
    id              SERIAL PRIMARY KEY,
    repo_id         INT REFERENCES repositories(id),
    contributor_id  INT REFERENCES contributors(id),
    period          DATE   NOT NULL,          -- truncated to month
    commit_count    INT    DEFAULT 0,
    insertions      BIGINT DEFAULT 0,
    deletions       BIGINT DEFAULT 0,
    files_changed   INT    DEFAULT 0,
    UNIQUE (repo_id, contributor_id, period)
);

-- ──────────────────────────────────────────────────────────
-- Commit type distribution
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commit_types (
    id              SERIAL PRIMARY KEY,
    repo_id         INT REFERENCES repositories(id),
    period          DATE NOT NULL,
    commit_type     TEXT NOT NULL,   -- FEATURE | BUG_FIX | REFACTOR | DOCS | PERF | TEST | OTHER
    count           INT  DEFAULT 0,
    UNIQUE (repo_id, period, commit_type)
);

-- ──────────────────────────────────────────────────────────
-- ML predictions: contributor retention
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS retention_predictions (
    id              SERIAL PRIMARY KEY,
    contributor_id  INT REFERENCES contributors(id),
    repo_id         INT REFERENCES repositories(id),
    predicted_at    TIMESTAMPTZ DEFAULT NOW(),
    window_days     INT  NOT NULL,              -- 30 | 60 | 90
    probability     FLOAT NOT NULL,
    cluster_label   TEXT,                       -- K-Means cluster
    features        JSONB                       -- raw feature vector for explainability
);

-- ──────────────────────────────────────────────────────────
-- Graph analytics: collaboration edges
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collaboration_edges (
    id              SERIAL PRIMARY KEY,
    repo_id         INT  REFERENCES repositories(id),
    dev_a           TEXT NOT NULL,
    dev_b           TEXT NOT NULL,
    weight          INT  DEFAULT 1,
    relationship    TEXT NOT NULL,  -- same_file | reviewed_pr | same_pr
    period          DATE,
    UNIQUE (repo_id, dev_a, dev_b, relationship, period)
);

-- ──────────────────────────────────────────────────────────
-- Project health scores (computed by Spark, served here)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS health_scores (
    id                      SERIAL PRIMARY KEY,
    repo_id                 INT REFERENCES repositories(id),
    computed_at             TIMESTAMPTZ DEFAULT NOW(),
    contributor_diversity   FLOAT,
    contributor_retention   FLOAT,
    collaboration           FLOAT,
    commit_consistency      FLOAT,
    bus_factor_safety       FLOAT,
    overall                 FLOAT,
    bus_factor_count        INT,
    top_contributor_pct     FLOAT
);

-- ──────────────────────────────────────────────────────────
-- Bus-factor per module
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bus_factor (
    id              SERIAL PRIMARY KEY,
    repo_id         INT REFERENCES repositories(id),
    module_path     TEXT NOT NULL,
    bus_factor      INT  NOT NULL,
    top_owner       TEXT,
    top_owner_pct   FLOAT,
    computed_at     DATE,
    UNIQUE (repo_id, module_path, computed_at)
);

-- ──────────────────────────────────────────────────────────
-- Real-time events (latest from Kafka → Structured Streaming)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS realtime_events (
    id              BIGSERIAL PRIMARY KEY,
    event_type      TEXT NOT NULL,
    repo_full_name  TEXT NOT NULL,
    actor_login     TEXT,
    payload         JSONB,
    received_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON realtime_events (repo_full_name, received_at DESC);
CREATE INDEX ON commit_stats (repo_id, period DESC);
CREATE INDEX ON collaboration_edges (repo_id, weight DESC);

-- ──────────────────────────────────────────────────────────
-- Ingestion Jobs (Asynchronous repository processing)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingestion_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_url        TEXT NOT NULL,
    repo_owner      TEXT,
    repo_name       TEXT,
    branch          TEXT,
    status          TEXT NOT NULL DEFAULT 'queued', -- queued, cloning, extracting, lakehouse_write, analytics, completed, failed
    progress_pct    INT DEFAULT 0,
    current_step    TEXT DEFAULT 'Queued in pipeline',
    total_commits   INT DEFAULT 0,
    error_message   TEXT,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_created ON ingestion_jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_repo ON ingestion_jobs (repo_owner, repo_name);
