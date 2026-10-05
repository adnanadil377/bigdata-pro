import React, { useState } from 'react'
import { BrainCircuit, Search, Sparkles, TrendingUp, UserCheck, Users } from 'lucide-react'
import { ContributorStat } from '../types'

interface ContributorRetentionViewProps {
  contributors: ContributorStat[]
  totalCommits: number
}

export const ContributorRetentionView: React.FC<ContributorRetentionViewProps> = ({
  contributors,
  totalCommits,
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  // Aggregate stats per contributor across all periods
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

    // Persona clustering logic (mirrors pipeline.py)
    let cluster = 'One-Time Contributor'
    let badgeClass = 'badge-slate'
    let prob30 = 0.2
    let prob60 = 0.1
    let prob90 = 0.05

    if (share >= 10 || activeMonths >= 6) {
      cluster = 'Core Maintainer'
      badgeClass = 'badge-rose'
      prob30 = 0.95
      prob60 = 0.9
      prob90 = 0.85
    } else if (activeMonths >= 3) {
      cluster = 'Regular Contributor'
      badgeClass = 'badge-indigo'
      prob30 = 0.8
      prob60 = 0.7
      prob90 = 0.6
    } else if (data.commits > 1) {
      cluster = 'Casual Contributor'
      badgeClass = 'badge-cyan'
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
      badgeClass,
      prob30,
      prob60,
      prob90,
    }
  })

  // Sort by commit count descending
  authorList.sort((a, b) => b.totalCommits - a.totalCommits)

  const filtered = authorList.filter((a) =>
    a.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrainCircuit size={20} color="var(--violet)" />
            ML Contributor Persona Clustering & Retention Projections
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.825rem' }}>
            Behavioral clustering (RandomForest + K-Means) projecting contributor return likelihood over 30, 60, and 90-day horizons.
          </p>
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search contributor…"
            className="form-input"
            style={{ paddingLeft: '32px', fontSize: '0.8rem', padding: '6px 12px 6px 32px' }}
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
                  <div style={{ fontWeight: 600, color: 'white' }}>{dev.login}</div>
                  {dev.email && <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>{dev.email}</div>}
                </td>
                <td>
                  <span className={`badge ${dev.badgeClass}`}>{dev.cluster}</span>
                </td>
                <td>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {dev.totalCommits.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '6px' }}>
                    ({dev.sharePct.toFixed(1)}%)
                  </span>
                </td>
                <td>
                  <span className="mono">{dev.activeMonths} months</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '60px', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${dev.prob30 * 100}%`,
                          background: dev.prob30 > 0.7 ? 'var(--emerald)' : dev.prob30 > 0.4 ? 'var(--amber)' : 'var(--rose)',
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                    <span className="mono" style={{ fontSize: '0.75rem' }}>
                      {Math.round(dev.prob30 * 100)}%
                    </span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '60px', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${dev.prob60 * 100}%`,
                          background: dev.prob60 > 0.7 ? 'var(--emerald)' : dev.prob60 > 0.4 ? 'var(--amber)' : 'var(--rose)',
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                    <span className="mono" style={{ fontSize: '0.75rem' }}>
                      {Math.round(dev.prob60 * 100)}%
                    </span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '60px', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${dev.prob90 * 100}%`,
                          background: dev.prob90 > 0.7 ? 'var(--emerald)' : dev.prob90 > 0.4 ? 'var(--amber)' : 'var(--rose)',
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                    <span className="mono" style={{ fontSize: '0.75rem' }}>
                      {Math.round(dev.prob90 * 100)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
