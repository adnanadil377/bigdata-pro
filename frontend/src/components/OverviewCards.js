import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const OverviewCards = ({ overview }) => {
    const { repository, metrics } = overview;
    const formatDate = (isoString) => {
        if (!isoString)
            return 'N/A';
        try {
            return new Date(isoString).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
            });
        }
        catch {
            return isoString;
        }
    };
    const timespan = metrics.first_commit_period && metrics.last_commit_period
        ? `${formatDate(metrics.first_commit_period)} — ${formatDate(metrics.last_commit_period)}`
        : 'Complete history';
    return (_jsxs("div", { className: "panel", style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
        }, children: [_jsxs("div", { style: { padding: '16px 20px', borderRight: '1px solid var(--border-subtle)' }, children: [_jsx("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }, children: "Total Commits" }), _jsx("div", { className: "tabular", style: { fontSize: '1.65rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }, children: (metrics.total_commits || 0).toLocaleString() }), _jsx("div", { style: { fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }, children: timespan })] }), _jsxs("div", { style: { padding: '16px 20px', borderRight: '1px solid var(--border-subtle)' }, children: [_jsx("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }, children: "Contributors" }), _jsx("div", { className: "tabular", style: { fontSize: '1.65rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }, children: (metrics.total_contributors || 0).toLocaleString() }), _jsx("div", { style: { fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }, children: "Tracked in lakehouse graph" })] }), _jsxs("div", { style: { padding: '16px 20px', borderRight: '1px solid var(--border-subtle)' }, children: [_jsx("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }, children: "Insertions" }), _jsxs("div", { className: "tabular", style: { fontSize: '1.65rem', fontWeight: 600, color: 'var(--status-emerald)', lineHeight: 1.2 }, children: ["+", (metrics.total_insertions || 0).toLocaleString()] }), _jsx("div", { style: { fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }, children: "Gross lines added" })] }), _jsxs("div", { style: { padding: '16px 20px', borderRight: '1px solid var(--border-subtle)' }, children: [_jsx("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }, children: "Deletions" }), _jsxs("div", { className: "tabular", style: { fontSize: '1.65rem', fontWeight: 600, color: 'var(--status-rose)', lineHeight: 1.2 }, children: ["-", (metrics.total_deletions || 0).toLocaleString()] }), _jsx("div", { style: { fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }, children: "Pruned & refactored" })] }), _jsxs("div", { style: { padding: '16px 20px', borderRight: '1px solid var(--border-subtle)' }, children: [_jsx("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }, children: "Files Modified" }), _jsx("div", { className: "tabular", style: { fontSize: '1.65rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }, children: (metrics.total_files_changed || 0).toLocaleString() }), _jsx("div", { style: { fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '4px' }, children: "Distinct file revisions" })] }), _jsxs("div", { style: { padding: '16px 20px' }, children: [_jsx("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }, children: "Language / Branch" }), _jsx("div", { style: { fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, marginTop: '2px' }, children: repository.language || 'Multi-stack' }), _jsxs("div", { className: "mono", style: { fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '6px' }, children: ["branch: ", _jsx("span", { style: { color: 'var(--text-secondary)' }, children: repository.default_branch }), repository.head_commit_hash && (_jsxs("span", { children: [" \u2022 ", repository.head_commit_hash.substring(0, 7)] }))] })] })] }));
};
