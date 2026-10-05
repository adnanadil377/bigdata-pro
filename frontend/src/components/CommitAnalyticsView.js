import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Search } from 'lucide-react';
const TYPE_PALETTE = {
    BUG_FIX: { label: 'Bug Fixes', color: '#ef4444' },
    FEATURE: { label: 'Features', color: '#10b981' },
    REFACTOR: { label: 'Refactoring', color: '#3b82f6' },
    DOCUMENTATION: { label: 'Docs', color: '#64748b' },
    PERFORMANCE: { label: 'Performance', color: '#f59e0b' },
    TEST: { label: 'Tests', color: '#8b5cf6' },
    SECURITY: { label: 'Security', color: '#ec4899' },
    DEVOPS: { label: 'CI / DevOps', color: '#14b8a6' },
    OTHER: { label: 'Other', color: '#3f3f46' },
};
export const CommitAnalyticsView = ({ commitTypes, contributorStats, }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState(null);
    const totalCategorized = commitTypes.reduce((acc, curr) => acc + curr.total, 0) || 1;
    const filteredStats = contributorStats.filter((cs) => {
        return (cs.github_login.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cs.email && cs.email.toLowerCase().includes(searchTerm.toLowerCase())));
    });
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '20px' }, children: [_jsxs("div", { className: "panel", style: { padding: '20px 24px' }, children: [_jsxs("div", { style: { marginBottom: '14px' }, children: [_jsx("div", { style: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }, children: "Commit Intent Classification" }), _jsx("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)' }, children: "Extracted from commit subject lines via Lakehouse regular expressions." })] }), _jsx("div", { style: {
                            display: 'flex',
                            height: '8px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            marginBottom: '16px',
                            background: '#1c1c1f',
                        }, children: commitTypes.map((t) => {
                            const cfg = TYPE_PALETTE[t.commit_type] || TYPE_PALETTE.OTHER;
                            const pct = (t.total / totalCategorized) * 100;
                            if (pct < 0.4)
                                return null;
                            return (_jsx("div", { title: `${cfg.label}: ${t.total.toLocaleString()} commits (${pct.toFixed(1)}%)`, style: {
                                    width: `${pct}%`,
                                    backgroundColor: cfg.color,
                                    cursor: 'pointer',
                                    opacity: selectedType && selectedType !== t.commit_type ? 0.25 : 1,
                                    transition: 'opacity 0.15s ease',
                                }, onClick: () => setSelectedType(selectedType === t.commit_type ? null : t.commit_type) }, t.commit_type));
                        }) }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' }, children: commitTypes.map((t) => {
                            const cfg = TYPE_PALETTE[t.commit_type] || TYPE_PALETTE.OTHER;
                            const pct = ((t.total / totalCategorized) * 100).toFixed(1);
                            const isSelected = selectedType === t.commit_type;
                            return (_jsxs("button", { onClick: () => setSelectedType(isSelected ? null : t.commit_type), style: {
                                    background: isSelected ? '#27272a' : '#141416',
                                    border: isSelected ? '1px solid #52525b' : '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-xs)',
                                    padding: '5px 10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '7px',
                                    cursor: 'pointer',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.775rem',
                                    transition: 'all 0.15s ease',
                                }, children: [_jsx("span", { style: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cfg.color } }), _jsx("span", { children: cfg.label }), _jsxs("span", { className: "mono", style: { color: 'var(--text-muted)' }, children: [t.total.toLocaleString(), " (", pct, "%)"] })] }, t.commit_type));
                        }) })] }), _jsxs("div", { className: "panel", style: { padding: '20px 24px' }, children: [_jsxs("div", { style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '16px',
                            flexWrap: 'wrap',
                            gap: '12px',
                        }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }, children: "Monthly Contributor Activity Ledger" }), _jsx("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)' }, children: "Aggregated monthly commit volumes, insertions, and deletions." })] }), _jsxs("div", { style: { position: 'relative', width: '220px' }, children: [_jsx(Search, { size: 13, style: { position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' } }), _jsx("input", { type: "text", placeholder: "Search author\u2026", className: "form-input", style: { paddingLeft: '30px', fontSize: '0.775rem', padding: '5px 10px 5px 30px' }, value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })] })] }), _jsx("div", { style: { maxHeight: '420px', overflowY: 'auto' }, children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Author" }), _jsx("th", { children: "Period" }), _jsx("th", { children: "Commits" }), _jsx("th", { children: "Insertions" }), _jsx("th", { children: "Deletions" }), _jsx("th", { children: "Files Changed" })] }) }), _jsx("tbody", { children: filteredStats.slice(0, 50).map((cs, idx) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("div", { style: { fontWeight: 500, color: 'var(--text-primary)' }, children: cs.github_login }), cs.email && _jsx("div", { style: { fontSize: '0.7rem', color: 'var(--text-dim)' }, children: cs.email })] }), _jsx("td", { children: _jsx("span", { className: "mono", style: { fontSize: '0.75rem' }, children: cs.period }) }), _jsx("td", { children: _jsx("span", { className: "mono tabular", style: { color: 'var(--text-primary)' }, children: cs.commit_count }) }), _jsx("td", { children: _jsxs("span", { className: "mono tabular", style: { color: 'var(--status-emerald)' }, children: ["+", cs.insertions?.toLocaleString() || 0] }) }), _jsx("td", { children: _jsxs("span", { className: "mono tabular", style: { color: 'var(--status-rose)' }, children: ["-", cs.deletions?.toLocaleString() || 0] }) }), _jsx("td", { children: _jsx("span", { className: "mono tabular", children: cs.files_changed || 0 }) })] }, `${cs.github_login}-${cs.period}-${idx}`))) })] }) })] })] }));
};
