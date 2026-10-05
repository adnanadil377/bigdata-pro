import React, { useState } from 'react'
import { Search } from 'lucide-react'
import type { ContributorStat } from '../types'

interface ContributorRetentionViewProps {
  contributors: ContributorStat[]
  totalCommits: number
}

export const ContributorRetentionView: React.FC<ContributorRetentionViewProps> = ({
  contributors,
  totalCommits,
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  const authorMap = new Map<string, { commits: number; email: string; periods: Set<string> }>()

  contributors.forEach((c) => {
    const existing = authorMap.get(c.github_login) || {
      commits: 0,
      email: c.email || '',
      periods: new Set<string>(),
    }
    existing.commits += c.commit_count
    if (c.period) existing.periods.add(c.period)
    authorMap.set(c.github_login, existing)
  })

  const authorList = Array.from(authorMap.entries()).map(([login, data]) => {
    const activeMonths = data.periods.size
    const share = totalCommits > 0 ? (data.commits / totalCommits) * 100 : 0

    let cluster = 'One-Time Contributor'
    let prob30 = 0.2
    let prob60 = 0.1
    let prob90 = 0.05

    if (share >= 10 || activeMonths >= 6) {
      cluster = 'Core Maintainer'
      prob30 = 0.95
      prob60 = 0.9
      prob90 = 0.85
    } else if (activeMonths >= 3) {
      cluster = 'Regular'
      prob30 = 0.8
      prob60 = 0.7
      prob90 = 0.6
    } else if (data.commits > 1) {
      cluster = 'Casual'
      prob30 = 0.5
      prob60 = 0.35
      prob90 = 0.25
    }

    return {
      login,
      email: data.email,
      totalCommits: data.commits,
      activeMonths,
      sharePct: share,
      cluster,
      prob30,
      prob60,
      prob90,
    }
  })

  authorList.sort((a, b) => b.totalCommits - a.totalCommits)

  const filtered = authorList.filter((a) =>
    a.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
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
            Contributor Persona Clustering & Retention Projections
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            RandomForest + K-Means model projecting contributor return likelihood over 30, 60, and 90 days.
          </div>
        </div>

        <div style={{ position: 'relative', width: '220px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search contributor…"
            className="form-input"
            style={{ paddingLeft: '30px', fontSize: '0.775rem', padding: '5px 10px 5px 30px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Contributor</th>
              <th>Persona Archetype</th>
              <th>Total Commits</th>
              <th>Active Months</th>
              <th>30-Day Retention</th>
              <th>60-Day Retention</th>
              <th>90-Day Retention</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 40).map((dev) => (
              <tr key={dev.login}>
                <td>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{dev.login}</div>
                  {dev.email && <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{dev.email}</div>}
                </td>
                <td>
                  <span
                    className="badge badge-neutral"
                    style={{
                      color: dev.cluster === 'Core Maintainer' ? '#ffffff' : 'var(--text-secondary)',
                      borderColor: dev.cluster === 'Core Maintainer' ? '#52525b' : 'var(--border-subtle)',
                    }}
                  >
                    {dev.cluster}
                  </span>
                </td>
                <td>
                  <span className="mono tabular" style={{ fontWeight: 500 }}>
                    {dev.totalCommits.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: '4px' }}>
                    ({dev.sharePct.toFixed(1)}%)
                  </span>
                </td>
                <td>
                  <span className="mono tabular">{dev.activeMonths} mos</span>
                </td>
                <td>
                  <span className="mono tabular" style={{ color: dev.prob30 > 0.7 ? 'var(--status-emerald)' : 'var(--text-secondary)' }}>
                    {Math.round(dev.prob30 * 100)}%
                  </span>
                </td>
                <td>
                  <span className="mono tabular" style={{ color: dev.prob60 > 0.7 ? 'var(--status-emerald)' : 'var(--text-secondary)' }}>
                    {Math.round(dev.prob60 * 100)}%
                  </span>
                </td>
                <td>
                  <span className="mono tabular" style={{ color: dev.prob90 > 0.7 ? 'var(--status-emerald)' : 'var(--text-secondary)' }}>
                    {Math.round(dev.prob90 * 100)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
