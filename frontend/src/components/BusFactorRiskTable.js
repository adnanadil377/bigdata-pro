import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert, UserCheck } from 'lucide-react';
export const BusFactorRiskTable = ({ modules }) => {
    return (_jsxs("div", { className: "glass-panel", style: { padding: '24px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }, children: [_jsxs("div", { children: [_jsxs("h2", { style: { fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(ShieldAlert, { size: 20, color: "var(--rose)" }), "Module Bus-Factor & Knowledge Silo Telemetry"] }), _jsx("p", { style: { color: 'var(--text-dim)', fontSize: '0.825rem' }, children: "Calculates minimum contributors required to exceed 50% commit ownership per directory or module." })] }), _jsxs("div", { className: "badge badge-amber", style: { padding: '6px 12px' }, children: [_jsx(AlertTriangle, { size: 14 }), _jsxs("span", { children: [modules.filter((m) => m.bus_factor === 1).length, " Modules at Critical Single-Maintainer Risk"] })] })] }), _jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Module / Subsystem Path" }), _jsx("th", { children: "Bus Factor" }), _jsx("th", { children: "Primary Code Owner" }), _jsx("th", { children: "Ownership Concentration" }), _jsx("th", { children: "Risk Severity" })] }) }), _jsx("tbody", { children: modules.map((m, idx) => {
                                const isCritical = m.bus_factor === 1;
                                const ownershipPct = Math.round((m.top_owner_pct || 0) * 100);
                                return (_jsxs("tr", { children: [_jsx("td", { children: _jsx("span", { className: "mono", style: { fontWeight: 600, color: 'var(--text-main)' }, children: m.module_path }) }), _jsx("td", { children: _jsxs("span", { className: `badge ${isCritical ? 'badge-rose' : 'badge-emerald'}`, style: { fontSize: '0.8rem' }, children: ["BF = ", m.bus_factor, " ", isCritical ? '(Solo)' : 'Devs'] }) }), _jsx("td", { children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsx(UserCheck, { size: 14, color: "var(--primary-light)" }), _jsx("span", { children: m.top_owner || 'Unknown' })] }) }), _jsx("td", { style: { minWidth: '180px' }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx("div", { style: {
                                                            flex: 1,
                                                            height: '6px',
                                                            background: 'rgba(255, 255, 255, 0.08)',
                                                            borderRadius: '3px',
                                                            overflow: 'hidden',
                                                        }, children: _jsx("div", { style: {
                                                                height: '100%',
                                                                width: `${ownershipPct}%`,
                                                                background: isCritical
                                                                    ? 'linear-gradient(90deg, #f59e0b, #f43f5e)'
                                                                    : 'linear-gradient(90deg, #6366f1, #10b981)',
                                                                borderRadius: '3px',
                                                            } }) }), _jsxs("span", { className: "mono", style: { fontSize: '0.775rem', width: '36px', textAlign: 'right' }, children: [ownershipPct, "%"] })] }) }), _jsx("td", { children: isCritical ? (_jsxs("span", { className: "badge badge-rose", style: { fontSize: '0.725rem' }, children: [_jsx(AlertCircle, { size: 12 }), " High Risk"] })) : (_jsxs("span", { className: "badge badge-emerald", style: { fontSize: '0.725rem' }, children: [_jsx(CheckCircle2, { size: 12 }), " Distributed"] })) })] }, `${m.module_path}-${idx}`));
                            }) })] }) })] }));
};
