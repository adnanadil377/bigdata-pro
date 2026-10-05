export interface Repository {
  id: number
  owner: string
  name: string
  full_name: string
  stars: number
  forks: number
  language: string | null
  default_branch: string
  head_commit_hash: string | null
  is_private: boolean
  synced_at: string
}

export interface HealthScore {
  contributor_diversity: number
  contributor_retention: number
  collaboration: number
  commit_consistency: number
  bus_factor_safety: number
  overall: number
  bus_factor_count: number
  top_contributor_pct: number
  computed_at: string
}

export interface RepoMetrics {
  total_contributors: number
  total_commits: number
  total_insertions: number
  total_deletions: number
  total_files_changed: number
  first_commit_period: string
  last_commit_period: string
}

export interface BusFactorModule {
  module_path: string
  bus_factor: number
  top_owner: string
  top_owner_pct: number
  computed_at?: string
}

export interface RepoOverview {
  repository: Repository
  health: HealthScore | null
  metrics: RepoMetrics
  critical_modules: BusFactorModule[]
}

export interface GraphNode {
  id: string
  degree?: number
  commits?: number
  x?: number
  y?: number
  vx?: number
  vy?: number
}

export interface GraphEdge {
  source: string | GraphNode
  target: string | GraphNode
  weight: number
  type: string
}

export interface CollaborationGraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface CommitTypeStat {
  commit_type: string
  total: number
}

export interface ContributorStat {
  github_login: string
  email: string | null
  period: string
  commit_count: number
  insertions: number
  deletions: number
  files_changed: number
}

export interface ContributorPrediction {
  window_days: number
  probability: number
  cluster_label: string
  features: Record<string, any> | string
  predicted_at: string
}

export interface IngestionJob {
  id: string
  repo_url: string
  repo_owner: string
  repo_name: string
  branch: string
  status: 'queued' | 'cloning' | 'extracting' | 'lakehouse_write' | 'analytics' | 'completed' | 'failed'
  progress_pct: number
  current_step: string
  total_commits: number
  error_message: string | null
  started_at?: string
  completed_at?: string
  created_at: string
}

export interface RealtimeEvent {
  id: number | string
  event_type: string
  repo_full_name: string
  actor_login: string
  received_at: string
  payload?: any
}
