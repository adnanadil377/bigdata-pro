import React, { useState } from 'react'
import { Search } from 'lucide-react'
import type { CommitTypeStat, ContributorStat } from '../types'

interface CommitAnalyticsViewProps {
  commitTypes: CommitTypeStat[]
  contributorStats: ContributorStat[]
}

const TYPE_PALETTE: Record<string, { label: string; color: string }> = {
  BUG_FIX: { label: 'Bug Fixes', color: '#ef4444' },
  FEATURE: { label: 'Features', color: '#10b981' },
  REFACTOR: { label: 'Refactoring', color: '#3b82f6' },
  DOCUMENTATION: { label: 'Docs', color: '#64748b' },
  PERFORMANCE: { label: 'Performance', color: '#f59e0b' },
  TEST: { label: 'Tests', color: '#8b5cf6' },
  SECURITY: { label: 'Security', color: '#ec4899' },
  DEVOPS: { label: 'CI / DevOps', color: '#14b8a6' },
  OTHER: { label: 'Other', color: '#3f3f46' },
}

export const CommitAnalyticsView: React.FC<CommitAnalyticsViewProps> = ({
  commitTypes,
  contributorStats,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const totalCategorized = commitTypes.reduce((acc, curr) => acc + curr.total, 0) || 1

  const filteredStats = contributorStats.filter((cs) => {
    return (
      cs.github_login.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cs.email && cs.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Intent Breakdown */}
      <div className="panel" style={{ padding: '20px 24px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Commit Intent Classification
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Extracted from commit subject lines via Lakehouse regular expressions.
          </div>
        </div>

        {/* GitHub Language-style Segment Bar */}
        <div
          style={{
            display: 'flex',
            height: '8px',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '16px',
            background: '#1c1c1f',
          }}
        >
          {commitTypes.map((t) => {
            const cfg = TYPE_PALETTE[t.commit_type] || TYPE_PALETTE.OTHER
            const pct = (t.total / totalCategorized) * 100
            if (pct < 0.4) return null
            return (
              <div
                key={t.commit_type}
                title={`${cfg.label}: ${t.total.toLocaleString()} commits (${pct.toFixed(1)}%)`}
                style={{
                  width: `${pct}%`,
                  backgroundColor: cfg.color,
                  cursor: 'pointer',
                  opacity: selectedType && selectedType !== t.commit_type ? 0.25 : 1,
                  transition: 'opacity 0.15s ease',
                }}
                onClick={() => setSelectedType(selectedType === t.commit_type ? null : t.commit_type)}
              />
            )
          })}
        </div>

        {/* Clean Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {commitTypes.map((t) => {
            const cfg = TYPE_PALETTE[t.commit_type] || TYPE_PALETTE.OTHER
            const pct = ((t.total / totalCategorized) * 100).toFixed(1)
            const isSelected = selectedType === t.commit_type

            return (
              <button
                key={t.commit_type}
                onClick={() => setSelectedType(isSelected ? null : t.commit_type)}
                style={{
                  background: isSelected ? '#27272a' : '#141416',
                  border: isSelected ? '1px solid #52525b' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '5px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  fontSize: '0.775rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cfg.color }} />
                <span>{cfg.label}</span>
                <span className="mono" style={{ color: 'var(--text-muted)' }}>
                  {t.total.toLocaleString()} ({pct}%)
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contributor Activity Ledger */}
      <div className="panel" style={{ padding: '20px 24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Monthly Contributor Activity Ledger
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Aggregated monthly commit volumes, insertions, and deletions.
            </div>
          </div>

          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search author…"
              className="form-input"
              style={{ paddingLeft: '30px', fontSize: '0.775rem', padding: '5px 10px 5px 30px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Author</th>
                <th>Period</th>
                <th>Commits</th>
                <th>Insertions</th>
                <th>Deletions</th>
                <th>Files Changed</th>
              </tr>
            </thead>
            <tbody>
              {filteredStats.slice(0, 50).map((cs, idx) => (
                <tr key={`${cs.github_login}-${cs.period}-${idx}`}>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{cs.github_login}</div>
                    {cs.email && <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{cs.email}</div>}
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: '0.75rem' }}>{cs.period}</span>
                  </td>
                  <td>
                    <span className="mono tabular" style={{ color: 'var(--text-primary)' }}>
                      {cs.commit_count}
                    </span>
                  </td>
                  <td>
                    <span className="mono tabular" style={{ color: 'var(--status-emerald)' }}>
                      +{cs.insertions?.toLocaleString() || 0}
                    </span>
                  </td>
                  <td>
                    <span className="mono tabular" style={{ color: 'var(--status-rose)' }}>
                      -{cs.deletions?.toLocaleString() || 0}
                    </span>
                  </td>
                  <td>
                    <span className="mono tabular">{cs.files_changed || 0}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
