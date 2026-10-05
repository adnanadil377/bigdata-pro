import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { BarChart3, Bug, Code2, FileText, Gauge, Lock, Search, Sparkles, TestTube2, Wrench, Zap, } from 'lucide-react';
const TYPE_CONFIG = {
    BUG_FIX: { label: 'Bug Fixes', color: '#f43f5e', icon: _jsx(Bug, { size: 16 }) },
    FEATURE: { label: 'Features', color: '#10b981', icon: _jsx(Sparkles, { size: 16 }) },
    REFACTOR: { label: 'Refactoring', color: '#6366f1', icon: _jsx(Wrench, { size: 16 }) },
    DOCUMENTATION: { label: 'Docs', color: '#06b6d4', icon: _jsx(FileText, { size: 16 }) },
    PERFORMANCE: { label: 'Performance', color: '#f59e0b', icon: _jsx(Zap, { size: 16 }) },
    TEST: { label: 'Tests', color: '#8b5cf6', icon: _jsx(TestTube2, { size: 16 }) },
    SECURITY: { label: 'Security', color: '#ec4899', icon: _jsx(Lock, { size: 16 }) },
    DEVOPS: { label: 'CI / DevOps', color: '#14b8a6', icon: _jsx(Gauge, { size: 16 }) },
    OTHER: { label: 'Other', color: '#64748b', icon: _jsx(Code2, { size: 16 }) },
};
export const CommitAnalyticsView = ({ commitTypes, contributorStats, }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState(null);
    const totalCategorized = commitTypes.reduce((acc, curr) => acc + curr.total, 0) || 1;
    const filteredStats = contributorStats.filter((cs) => {
        const matchesSearch = cs.github_login.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cs.email && cs.email.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '24px' }, children: [_jsxs("div", { className: "glass-panel", style: { padding: '24px' }, children: [_jsxs("div", { style: { marginBottom: '16px' }, children: [_jsxs("h2", { style: { fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(BarChart3, { size: 20, color: "var(--primary)" }), "Automated Commit Intent Classification"] }), _jsx("p", { style: { color: 'var(--text-dim)', fontSize: '0.825rem' }, children: "Extracted via NLP & Regex taxonomy rules from Lakehouse commit subject messages." })] }), _jsx("div", { style: {
                            display: 'flex',
                            height: '14px',
                            borderRadius: '7px',
                            overflow: 'hidden',
                            marginBottom: '20px',
                            background: 'rgba(255, 255, 255, 0.05)',
                        }, children: commitTypes.map((t) => {
                            const cfg = TYPE_CONFIG[t.commit_type] || TYPE_CONFIG.OTHER;
                            const pct = (t.total / totalCategorized) * 100;
                            if (pct < 0.5)
                                return null;
                            return (_jsx("div", { title: `${cfg.label}: ${t.total.toLocaleString()} commits (${pct.toFixed(1)}%)`, style: {
                                    width: `${pct}%`,
                                    backgroundColor: cfg.color,
                                    cursor: 'pointer',
                                    transition: 'opacity 0.2s',
                                    opacity: selectedType && selectedType !== t.commit_type ? 0.3 : 1,
                                }, onClick: () => setSelectedType(selectedType === t.commit_type ? null : t.commit_type) }, t.commit_type));
                        }) }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }, children: commitTypes.map((t) => {
                            const cfg = TYPE_CONFIG[t.commit_type] || TYPE_CONFIG.OTHER;
                            const pct = ((t.total / totalCategorized) * 100).toFixed(1);
                            const isSelected = selectedType === t.commit_type;
                            return (_jsxs("div", { onClick: () => setSelectedType(isSelected ? null : t.commit_type), style: {
                                    padding: '12px 14px',
                                    borderRadius: 'var(--radius-md)',
                                    background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                    border: isSelected ? `1px solid ${cfg.color}` : '1px solid var(--border-subtle)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                }, children: [_jsx("div", { style: { color: cfg.color }, children: cfg.icon }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.775rem', color: 'var(--text-muted)' }, children: cfg.label }), _jsxs("div", { className: "mono", style: { fontSize: '1.05rem', fontWeight: 700, color: 'white' }, children: [t.total.toLocaleString(), _jsxs("span", { style: { fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: '4px' }, children: ["(", pct, "%)"] })] })] })] }, t.commit_type));
                        }) })] }), _jsxs("div", { className: "glass-panel", style: { padding: '24px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }, children: [_jsxs("div", { children: [_jsx("h2", { style: { fontSize: '1.25rem' }, children: "Monthly Contributor Activity Ledger" }), _jsx("p", { style: { color: 'var(--text-dim)', fontSize: '0.825rem' }, children: "Rollup of commits, insertions, deletions, and touched files per contributor period." })] }), _jsxs("div", { style: { position: 'relative', width: '240px' }, children: [_jsx(Search, { size: 15, style: { position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' } }), _jsx("input", { type: "text", placeholder: "Search author name or email\u2026", className: "form-input", style: { paddingLeft: '32px', fontSize: '0.8rem', padding: '6px 12px 6px 32px' }, value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })] })] }), _jsx("div", { style: { maxHeight: '420px', overflowY: 'auto' }, children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Author" }), _jsx("th", { children: "Period" }), _jsx("th", { children: "Commits" }), _jsx("th", { children: "Insertions" }), _jsx("th", { children: "Deletions" }), _jsx("th", { children: "Files Changed" })] }) }), _jsx("tbody", { children: filteredStats.slice(0, 50).map((cs, idx) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("div", { style: { fontWeight: 600, color: 'white' }, children: cs.github_login }), cs.email && _jsx("div", { style: { fontSize: '0.75rem', color: 'var(--text-dim)' }, children: cs.email })] }), _jsx("td", { children: _jsx("span", { className: "mono", style: { fontSize: '0.8rem' }, children: cs.period }) }), _jsx("td", { children: _jsxs("span", { className: "badge badge-indigo", children: [cs.commit_count, " commits"] }) }), _jsx("td", { children: _jsxs("span", { className: "mono", style: { color: 'var(--emerald)' }, children: ["+", cs.insertions?.toLocaleString() || 0] }) }), _jsx("td", { children: _jsxs("span", { className: "mono", style: { color: 'var(--rose)' }, children: ["-", cs.deletions?.toLocaleString() || 0] }) }), _jsx("td", { children: _jsx("span", { className: "mono", children: cs.files_changed || 0 }) })] }, `${cs.github_login}-${cs.period}-${idx}`))) })] }) })] })] }));
};
