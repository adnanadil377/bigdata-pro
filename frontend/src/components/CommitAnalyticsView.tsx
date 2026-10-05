import React, { useState } from 'react'
import {
  BarChart3,
  Bug,
  Code2,
  FileText,
  Gauge,
  Lock,
  Search,
  Sparkles,
  TestTube2,
  Wrench,
  Zap,
} from 'lucide-react'
import { CommitTypeStat, ContributorStat } from '../types'

interface CommitAnalyticsViewProps {
  commitTypes: CommitTypeStat[]
  contributorStats: ContributorStat[]
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  BUG_FIX: { label: 'Bug Fixes', color: '#f43f5e', icon: <Bug size={16} /> },
  FEATURE: { label: 'Features', color: '#10b981', icon: <Sparkles size={16} /> },
  REFACTOR: { label: 'Refactoring', color: '#6366f1', icon: <Wrench size={16} /> },
  DOCUMENTATION: { label: 'Docs', color: '#06b6d4', icon: <FileText size={16} /> },
  PERFORMANCE: { label: 'Performance', color: '#f59e0b', icon: <Zap size={16} /> },
  TEST: { label: 'Tests', color: '#8b5cf6', icon: <TestTube2 size={16} /> },
  SECURITY: { label: 'Security', color: '#ec4899', icon: <Lock size={16} /> },
  DEVOPS: { label: 'CI / DevOps', color: '#14b8a6', icon: <Gauge size={16} /> },
  OTHER: { label: 'Other', color: '#64748b', icon: <Code2 size={16} /> },
}

export const CommitAnalyticsView: React.FC<CommitAnalyticsViewProps> = ({
  commitTypes,
  contributorStats,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const totalCategorized = commitTypes.reduce((acc, curr) => acc + curr.total, 0) || 1

  const filteredStats = contributorStats.filter((cs) => {
    const matchesSearch =
      cs.github_login.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cs.email && cs.email.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Commit Taxonomy Breakdown */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} color="var(--primary)" />
            Automated Commit Intent Classification
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.825rem' }}>
            Extracted via NLP & Regex taxonomy rules from Lakehouse commit subject messages.
          </p>
        </div>

        {/* Stacked Proportional Bar */}
        <div
          style={{
            display: 'flex',
            height: '14px',
            borderRadius: '7px',
            overflow: 'hidden',
            marginBottom: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
          }}
        >
          {commitTypes.map((t) => {
            const cfg = TYPE_CONFIG[t.commit_type] || TYPE_CONFIG.OTHER
            const pct = (t.total / totalCategorized) * 100
            if (pct < 0.5) return null
            return (
              <div
                key={t.commit_type}
                title={`${cfg.label}: ${t.total.toLocaleString()} commits (${pct.toFixed(1)}%)`}
                style={{
                  width: `${pct}%`,
                  backgroundColor: cfg.color,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                  opacity: selectedType && selectedType !== t.commit_type ? 0.3 : 1,
                }}
                onClick={() => setSelectedType(selectedType === t.commit_type ? null : t.commit_type)}
              />
            )
          })}
        </div>

        {/* Category Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
          {commitTypes.map((t) => {
            const cfg = TYPE_CONFIG[t.commit_type] || TYPE_CONFIG.OTHER
            const pct = ((t.total / totalCategorized) * 100).toFixed(1)
            const isSelected = selectedType === t.commit_type

            return (
              <div
                key={t.commit_type}
                onClick={() => setSelectedType(isSelected ? null : t.commit_type)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? `1px solid ${cfg.color}` : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div style={{ color: cfg.color }}>{cfg.icon}</div>
                <div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{cfg.label}</div>
                  <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white' }}>
                    {t.total.toLocaleString()}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: '4px' }}>
                      ({pct}%)
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Contributor Activity Rollup */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Monthly Contributor Activity Ledger</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.825rem' }}>
              Rollup of commits, insertions, deletions, and touched files per contributor period.
            </p>
          </div>

          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search author name or email…"
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '0.8rem', padding: '6px 12px 6px 32px' }}
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
                    <div style={{ fontWeight: 600, color: 'white' }}>{cs.github_login}</div>
                    {cs.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{cs.email}</div>}
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: '0.8rem' }}>
                      {cs.period}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-indigo">{cs.commit_count} commits</span>
                  </td>
                  <td>
                    <span className="mono" style={{ color: 'var(--emerald)' }}>
                      +{cs.insertions?.toLocaleString() || 0}
                    </span>
                  </td>
                  <td>
                    <span className="mono" style={{ color: 'var(--rose)' }}>
                      -{cs.deletions?.toLocaleString() || 0}
                    </span>
                  </td>
                  <td>
                    <span className="mono">{cs.files_changed || 0}</span>
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
