import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
export const BusFactorRiskTable = ({ modules }) => {
    const criticalCount = modules.filter((m) => m.bus_factor === 1).length;
    return (_jsxs("div", { className: "panel", style: { padding: '20px 24px' }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }, children: "Module-Level Bus Factor & Knowledge Concentration" }), _jsx("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)' }, children: "Identifies codebases and subsystems dependent on a single primary author." })] }), criticalCount > 0 && (_jsxs("span", { className: "badge badge-amber", children: [_jsx(AlertTriangle, { size: 12 }), _jsxs("span", { children: [criticalCount, " modules with solo maintainer"] })] }))] }), _jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Subsystem / Module Path" }), _jsx("th", { children: "Bus Factor" }), _jsx("th", { children: "Primary Code Owner" }), _jsx("th", { children: "Ownership Concentration" }), _jsx("th", { children: "Status" })] }) }), _jsx("tbody", { children: modules.map((m, idx) => {
                                const isSolo = m.bus_factor === 1;
                                const ownershipPct = Math.round((m.top_owner_pct || 0) * 100);
                                return (_jsxs("tr", { children: [_jsx("td", { children: _jsx("span", { className: "mono", style: { color: 'var(--text-primary)', fontWeight: 500 }, children: m.module_path }) }), _jsx("td", { children: _jsxs("span", { className: `badge ${isSolo ? 'badge-rose' : 'badge-neutral'}`, children: [m.bus_factor, " ", isSolo ? 'dev (solo)' : 'devs'] }) }), _jsx("td", { children: _jsx("span", { style: { color: 'var(--text-primary)' }, children: m.top_owner || 'Unknown' }) }), _jsx("td", { style: { minWidth: '160px' }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("div", { style: {
                                                            flex: 1,
                                                            height: '4px',
                                                            background: '#222226',
                                                            borderRadius: '2px',
                                                            overflow: 'hidden',
                                                        }, children: _jsx("div", { style: {
                                                                height: '100%',
                                                                width: `${ownershipPct}%`,
                                                                background: isSolo ? 'var(--status-rose)' : 'var(--text-secondary)',
                                                            } }) }), _jsxs("span", { className: "mono", style: { fontSize: '0.75rem', width: '32px', textAlign: 'right' }, children: [ownershipPct, "%"] })] }) }), _jsx("td", { children: isSolo ? (_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--status-rose)', display: 'flex', alignItems: 'center', gap: '4px' }, children: "Single point of failure" })) : (_jsxs("span", { style: { fontSize: '0.75rem', color: 'var(--status-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx(CheckCircle2, { size: 12 }), " Distributed"] })) })] }, `${m.module_path}-${idx}`));
                            }) })] }) })] }));
};
