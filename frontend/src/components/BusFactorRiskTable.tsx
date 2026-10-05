import React from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { BusFactorModule } from '../types'

interface BusFactorRiskTableProps {
  modules: BusFactorModule[]
}

export const BusFactorRiskTable: React.FC<BusFactorRiskTableProps> = ({ modules }) => {
  const criticalCount = modules.filter((m) => m.bus_factor === 1).length

  return (
    <div className="panel" style={{ padding: '20px 24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Module-Level Bus Factor & Knowledge Concentration
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Identifies codebases and subsystems dependent on a single primary author.
          </div>
        </div>

        {criticalCount > 0 && (
          <span className="badge badge-amber">
            <AlertTriangle size={12} />
            <span>{criticalCount} modules with solo maintainer</span>
          </span>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Subsystem / Module Path</th>
              <th>Bus Factor</th>
              <th>Primary Code Owner</th>
              <th>Ownership Concentration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((m, idx) => {
              const isSolo = m.bus_factor === 1
              const ownershipPct = Math.round((m.top_owner_pct || 0) * 100)

              return (
                <tr key={`${m.module_path}-${idx}`}>
                  <td>
                    <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {m.module_path}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${isSolo ? 'badge-rose' : 'badge-neutral'}`}>
                      {m.bus_factor} {isSolo ? 'dev (solo)' : 'devs'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-primary)' }}>{m.top_owner || 'Unknown'}</span>
                  </td>
                  <td style={{ minWidth: '160px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '4px',
                          background: '#222226',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${ownershipPct}%`,
                            background: isSolo ? 'var(--status-rose)' : 'var(--text-secondary)',
                          }}
                        />
                      </div>
                      <span className="mono" style={{ fontSize: '0.75rem', width: '32px', textAlign: 'right' }}>
                        {ownershipPct}%
                      </span>
                    </div>
                  </td>
                  <td>
                    {isSolo ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--status-rose)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Single point of failure
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--status-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Distributed
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
