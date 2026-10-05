import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ShieldCheck, } from 'lucide-react';
export const HealthScorePanel = ({ health }) => {
    if (!health) {
        return (_jsx("div", { className: "glass-panel", style: { padding: '32px', textAlign: 'center' }, children: _jsx("p", { style: { color: 'var(--text-muted)' }, children: "No health score calculated yet for this repository." }) }));
    }
    const overall = Math.round(health.overall || 0);
    // Color calculation based on score
    let scoreColor = 'var(--emerald)';
    let scoreLabel = 'Healthy Project';
    let scoreGlow = 'var(--emerald-glow)';
    if (overall < 50) {
        scoreColor = 'var(--rose)';
        scoreLabel = 'High Knowledge Risk';
        scoreGlow = 'var(--rose-glow)';
    }
    else if (overall < 75) {
        scoreColor = 'var(--amber)';
        scoreLabel = 'Moderate Sustainability';
        scoreGlow = 'var(--amber-glow)';
    }
    // SVG Gauge calculations
    const size = 150;
    const strokeWidth = 12;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (overall / 100) * circumference;
    return (_jsxs("div", { className: "glass-panel", style: { padding: '24px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }, children: [_jsxs("div", { children: [_jsxs("h2", { style: { fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(ShieldCheck, { size: 20, color: scoreColor }), "Project Health & Sustainability Index"] }), _jsx("p", { style: { color: 'var(--text-dim)', fontSize: '0.825rem', marginTop: '2px' }, children: "Multi-dimensional telemetry computed from Lakehouse commit history & entropy models" })] }), _jsx("span", { className: "badge", style: { backgroundColor: scoreGlow, color: scoreColor, borderColor: scoreColor }, children: scoreLabel })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '32px', alignItems: 'center' }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }, children: [_jsxs("svg", { width: size, height: size, style: { transform: 'rotate(-90deg)' }, children: [_jsx("circle", { cx: center, cy: center, r: radius, fill: "transparent", stroke: "rgba(255, 255, 255, 0.07)", strokeWidth: strokeWidth }), _jsx("circle", { cx: center, cy: center, r: radius, fill: "transparent", stroke: scoreColor, strokeWidth: strokeWidth, strokeDasharray: circumference, strokeDashoffset: strokeDashoffset, strokeLinecap: "round", style: { transition: 'stroke-dashoffset 1s ease-in-out' } })] }), _jsxs("div", { style: {
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center',
                                }, children: [_jsx("div", { className: "mono", style: { fontSize: '2.2rem', fontWeight: 800, color: 'white', lineHeight: 1 }, children: overall }), _jsx("div", { style: { fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }, children: "Score / 100" })] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }, children: [_jsxs("div", { style: { background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }, children: [_jsx("span", { children: "Diversity (Shannon Entropy)" }), _jsxs("strong", { className: "mono", children: [Math.round((health.contributor_diversity || 0) * 100), "%"] })] }), _jsx("div", { style: { height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }, children: _jsx("div", { style: {
                                                height: '100%',
                                                width: `${Math.min(100, Math.round((health.contributor_diversity || 0) * 100))}%`,
                                                background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                                                borderRadius: '3px',
                                            } }) })] }), _jsxs("div", { style: { background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }, children: [_jsx("span", { children: "Commit Cadence Consistency" }), _jsxs("strong", { className: "mono", children: [Math.round((health.commit_consistency || 0) * 100), "%"] })] }), _jsx("div", { style: { height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }, children: _jsx("div", { style: {
                                                height: '100%',
                                                width: `${Math.min(100, Math.round((health.commit_consistency || 0) * 100))}%`,
                                                background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                                                borderRadius: '3px',
                                            } }) })] }), _jsxs("div", { style: { background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }, children: [_jsx("span", { children: "Contributor Retention" }), _jsxs("strong", { className: "mono", children: [Math.round((health.contributor_retention || 0) * 100), "%"] })] }), _jsx("div", { style: { height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }, children: _jsx("div", { style: {
                                                height: '100%',
                                                width: `${Math.min(100, Math.round((health.contributor_retention || 0) * 100))}%`,
                                                background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                                                borderRadius: '3px',
                                            } }) })] }), _jsxs("div", { style: { background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }, children: [_jsx("span", { children: "Bus Factor Safety" }), _jsxs("strong", { className: "mono", children: [Math.round((health.bus_factor_safety || 0) * 100), "%"] })] }), _jsx("div", { style: { height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }, children: _jsx("div", { style: {
                                                height: '100%',
                                                width: `${Math.min(100, Math.round((health.bus_factor_safety || 0) * 100))}%`,
                                                background: 'linear-gradient(90deg, #f59e0b, #10b981)',
                                                borderRadius: '3px',
                                            } }) })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }, children: [_jsx("span", { style: { fontSize: '0.8rem', color: 'var(--text-muted)' }, children: "Repo Bus Factor:" }), _jsxs("span", { className: "badge badge-amber", style: { fontSize: '0.85rem' }, children: [health.bus_factor_count, " maintainers"] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }, children: [_jsx("span", { style: { fontSize: '0.8rem', color: 'var(--text-muted)' }, children: "Top Dev Commit Share:" }), _jsxs("span", { className: "mono", style: { fontSize: '0.9rem', color: 'var(--rose)', fontWeight: 700 }, children: [((health.top_contributor_pct || 0) * 100).toFixed(1), "%"] })] })] })] })] }));
};
