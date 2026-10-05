import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const HealthScorePanel = ({ health }) => {
    if (!health) {
        return (_jsx("div", { className: "panel", style: { padding: '24px', textAlign: 'center' }, children: _jsx("p", { style: { color: 'var(--text-muted)', fontSize: '0.85rem' }, children: "No sustainability telemetry computed yet for this repository." }) }));
    }
    const overall = Math.round(health.overall || 0);
    // Status mapping
    let statusBadge = _jsx("span", { className: "badge badge-emerald", children: "Healthy Distribution" });
    let scoreColor = 'var(--status-emerald)';
    if (overall < 50) {
        statusBadge = _jsx("span", { className: "badge badge-rose", children: "High Concentration Risk" });
        scoreColor = 'var(--status-rose)';
    }
    else if (overall < 75) {
        statusBadge = _jsx("span", { className: "badge badge-amber", children: "Moderate Risk" });
        scoreColor = 'var(--status-amber)';
    }
    return (_jsxs("div", { className: "panel", style: { padding: '20px 24px' }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    marginBottom: '18px',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '14px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'baseline', gap: '6px' }, children: [_jsx("span", { style: { fontSize: '1.75rem', fontWeight: 700, color: scoreColor, lineHeight: 1 }, className: "tabular", children: overall }), _jsx("span", { style: { fontSize: '0.85rem', color: 'var(--text-dim)' }, children: "/ 100" })] }), _jsx("div", { style: { width: '1px', height: '24px', background: 'var(--border-subtle)' } }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }, children: "Project Sustainability & Knowledge Distribution Index" }), _jsx("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)' }, children: "Shannon entropy \u2022 Cadence variance \u2022 90-day contributor churn models" })] })] }), _jsx("div", { children: statusBadge })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '20px' }, children: [_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }, children: [_jsx("span", { style: { color: 'var(--text-secondary)' }, children: "Contributor Diversity" }), _jsxs("span", { className: "mono", style: { color: 'var(--text-primary)' }, children: [Math.round((health.contributor_diversity || 0) * 100), "%"] })] }), _jsx("div", { style: { height: '4px', background: '#222226', borderRadius: '2px', overflow: 'hidden' }, children: _jsx("div", { style: {
                                        height: '100%',
                                        width: `${Math.min(100, Math.round((health.contributor_diversity || 0) * 100))}%`,
                                        background: 'var(--text-primary)',
                                    } }) }), _jsx("div", { style: { fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }, children: "Normalized Shannon entropy" })] }), _jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }, children: [_jsx("span", { style: { color: 'var(--text-secondary)' }, children: "Cadence Consistency" }), _jsxs("span", { className: "mono", style: { color: 'var(--text-primary)' }, children: [Math.round((health.commit_consistency || 0) * 100), "%"] })] }), _jsx("div", { style: { height: '4px', background: '#222226', borderRadius: '2px', overflow: 'hidden' }, children: _jsx("div", { style: {
                                        height: '100%',
                                        width: `${Math.min(100, Math.round((health.commit_consistency || 0) * 100))}%`,
                                        background: 'var(--text-primary)',
                                    } }) }), _jsx("div", { style: { fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }, children: "Monthly commit variance index" })] }), _jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }, children: [_jsx("span", { style: { color: 'var(--text-secondary)' }, children: "Contributor Retention" }), _jsxs("span", { className: "mono", style: { color: 'var(--text-primary)' }, children: [Math.round((health.contributor_retention || 0) * 100), "%"] })] }), _jsx("div", { style: { height: '4px', background: '#222226', borderRadius: '2px', overflow: 'hidden' }, children: _jsx("div", { style: {
                                        height: '100%',
                                        width: `${Math.min(100, Math.round((health.contributor_retention || 0) * 100))}%`,
                                        background: 'var(--text-primary)',
                                    } }) }), _jsx("div", { style: { fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }, children: "Multi-month return ratio" })] }), _jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }, children: [_jsx("span", { style: { color: 'var(--text-secondary)' }, children: "Bus-Factor Decentralization" }), _jsxs("span", { className: "mono", style: { color: 'var(--text-primary)' }, children: [Math.round((health.bus_factor_safety || 0) * 100), "%"] })] }), _jsx("div", { style: { height: '4px', background: '#222226', borderRadius: '2px', overflow: 'hidden' }, children: _jsx("div", { style: {
                                        height: '100%',
                                        width: `${Math.min(100, Math.round((health.bus_factor_safety || 0) * 100))}%`,
                                        background: health.bus_factor_safety > 0.6 ? 'var(--status-emerald)' : 'var(--status-amber)',
                                    } }) }), _jsxs("div", { style: { fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }, children: ["Top dev owns ", ((health.top_contributor_pct || 0) * 100).toFixed(1), "% of commits (", health.bus_factor_count, " maintainers for 50%)"] })] })] })] }));
};
