import React from 'react'
import type { HealthScore } from '../types'

interface HealthScorePanelProps {
  health: HealthScore | null
}

export const HealthScorePanel: React.FC<HealthScorePanelProps> = ({ health }) => {
  if (!health) {
    return (
      <div className="panel" style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No sustainability telemetry computed yet for this repository.
        </p>
      </div>
    )
  }

  const overall = Math.round(health.overall || 0)

  // Status mapping
  let statusBadge = <span className="badge badge-emerald">Healthy Distribution</span>
  let scoreColor = 'var(--status-emerald)'

  if (overall < 50) {
    statusBadge = <span className="badge badge-rose">High Concentration Risk</span>
    scoreColor = 'var(--status-rose)'
  } else if (overall < 75) {
    statusBadge = <span className="badge badge-amber">Moderate Risk</span>
    scoreColor = 'var(--status-amber)'
  }

  return (
    <div className="panel" style={{ padding: '20px 24px' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: scoreColor, lineHeight: 1 }} className="tabular">
              {overall}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>/ 100</span>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />

          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Project Sustainability & Knowledge Distribution Index
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Shannon entropy • Cadence variance • 90-day contributor churn models
            </div>
          </div>
        </div>

        <div>{statusBadge}</div>
      </div>

      {/* 4 Diagnostic Pillars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '20px' }}>
        {/* 1. Diversity */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Contributor Diversity</span>
            <span className="mono" style={{ color: 'var(--text-primary)' }}>
              {Math.round((health.contributor_diversity || 0) * 100)}%
            </span>
          </div>
          <div style={{ height: '4px', background: '#222226', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, Math.round((health.contributor_diversity || 0) * 100))}%`,
                background: 'var(--text-primary)',
              }}
            />
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Normalized Shannon entropy
          </div>
        </div>

        {/* 2. Consistency */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Cadence Consistency</span>
            <span className="mono" style={{ color: 'var(--text-primary)' }}>
              {Math.round((health.commit_consistency || 0) * 100)}%
            </span>
          </div>
          <div style={{ height: '4px', background: '#222226', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, Math.round((health.commit_consistency || 0) * 100))}%`,
                background: 'var(--text-primary)',
              }}
            />
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Monthly commit variance index
          </div>
        </div>

        {/* 3. Retention */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Contributor Retention</span>
            <span className="mono" style={{ color: 'var(--text-primary)' }}>
              {Math.round((health.contributor_retention || 0) * 100)}%
            </span>
          </div>
          <div style={{ height: '4px', background: '#222226', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, Math.round((health.contributor_retention || 0) * 100))}%`,
                background: 'var(--text-primary)',
              }}
            />
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Multi-month return ratio
          </div>
        </div>

        {/* 4. Bus Factor Safety */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Bus-Factor Decentralization</span>
            <span className="mono" style={{ color: 'var(--text-primary)' }}>
              {Math.round((health.bus_factor_safety || 0) * 100)}%
            </span>
          </div>
          <div style={{ height: '4px', background: '#222226', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, Math.round((health.bus_factor_safety || 0) * 100))}%`,
                background: health.bus_factor_safety > 0.6 ? 'var(--status-emerald)' : 'var(--status-amber)',
              }}
            />
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Top dev owns {((health.top_contributor_pct || 0) * 100).toFixed(1)}% of commits ({health.bus_factor_count} maintainers for 50%)
          </div>
        </div>
      </div>
    </div>
  )
}
