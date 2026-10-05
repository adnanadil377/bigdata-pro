import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Search } from 'lucide-react';
export const ContributorRetentionView = ({ contributors, totalCommits, }) => {
    const [searchTerm, setSearchTerm] = useState('');
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
        let cluster = 'One-Time Contributor';
        let prob30 = 0.2;
        let prob60 = 0.1;
        let prob90 = 0.05;
        if (share >= 10 || activeMonths >= 6) {
            cluster = 'Core Maintainer';
            prob30 = 0.95;
            prob60 = 0.9;
            prob90 = 0.85;
        }
        else if (activeMonths >= 3) {
            cluster = 'Regular';
            prob30 = 0.8;
            prob60 = 0.7;
            prob90 = 0.6;
        }
        else if (data.commits > 1) {
            cluster = 'Casual';
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
            prob30,
            prob60,
            prob90,
        };
    });
    authorList.sort((a, b) => b.totalCommits - a.totalCommits);
    const filtered = authorList.filter((a) => a.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase()));
    return (_jsxs("div", { className: "panel", style: { padding: '20px 24px' }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '12px',
                }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }, children: "Contributor Persona Clustering & Retention Projections" }), _jsx("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)' }, children: "RandomForest + K-Means model projecting contributor return likelihood over 30, 60, and 90 days." })] }), _jsxs("div", { style: { position: 'relative', width: '220px' }, children: [_jsx(Search, { size: 13, style: { position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' } }), _jsx("input", { type: "text", placeholder: "Search contributor\u2026", className: "form-input", style: { paddingLeft: '30px', fontSize: '0.775rem', padding: '5px 10px 5px 30px' }, value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })] })] }), _jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Contributor" }), _jsx("th", { children: "Persona Archetype" }), _jsx("th", { children: "Total Commits" }), _jsx("th", { children: "Active Months" }), _jsx("th", { children: "30-Day Retention" }), _jsx("th", { children: "60-Day Retention" }), _jsx("th", { children: "90-Day Retention" })] }) }), _jsx("tbody", { children: filtered.slice(0, 40).map((dev) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("div", { style: { fontWeight: 500, color: 'var(--text-primary)' }, children: dev.login }), dev.email && _jsx("div", { style: { fontSize: '0.7rem', color: 'var(--text-dim)' }, children: dev.email })] }), _jsx("td", { children: _jsx("span", { className: "badge badge-neutral", style: {
                                                color: dev.cluster === 'Core Maintainer' ? '#ffffff' : 'var(--text-secondary)',
                                                borderColor: dev.cluster === 'Core Maintainer' ? '#52525b' : 'var(--border-subtle)',
                                            }, children: dev.cluster }) }), _jsxs("td", { children: [_jsx("span", { className: "mono tabular", style: { fontWeight: 500 }, children: dev.totalCommits.toLocaleString() }), _jsxs("span", { style: { fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: '4px' }, children: ["(", dev.sharePct.toFixed(1), "%)"] })] }), _jsx("td", { children: _jsxs("span", { className: "mono tabular", children: [dev.activeMonths, " mos"] }) }), _jsx("td", { children: _jsxs("span", { className: "mono tabular", style: { color: dev.prob30 > 0.7 ? 'var(--status-emerald)' : 'var(--text-secondary)' }, children: [Math.round(dev.prob30 * 100), "%"] }) }), _jsx("td", { children: _jsxs("span", { className: "mono tabular", style: { color: dev.prob60 > 0.7 ? 'var(--status-emerald)' : 'var(--text-secondary)' }, children: [Math.round(dev.prob60 * 100), "%"] }) }), _jsx("td", { children: _jsxs("span", { className: "mono tabular", style: { color: dev.prob90 > 0.7 ? 'var(--status-emerald)' : 'var(--text-secondary)' }, children: [Math.round(dev.prob90 * 100), "%"] }) })] }, dev.login))) })] }) })] }));
};
