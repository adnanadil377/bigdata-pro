// Use relative /api endpoint (proxied by Vite in dev) or fallback to absolute
const API_BASE = '/api';
export async function fetchHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok)
        throw new Error('API server unreachable');
    return res.json();
}
export async function fetchRepositories() {
    const res = await fetch(`${API_BASE}/repos`);
    if (!res.ok)
        throw new Error('Failed to fetch repositories');
    return res.json();
}
export async function fetchRepoOverview(owner, name) {
    const res = await fetch(`${API_BASE}/repos/${owner}/${name}/overview`);
    if (!res.ok)
        throw new Error(`Failed to load overview for ${owner}/${name}`);
    return res.json();
}
export async function fetchCollaborationGraph(owner, name, minWeight = 2) {
    const res = await fetch(`${API_BASE}/repos/${owner}/${name}/graph?min_weight=${minWeight}`);
    if (!res.ok)
        throw new Error(`Failed to load graph for ${owner}/${name}`);
    return res.json();
}
export async function fetchCommitTypes(owner, name) {
    const res = await fetch(`${API_BASE}/repos/${owner}/${name}/commit-types`);
    if (!res.ok)
        throw new Error('Failed to load commit types');
    return res.json();
}
export async function fetchContributorStats(owner, name, limit = 100) {
    const res = await fetch(`${API_BASE}/repos/${owner}/${name}/stats?limit=${limit}`);
    if (!res.ok)
        throw new Error('Failed to load contributor stats');
    return res.json();
}
export async function fetchContributorPrediction(login) {
    const res = await fetch(`${API_BASE}/contributors/${encodeURIComponent(login)}/prediction`);
    if (!res.ok)
        return [];
    return res.json();
}
export async function triggerIngestion(payload) {
    const res = await fetch(`${API_BASE}/repos/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to start ingestion' }));
        throw new Error(err.detail || 'Ingestion failed to start');
    }
    return res.json();
}
export async function fetchJobStatus(jobId) {
    const res = await fetch(`${API_BASE}/repos/jobs/${jobId}`);
    if (!res.ok)
        throw new Error('Job not found');
    return res.json();
}
export async function fetchRecentJobs() {
    const res = await fetch(`${API_BASE}/repos/jobs?limit=15`);
    if (!res.ok)
        return [];
    return res.json();
}
export async function triggerResync(owner, name) {
    const res = await fetch(`${API_BASE}/repos/${owner}/${name}/sync`, { method: 'POST' });
    if (!res.ok)
        throw new Error('Failed to trigger re-sync');
    return res.json();
}
export function subscribeToRealtimeEvents(onEvent, repo) {
    const url = repo
        ? `${API_BASE}/realtime/events?repo=${encodeURIComponent(repo)}`
        : `${API_BASE}/realtime/events`;
    let eventSource = null;
    let isClosed = false;
    try {
        eventSource = new EventSource(url);
        eventSource.onmessage = (e) => {
            try {
                const parsed = JSON.parse(e.data);
                onEvent(parsed);
            }
            catch (err) {
                console.error('Failed to parse SSE event data', err);
            }
        };
        eventSource.onerror = () => {
            // In dev mode or when topic has no events, keep quiet and retry automatically
        };
    }
    catch (err) {
        console.warn('SSE subscription failed to initialize', err);
    }
    return () => {
        isClosed = true;
        if (eventSource) {
            eventSource.close();
        }
    };
}
