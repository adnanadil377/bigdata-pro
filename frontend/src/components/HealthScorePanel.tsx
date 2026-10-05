import React from 'react'
import {
  Activity,
  AlertTriangle,
  Award,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  Users2,
} from 'lucide-react'
import { HealthScore } from '../types'

interface HealthScorePanelProps {
  health: HealthScore | null
}

export const HealthScorePanel: React.FC<HealthScorePanelProps> = ({ health }) => {
  if (!health) {
    return (
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No health score calculated yet for this repository.</p>
      </div>
    )
  }

  const overall = Math.round(health.overall || 0)

  // Color calculation based on score
  let scoreColor = 'var(--emerald)'
  let scoreLabel = 'Healthy Project'
  let scoreGlow = 'var(--emerald-glow)'

  if (overall < 50) {
    scoreColor = 'var(--rose)'
    scoreLabel = 'High Knowledge Risk'
    scoreGlow = 'var(--rose-glow)'
  } else if (overall < 75) {
    scoreColor = 'var(--amber)'
    scoreLabel = 'Moderate Sustainability'
    scoreGlow = 'var(--amber-glow)'
  }

  // SVG Gauge calculations
  const size = 150
  const strokeWidth = 12
  const center = size / 2
  const radius = center - strokeWidth
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (overall / 100) * circumference

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color={scoreColor} />
            Project Health & Sustainability Index
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.825rem', marginTop: '2px' }}>
            Multi-dimensional telemetry computed from Lakehouse commit history & entropy models
          </p>
        </div>
        <span className="badge" style={{ backgroundColor: scoreGlow, color: scoreColor, borderColor: scoreColor }}>
          {scoreLabel}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '32px', alignItems: 'center' }}>
        {/* SVG Circular Gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.07)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={scoreColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <div className="mono" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>
              {overall}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Score / 100
            </div>
          </div>
        </div>

        {/* Dimension Breakdown Bars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* Contributor Diversity */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Diversity (Shannon Entropy)</span>
              <strong className="mono">{Math.round((health.contributor_diversity || 0) * 100)}%</strong>
            </div>
            <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round((health.contributor_diversity || 0) * 100))}%`,
                  background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                  borderRadius: '3px',
                }}
              />
            </div>
          </div>

          {/* Commit Consistency */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Commit Cadence Consistency</span>
              <strong className="mono">{Math.round((health.commit_consistency || 0) * 100)}%</strong>
            </div>
            <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round((health.commit_consistency || 0) * 100))}%`,
                  background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                  borderRadius: '3px',
                }}
              />
            </div>
          </div>

          {/* Retention Rate */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Contributor Retention</span>
              <strong className="mono">{Math.round((health.contributor_retention || 0) * 100)}%</strong>
            </div>
            <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round((health.contributor_retention || 0) * 100))}%`,
                  background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                  borderRadius: '3px',
                }}
              />
            </div>
          </div>

          {/* Bus Factor Safety */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Bus Factor Safety</span>
              <strong className="mono">{Math.round((health.bus_factor_safety || 0) * 100)}%</strong>
            </div>
            <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round((health.bus_factor_safety || 0) * 100))}%`,
                  background: 'linear-gradient(90deg, #f59e0b, #10b981)',
                  borderRadius: '3px',
                }}
              />
            </div>
          </div>

          {/* Bus Factor Count Pill */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Repo Bus Factor:</span>
            <span className="badge badge-amber" style={{ fontSize: '0.85rem' }}>
              {health.bus_factor_count} maintainers
            </span>
          </div>

          {/* Top Contributor Concentration */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Top Dev Commit Share:</span>
            <span className="mono" style={{ fontSize: '0.9rem', color: 'var(--rose)', fontWeight: 700 }}>
              {((health.top_contributor_pct || 0) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
