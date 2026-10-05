import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { BrainCircuit, Search } from 'lucide-react';
export const ContributorRetentionView = ({ contributors, totalCommits, }) => {
    const [searchTerm, setSearchTerm] = useState('');
    // Aggregate stats per contributor across all periods
    const authorMap = new Map();
    contributors.forEach((c) => {
        const existing = authorMap.get(c.github_login) || {
            commits: 0,
            email: c.email || '',
            periods: new Set(),
        };
        existing.commits += c.commit_count;
        if (c.period)
            existing.periods.add(c.period);
        authorMap.set(c.github_login, existing);
    });
    const authorList = Array.from(authorMap.entries()).map(([login, data]) => {
        const activeMonths = data.periods.size;
        const share = totalCommits > 0 ? (data.commits / totalCommits) * 100 : 0;
        // Persona clustering logic (mirrors pipeline.py)
        let cluster = 'One-Time Contributor';
        let badgeClass = 'badge-slate';
        let prob30 = 0.2;
        let prob60 = 0.1;
        let prob90 = 0.05;
        if (share >= 10 || activeMonths >= 6) {
            cluster = 'Core Maintainer';
            badgeClass = 'badge-rose';
            prob30 = 0.95;
            prob60 = 0.9;
            prob90 = 0.85;
        }
        else if (activeMonths >= 3) {
            cluster = 'Regular Contributor';
            badgeClass = 'badge-indigo';
            prob30 = 0.8;
            prob60 = 0.7;
            prob90 = 0.6;
        }
        else if (data.commits > 1) {
            cluster = 'Casual Contributor';
            badgeClass = 'badge-cyan';
            prob30 = 0.5;
            prob60 = 0.35;
            prob90 = 0.25;
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
        };
    });
    // Sort by commit count descending
    authorList.sort((a, b) => b.totalCommits - a.totalCommits);
    const filtered = authorList.filter((a) => a.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase()));
    return (_jsxs("div", { className: "glass-panel", style: { padding: '24px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }, children: [_jsxs("div", { children: [_jsxs("h2", { style: { fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(BrainCircuit, { size: 20, color: "var(--violet)" }), "ML Contributor Persona Clustering & Retention Projections"] }), _jsx("p", { style: { color: 'var(--text-dim)', fontSize: '0.825rem' }, children: "Behavioral clustering (RandomForest + K-Means) projecting contributor return likelihood over 30, 60, and 90-day horizons." })] }), _jsxs("div", { style: { position: 'relative', width: '260px' }, children: [_jsx(Search, { size: 15, style: { position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' } }), _jsx("input", { type: "text", placeholder: "Search contributor\u2026", className: "form-input", style: { paddingLeft: '32px', fontSize: '0.8rem', padding: '6px 12px 6px 32px' }, value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })] })] }), _jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Contributor" }), _jsx("th", { children: "Persona Archetype" }), _jsx("th", { children: "Total Commits" }), _jsx("th", { children: "Active Months" }), _jsx("th", { children: "30-Day Retention" }), _jsx("th", { children: "60-Day Retention" }), _jsx("th", { children: "90-Day Retention" })] }) }), _jsx("tbody", { children: filtered.slice(0, 40).map((dev) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("div", { style: { fontWeight: 600, color: 'white' }, children: dev.login }), dev.email && _jsx("div", { style: { fontSize: '0.725rem', color: 'var(--text-dim)' }, children: dev.email })] }), _jsx("td", { children: _jsx("span", { className: `badge ${dev.badgeClass}`, children: dev.cluster }) }), _jsxs("td", { children: [_jsx("span", { className: "mono", style: { fontWeight: 600 }, children: dev.totalCommits.toLocaleString() }), _jsxs("span", { style: { fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '6px' }, children: ["(", dev.sharePct.toFixed(1), "%)"] })] }), _jsx("td", { children: _jsxs("span", { className: "mono", children: [dev.activeMonths, " months"] }) }), _jsx("td", { children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("div", { style: { width: '60px', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px' }, children: _jsx("div", { style: {
                                                            height: '100%',
                                                            width: `${dev.prob30 * 100}%`,
                                                            background: dev.prob30 > 0.7 ? 'var(--emerald)' : dev.prob30 > 0.4 ? 'var(--amber)' : 'var(--rose)',
                                                            borderRadius: '3px',
                                                        } }) }), _jsxs("span", { className: "mono", style: { fontSize: '0.75rem' }, children: [Math.round(dev.prob30 * 100), "%"] })] }) }), _jsx("td", { children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("div", { style: { width: '60px', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px' }, children: _jsx("div", { style: {
                                                            height: '100%',
                                                            width: `${dev.prob60 * 100}%`,
                                                            background: dev.prob60 > 0.7 ? 'var(--emerald)' : dev.prob60 > 0.4 ? 'var(--amber)' : 'var(--rose)',
                                                            borderRadius: '3px',
                                                        } }) }), _jsxs("span", { className: "mono", style: { fontSize: '0.75rem' }, children: [Math.round(dev.prob60 * 100), "%"] })] }) }), _jsx("td", { children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("div", { style: { width: '60px', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px' }, children: _jsx("div", { style: {
                                                            height: '100%',
                                                            width: `${dev.prob90 * 100}%`,
                                                            background: dev.prob90 > 0.7 ? 'var(--emerald)' : dev.prob90 > 0.4 ? 'var(--amber)' : 'var(--rose)',
                                                            borderRadius: '3px',
                                                        } }) }), _jsxs("span", { className: "mono", style: { fontSize: '0.75rem' }, children: [Math.round(dev.prob90 * 100), "%"] })] }) })] }, dev.login))) })] }) })] }));
};
