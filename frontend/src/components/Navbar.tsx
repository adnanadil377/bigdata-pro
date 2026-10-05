import React from 'react'
import {
  ChevronDown,
  Layers,
  Plus,
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
    <header className="app-header">
      {/* Brand & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              background: '#18181b',
              border: '1px solid var(--border-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
            }}
          >
            <Layers size={14} />
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            bigdata-pro
          </span>
        </div>

        <span style={{ color: 'var(--text-dim)' }}>/</span>

        {/* Repository Switcher */}
        {repositories.length > 0 && selectedRepo && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              id="repo-selector"
              className="minimal-select"
              value={`${selectedRepo.owner}/${selectedRepo.name}`}
              onChange={(e) => {
                const found = repositories.find(
                  (r) => `${r.owner}/${r.name}` === e.target.value
                )
                if (found) onSelectRepo(found)
              }}
            >
              {repositories.map((r) => (
                <option key={r.id} value={`${r.owner}/${r.name}`}>
                  {r.owner}/{r.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              style={{
                position: 'absolute',
                right: '8px',
                pointerEvents: 'none',
                color: 'var(--text-muted)',
              }}
            />
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Engine Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-subtle)',
            background: '#0d0d0f',
          }}
          title={backendStatus ? 'Apache Iceberg + Spark + PostgreSQL operational' : 'Lakehouse API offline'}
        >
          <span
            className="pulse-dot"
            style={{ backgroundColor: backendStatus ? 'var(--status-emerald)' : 'var(--status-rose)' }}
          />
          <span className="mono">{backendStatus ? 'lakehouse.online' : 'offline'}</span>
        </div>

        {/* Sync Button */}
        {selectedRepo && (
          <button
            id="resync-btn"
            className="btn btn-secondary btn-sm"
            onClick={onResync}
            disabled={isResyncing}
            title="Fetch latest commits from GitHub"
          >
            <RefreshCw
              size={12}
              style={{
                animation: isResyncing ? 'spin 1s linear infinite' : 'none',
                opacity: isResyncing ? 1 : 0.7,
              }}
            />
            <span>{isResyncing ? 'Syncing' : 'Sync'}</span>
          </button>
        )}

        {/* Ingest Repository */}
        <button
          id="open-ingest-modal-btn"
          className="btn btn-primary btn-sm"
          onClick={onOpenIngestModal}
        >
          <Plus size={13} />
          <span>Ingest Repo</span>
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
