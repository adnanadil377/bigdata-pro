import {
  CollaborationGraphData,
  CommitTypeStat,
  ContributorPrediction,
  ContributorStat,
  IngestionJob,
  RealtimeEvent,
  RepoOverview,
  Repository,
} from '../types'

// Use relative /api endpoint (proxied by Vite in dev) or fallback to absolute
const API_BASE = '/api'

export async function fetchHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error('API server unreachable')
  return res.json()
}

export async function fetchRepositories(): Promise<Repository[]> {
  const res = await fetch(`${API_BASE}/repos`)
  if (!res.ok) throw new Error('Failed to fetch repositories')
  return res.json()
}

export async function fetchRepoOverview(owner: string, name: string): Promise<RepoOverview> {
  const res = await fetch(`${API_BASE}/repos/${owner}/${name}/overview`)
  if (!res.ok) throw new Error(`Failed to load overview for ${owner}/${name}`)
  return res.json()
}

export async function fetchCollaborationGraph(
  owner: string,
  name: string,
  minWeight: number = 2
): Promise<CollaborationGraphData> {
  const res = await fetch(
    `${API_BASE}/repos/${owner}/${name}/graph?min_weight=${minWeight}`
  )
  if (!res.ok) throw new Error(`Failed to load graph for ${owner}/${name}`)
  return res.json()
}

export async function fetchCommitTypes(owner: string, name: string): Promise<CommitTypeStat[]> {
  const res = await fetch(`${API_BASE}/repos/${owner}/${name}/commit-types`)
  if (!res.ok) throw new Error('Failed to load commit types')
  return res.json()
}

export async function fetchContributorStats(
  owner: string,
  name: string,
  limit: number = 100
): Promise<ContributorStat[]> {
  const res = await fetch(`${API_BASE}/repos/${owner}/${name}/stats?limit=${limit}`)
  if (!res.ok) throw new Error('Failed to load contributor stats')
  return res.json()
}

export async function fetchContributorPrediction(
  login: string
): Promise<ContributorPrediction[]> {
  const res = await fetch(`${API_BASE}/contributors/${encodeURIComponent(login)}/prediction`)
  if (!res.ok) return []
  return res.json()
}

export async function triggerIngestion(payload: {
  repo_url: string
  access_token?: string
  branch?: string
}): Promise<{ job_id: string; owner: string; name: string; status: string; message: string }> {
  const res = await fetch(`${API_BASE}/repos/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to start ingestion' }))
    throw new Error(err.detail || 'Ingestion failed to start')
  }
  return res.json()
}

export async function fetchJobStatus(jobId: string): Promise<IngestionJob> {
  const res = await fetch(`${API_BASE}/repos/jobs/${jobId}`)
  if (!res.ok) throw new Error('Job not found')
  return res.json()
}

export async function fetchRecentJobs(): Promise<IngestionJob[]> {
  const res = await fetch(`${API_BASE}/repos/jobs?limit=15`)
  if (!res.ok) return []
  return res.json()
}

export async function triggerResync(owner: string, name: string): Promise<{ job_id: string }> {
  const res = await fetch(`${API_BASE}/repos/${owner}/${name}/sync`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to trigger re-sync')
  return res.json()
}

export function subscribeToRealtimeEvents(
  onEvent: (event: RealtimeEvent) => void,
  repo?: string
): () => void {
  const url = repo
    ? `${API_BASE}/realtime/events?repo=${encodeURIComponent(repo)}`
    : `${API_BASE}/realtime/events`

  let eventSource: EventSource | null = null
  let isClosed = false

  try {
    eventSource = new EventSource(url)
    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data)
        onEvent(parsed)
      } catch (err) {
        console.error('Failed to parse SSE event data', err)
      }
    }
    eventSource.onerror = () => {
      // In dev mode or when topic has no events, keep quiet and retry automatically
    }
  } catch (err) {
    console.warn('SSE subscription failed to initialize', err)
  }

  return () => {
    isClosed = true
    if (eventSource) {
      eventSource.close()
    }
  }
}
