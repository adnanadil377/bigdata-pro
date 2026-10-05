import React, { useEffect, useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  BrainCircuit,
  Database,
  ExternalLink,
  GitBranch,
  LayoutDashboard,
  Network,
  Radio,
} from 'lucide-react'
import { BusFactorRiskTable } from './components/BusFactorRiskTable'
import { CollaborationGraph } from './components/CollaborationGraph'
import { CommitAnalyticsView } from './components/CommitAnalyticsView'
import { ContributorRetentionView } from './components/ContributorRetentionView'
import { GithubIcon } from './components/GithubIcon'
import { HealthScorePanel } from './components/HealthScorePanel'
import { IngestionModal } from './components/IngestionModal'
import { LiveEventStream } from './components/LiveEventStream'
import { Navbar } from './components/Navbar'
import { OverviewCards } from './components/OverviewCards'
import {
  fetchCollaborationGraph,
  fetchCommitTypes,
  fetchContributorStats,
  fetchHealth,
  fetchRepoOverview,
  fetchRepositories,
  triggerResync,
} from './services/api'
import type {
  CollaborationGraphData,
  CommitTypeStat,
  ContributorStat,
  RepoOverview,
  Repository,
} from './types'

type ActiveTab = 'overview' | 'network' | 'commits' | 'retention' | 'stream'

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [overview, setOverview] = useState<RepoOverview | null>(null)
  const [graphData, setGraphData] = useState<CollaborationGraphData>({ nodes: [], edges: [] })
  const [commitTypes, setCommitTypes] = useState<CommitTypeStat[]>([])
  const [contributorStats, setContributorStats] = useState<ContributorStat[]>([])

  const [minGraphWeight, setMinGraphWeight] = useState(2)
  const [isLoading, setIsLoading] = useState(true)
  const [isGraphLoading, setIsGraphLoading] = useState(false)
  const [isResyncing, setIsResyncing] = useState(false)
  const [backendStatus, setBackendStatus] = useState(true)
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 1. Initial health & repositories load
  useEffect(() => {
    const init = async () => {
      try {
        await fetchHealth()
        setBackendStatus(true)
      } catch {
        setBackendStatus(false)
      }

      try {
        const repos = await fetchRepositories()
        setRepositories(repos)
        if (repos.length > 0) {
          setSelectedRepo(repos[0])
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to connect to serving database')
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  // 2. Load repository data whenever selectedRepo changes
  useEffect(() => {
    if (!selectedRepo) return

    const loadRepoData = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const [ov, ct, cs] = await Promise.all([
          fetchRepoOverview(selectedRepo.owner, selectedRepo.name),
          fetchCommitTypes(selectedRepo.owner, selectedRepo.name).catch(() => []),
          fetchContributorStats(selectedRepo.owner, selectedRepo.name, 150).catch(() => []),
        ])

        setOverview(ov)
        setCommitTypes(ct)
        setContributorStats(cs)
      } catch (err: any) {
        setErrorMessage(err.message || 'Error loading repository analytics')
      } finally {
        setIsLoading(false)
      }
    }

    loadRepoData()
  }, [selectedRepo])

  // 3. Load collaboration graph when tab or minWeight changes
  useEffect(() => {
    if (!selectedRepo || (activeTab !== 'network' && activeTab !== 'overview')) return

    const loadGraph = async () => {
      setIsGraphLoading(true)
      try {
        const data = await fetchCollaborationGraph(
          selectedRepo.owner,
          selectedRepo.name,
          minGraphWeight
        )
        setGraphData(data)
      } catch (err) {
        console.error('Failed to load graph data', err)
      } finally {
        setIsGraphLoading(false)
      }
    }

    loadGraph()
  }, [selectedRepo, minGraphWeight, activeTab])

  // Handle re-sync
  const handleResync = async () => {
    if (!selectedRepo) return
    setIsResyncing(true)
    try {
      await triggerResync(selectedRepo.owner, selectedRepo.name)
      setTimeout(async () => {
        const ov = await fetchRepoOverview(selectedRepo.owner, selectedRepo.name)
        setOverview(ov)
        setIsResyncing(false)
      }, 3000)
    } catch (err: any) {
      alert(err.message || 'Re-sync trigger failed')
      setIsResyncing(false)
    }
  }

  // Handle successful ingestion
  const handleIngestionSuccess = async (owner: string, name: string) => {
    try {
      const repos = await fetchRepositories()
      setRepositories(repos)
      const newlyAdded = repos.find((r) => r.owner === owner && r.name === name)
      if (newlyAdded) {
        setSelectedRepo(newlyAdded)
      } else if (repos.length > 0) {
        setSelectedRepo(repos[0])
      }
    } catch (err) {
      console.error('Failed to reload repositories', err)
    }
  }

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        repositories={repositories}
        selectedRepo={selectedRepo}
        onSelectRepo={(r) => setSelectedRepo(r)}
        onOpenIngestModal={() => setIsIngestModalOpen(true)}
        onResync={handleResync}
        isResyncing={isResyncing}
        backendStatus={backendStatus}
      />

      {/* Error Alert Banner */}
      {errorMessage && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Selected Repository Header Bar */}
      {selectedRepo && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            padding: '0 4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GithubIcon size={24} color="var(--primary-light)" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                  {selectedRepo.owner} / <span style={{ color: 'var(--primary-light)' }}>{selectedRepo.name}</span>
                </h1>
                <span className="badge badge-indigo">{selectedRepo.language || 'Codebase'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <GitBranch size={13} /> {selectedRepo.default_branch}
                </span>
                <span>•</span>
                <span>
                  Lakehouse Sync:{' '}
                  {selectedRepo.synced_at
                    ? new Date(selectedRepo.synced_at).toLocaleString()
                    : 'Realtime'}
                </span>
                <span>•</span>
                <a
                  href={`https://github.com/${selectedRepo.owner}/${selectedRepo.name}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  GitHub <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="tab-nav" aria-label="Dashboard Views">
            <button
              id="tab-overview"
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <LayoutDashboard size={16} />
              <span>Overview</span>
            </button>
            <button
              id="tab-network"
              className={`tab-btn ${activeTab === 'network' ? 'active' : ''}`}
              onClick={() => setActiveTab('network')}
            >
              <Network size={16} />
              <span>Collaboration Network</span>
            </button>
            <button
              id="tab-commits"
              className={`tab-btn ${activeTab === 'commits' ? 'active' : ''}`}
              onClick={() => setActiveTab('commits')}
            >
              <BarChart3 size={16} />
              <span>Commit Taxonomy</span>
            </button>
            <button
              id="tab-retention"
              className={`tab-btn ${activeTab === 'retention' ? 'active' : ''}`}
              onClick={() => setActiveTab('retention')}
            >
              <BrainCircuit size={16} />
              <span>ML Personas</span>
            </button>
            <button
              id="tab-stream"
              className={`tab-btn ${activeTab === 'stream' ? 'active' : ''}`}
              onClick={() => setActiveTab('stream')}
            >
              <Radio size={16} />
              <span>Live Telemetry</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      {overview ? (
        <main id="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              <OverviewCards overview={overview} />
              <HealthScorePanel health={overview.health} />
              {overview.critical_modules && overview.critical_modules.length > 0 && (
                <BusFactorRiskTable modules={overview.critical_modules} />
              )}
            </>
          )}

          {/* TAB 2: COLLABORATION GRAPH */}
          {activeTab === 'network' && (
            <CollaborationGraph
              data={graphData}
              isLoading={isGraphLoading}
              minWeight={minGraphWeight}
              onChangeMinWeight={setMinGraphWeight}
            />
          )}

          {/* TAB 3: COMMIT TAXONOMY */}
          {activeTab === 'commits' && (
            <CommitAnalyticsView
              commitTypes={commitTypes}
              contributorStats={contributorStats}
            />
          )}

          {/* TAB 4: ML PERSONAS & RETENTION */}
          {activeTab === 'retention' && (
            <ContributorRetentionView
              contributors={contributorStats}
              totalCommits={overview.metrics.total_commits}
            />
          )}

          {/* TAB 5: REALTIME STREAM */}
          {activeTab === 'stream' && (
            <LiveEventStream repoName={selectedRepo ? `${selectedRepo.owner}/${selectedRepo.name}` : undefined} />
          )}
        </main>
      ) : (
        <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-light)',
              }}
            >
              <Database size={28} />
            </div>
            <h2 style={{ fontSize: '1.35rem' }}>No Tracked Repositories Selected</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              The Lakehouse is initialized and ready. Submit your first repository to begin blobless historical ingestion and analytics computation.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setIsIngestModalOpen(true)}
              style={{ marginTop: '8px' }}
            >
              Ingest a Repository
            </button>
          </div>
        </div>
      )}

      {/* Ingestion Modal */}
      <IngestionModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onIngestionSuccess={handleIngestionSuccess}
      />
    </div>
  )
}

export default App
