import React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert, UserCheck } from 'lucide-react'
import { BusFactorModule } from '../types'

interface BusFactorRiskTableProps {
  modules: BusFactorModule[]
}

export const BusFactorRiskTable: React.FC<BusFactorRiskTableProps> = ({ modules }) => {
  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} color="var(--rose)" />
            Module Bus-Factor & Knowledge Silo Telemetry
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.825rem' }}>
            Calculates minimum contributors required to exceed 50% commit ownership per directory or module.
          </p>
        </div>

        <div className="badge badge-amber" style={{ padding: '6px 12px' }}>
          <AlertTriangle size={14} />
          <span>{modules.filter((m) => m.bus_factor === 1).length} Modules at Critical Single-Maintainer Risk</span>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Module / Subsystem Path</th>
              <th>Bus Factor</th>
              <th>Primary Code Owner</th>
              <th>Ownership Concentration</th>
              <th>Risk Severity</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((m, idx) => {
              const isCritical = m.bus_factor === 1
              const ownershipPct = Math.round((m.top_owner_pct || 0) * 100)

              return (
                <tr key={`${m.module_path}-${idx}`}>
                  <td>
                    <span className="mono" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {m.module_path}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${isCritical ? 'badge-rose' : 'badge-emerald'}`}
                      style={{ fontSize: '0.8rem' }}
                    >
                      BF = {m.bus_factor} {isCritical ? '(Solo)' : 'Devs'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserCheck size={14} color="var(--primary-light)" />
                      <span>{m.top_owner || 'Unknown'}</span>
                    </div>
                  </td>
                  <td style={{ minWidth: '180px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '6px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${ownershipPct}%`,
                            background: isCritical
                              ? 'linear-gradient(90deg, #f59e0b, #f43f5e)'
                              : 'linear-gradient(90deg, #6366f1, #10b981)',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                      <span className="mono" style={{ fontSize: '0.775rem', width: '36px', textAlign: 'right' }}>
                        {ownershipPct}%
                      </span>
                    </div>
                  </td>
                  <td>
                    {isCritical ? (
                      <span className="badge badge-rose" style={{ fontSize: '0.725rem' }}>
                        <AlertCircle size={12} /> High Risk
                      </span>
                    ) : (
                      <span className="badge badge-emerald" style={{ fontSize: '0.725rem' }}>
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
