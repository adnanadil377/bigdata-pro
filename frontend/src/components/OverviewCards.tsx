import React from 'react'
import {
  Code,
  FileCode2,
  GitCommit,
  GitFork,
  MinusCircle,
  PlusCircle,
  Users,
} from 'lucide-react'
import { RepoOverview } from '../types'

interface OverviewCardsProps {
  overview: RepoOverview
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({ overview }) => {
  const { repository, metrics } = overview

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'N/A'
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
      })
    } catch {
      return isoString
    }
  }

  const timespan =
    metrics.first_commit_period && metrics.last_commit_period
      ? `${formatDate(metrics.first_commit_period)} — ${formatDate(metrics.last_commit_period)}`
      : 'All history'

  return (
    <section className="metrics-grid" aria-label="Repository Metrics">
      {/* Total Commits */}
      <div className="glass-panel metric-card" style={{ '--card-accent': 'var(--primary)' } as React.CSSProperties}>
        <div className="metric-header">
          <span>Total Commits</span>
          <GitCommit size={16} color="var(--primary-light)" />
        </div>
        <div className="metric-value mono">
          {(metrics.total_commits || 0).toLocaleString()}
        </div>
        <div className="metric-subtext">
          <span>Time span: {timespan}</span>
        </div>
      </div>

      {/* Unique Contributors */}
      <div className="glass-panel metric-card" style={{ '--card-accent': 'var(--cyan)' } as React.CSSProperties}>
        <div className="metric-header">
          <span>Contributors</span>
          <Users size={16} color="var(--cyan)" />
        </div>
        <div className="metric-value mono">
          {(metrics.total_contributors || 0).toLocaleString()}
        </div>
        <div className="metric-subtext">
          <span>Active in lakehouse history</span>
        </div>
      </div>

      {/* Insertions */}
      <div className="glass-panel metric-card" style={{ '--card-accent': 'var(--emerald)' } as React.CSSProperties}>
        <div className="metric-header">
          <span>Lines Inserted</span>
          <PlusCircle size={16} color="var(--emerald)" />
        </div>
        <div className="metric-value mono" style={{ color: 'var(--emerald)' }}>
          +{(metrics.total_insertions || 0).toLocaleString()}
        </div>
        <div className="metric-subtext">
          <span>Code volume added</span>
        </div>
      </div>

      {/* Deletions */}
      <div className="glass-panel metric-card" style={{ '--card-accent': 'var(--rose)' } as React.CSSProperties}>
        <div className="metric-header">
          <span>Lines Deleted</span>
          <MinusCircle size={16} color="var(--rose)" />
        </div>
        <div className="metric-value mono" style={{ color: 'var(--rose)' }}>
          -{(metrics.total_deletions || 0).toLocaleString()}
        </div>
        <div className="metric-subtext">
          <span>Refactored & pruned code</span>
        </div>
      </div>

      {/* Files Modified */}
      <div className="glass-panel metric-card" style={{ '--card-accent': 'var(--amber)' } as React.CSSProperties}>
        <div className="metric-header">
          <span>Files Changed</span>
          <FileCode2 size={16} color="var(--amber)" />
        </div>
        <div className="metric-value mono">
          {(metrics.total_files_changed || 0).toLocaleString()}
        </div>
        <div className="metric-subtext">
          <span>Across all revisions</span>
        </div>
      </div>

      {/* Language & Branch */}
      <div className="glass-panel metric-card" style={{ '--card-accent': 'var(--violet)' } as React.CSSProperties}>
        <div className="metric-header">
          <span>Language / Branch</span>
          <Code size={16} color="var(--violet)" />
        </div>
        <div className="metric-value" style={{ fontSize: '1.4rem' }}>
          {repository.language || 'Multi-language'}
        </div>
        <div className="metric-subtext mono">
          <span>Branch: <strong>{repository.default_branch}</strong></span>
          {repository.head_commit_hash && (
            <span>• {repository.head_commit_hash.substring(0, 7)}</span>
          )}
        </div>
      </div>
    </section>
  )
}
