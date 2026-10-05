import React from 'react'
import {
  Database,
  PlusCircle,
  RefreshCw,
} from 'lucide-react'
import { GithubIcon } from './GithubIcon'
import type { Repository } from '../types'

interface NavbarProps {
  repositories: Repository[]
  selectedRepo: Repository | null
  onSelectRepo: (repo: Repository) => void
  onOpenIngestModal: () => void
  onResync: () => void
  isResyncing: boolean
  backendStatus: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  repositories,
  selectedRepo,
  onSelectRepo,
  onOpenIngestModal,
  onResync,
  isResyncing,
  backendStatus,
}) => {
  return (
    <header className="navbar" role="banner">
      <div className="nav-brand">
        <div className="nav-logo-icon">
          <Database size={20} />
        </div>
        <div>
          <h1 className="nav-title">
            GitHub Analytics <span style={{ color: 'var(--primary-light)', fontWeight: 400 }}>Lakehouse</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            <span>Spark 3.5</span>
            <span>•</span>
            <span>Iceberg 1.4</span>
            <span>•</span>
            <span>MinIO S3</span>
            <span>•</span>
            <span>Kafka</span>
          </div>
        </div>
      </div>

      <div className="nav-actions">
        {/* Lakehouse Health Pill */}
        <div
          className={`badge ${backendStatus ? 'badge-emerald' : 'badge-rose'}`}
          title={backendStatus ? 'Connected to FastAPI & Lakehouse Storage' : 'FastAPI Offline'}
          style={{ padding: '6px 12px' }}
        >
          <span className="pulse-dot" style={{ backgroundColor: backendStatus ? '#10b981' : '#f43f5e' }} />
          <span>{backendStatus ? 'Lakehouse Online' : 'Engine Offline'}</span>
        </div>

        {/* Repository Selector */}
        {repositories.length > 0 && (
          <div className="repo-select-wrapper">
            <GithubIcon size={15} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <select
              id="repo-selector"
              className="repo-select"
              style={{ paddingLeft: '32px' }}
              value={selectedRepo ? `${selectedRepo.owner}/${selectedRepo.name}` : ''}
              onChange={(e) => {
                const found = repositories.find(
                  (r) => `${r.owner}/${r.name}` === e.target.value
                )
                if (found) onSelectRepo(found)
              }}
            >
              {repositories.map((r) => (
                <option key={r.id} value={`${r.owner}/${r.name}`}>
                  {r.owner}/{r.name} ({r.language || 'Code'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Re-sync Button */}
        {selectedRepo && (
          <button
            id="resync-btn"
            className="btn btn-secondary btn-sm"
            onClick={onResync}
            disabled={isResyncing}
            title="Incremental sync from GitHub"
          >
            <RefreshCw size={14} style={{ animation: isResyncing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isResyncing ? 'Syncing…' : 'Sync'}</span>
          </button>
        )}

        {/* Ingest New Repository Button */}
        <button
          id="open-ingest-modal-btn"
          className="btn btn-primary btn-sm"
          onClick={onOpenIngestModal}
        >
          <PlusCircle size={15} />
          <span>Ingest Repository</span>
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  )
}
