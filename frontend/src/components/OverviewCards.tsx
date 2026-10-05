import React from 'react'
import type { RepoOverview } from '../types'

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
      : 'Complete history'

  return (
    <div
      className="panel"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
      }}
    >
      {/* 1. Total Commits */}
      <div style={{ padding: '16px 20px', borderRight: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Total Commits
        </div>
        <div className="tabular" style={{ fontSize: '1.65rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {(metrics.total_commits || 0).toLocaleString()}
        </div>
        <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }}>
          {timespan}
        </div>
      </div>

      {/* 2. Contributors */}
      <div style={{ padding: '16px 20px', borderRight: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Contributors
        </div>
        <div className="tabular" style={{ fontSize: '1.65rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {(metrics.total_contributors || 0).toLocaleString()}
        </div>
        <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }}>
          Tracked in lakehouse graph
        </div>
      </div>

      {/* 3. Code Lines Inserted */}
      <div style={{ padding: '16px 20px', borderRight: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Insertions
        </div>
        <div className="tabular" style={{ fontSize: '1.65rem', fontWeight: 600, color: 'var(--status-emerald)', lineHeight: 1.2 }}>
          +{(metrics.total_insertions || 0).toLocaleString()}
        </div>
        <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }}>
          Gross lines added
        </div>
      </div>

      {/* 4. Code Lines Deleted */}
      <div style={{ padding: '16px 20px', borderRight: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Deletions
        </div>
        <div className="tabular" style={{ fontSize: '1.65rem', fontWeight: 600, color: 'var(--status-rose)', lineHeight: 1.2 }}>
          -{(metrics.total_deletions || 0).toLocaleString()}
        </div>
        <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }}>
          Pruned & refactored
        </div>
      </div>

      {/* 5. Files Changed */}
      <div style={{ padding: '16px 20px', borderRight: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Files Modified
        </div>
        <div className="tabular" style={{ fontSize: '1.65rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {(metrics.total_files_changed || 0).toLocaleString()}
        </div>
        <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }}>
          Distinct file revisions
        </div>
      </div>

      {/* 6. Language & Branch */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Language / Branch
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, marginTop: '2px' }}>
          {repository.language || 'Multi-stack'}
        </div>
        <div className="mono" style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '6px' }}>
          branch: <span style={{ color: 'var(--text-secondary)' }}>{repository.default_branch}</span>
          {repository.head_commit_hash && (
            <span> • {repository.head_commit_hash.substring(0, 7)}</span>
          )}
        </div>
      </div>
    </div>
  )
}
