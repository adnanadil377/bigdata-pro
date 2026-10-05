import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Code, FileCode2, GitCommit, MinusCircle, PlusCircle, Users, } from 'lucide-react';
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
        : 'All history';
    return (_jsxs("section", { className: "metrics-grid", "aria-label": "Repository Metrics", children: [_jsxs("div", { className: "glass-panel metric-card", style: { '--card-accent': 'var(--primary)' }, children: [_jsxs("div", { className: "metric-header", children: [_jsx("span", { children: "Total Commits" }), _jsx(GitCommit, { size: 16, color: "var(--primary-light)" })] }), _jsx("div", { className: "metric-value mono", children: (metrics.total_commits || 0).toLocaleString() }), _jsx("div", { className: "metric-subtext", children: _jsxs("span", { children: ["Time span: ", timespan] }) })] }), _jsxs("div", { className: "glass-panel metric-card", style: { '--card-accent': 'var(--cyan)' }, children: [_jsxs("div", { className: "metric-header", children: [_jsx("span", { children: "Contributors" }), _jsx(Users, { size: 16, color: "var(--cyan)" })] }), _jsx("div", { className: "metric-value mono", children: (metrics.total_contributors || 0).toLocaleString() }), _jsx("div", { className: "metric-subtext", children: _jsx("span", { children: "Active in lakehouse history" }) })] }), _jsxs("div", { className: "glass-panel metric-card", style: { '--card-accent': 'var(--emerald)' }, children: [_jsxs("div", { className: "metric-header", children: [_jsx("span", { children: "Lines Inserted" }), _jsx(PlusCircle, { size: 16, color: "var(--emerald)" })] }), _jsxs("div", { className: "metric-value mono", style: { color: 'var(--emerald)' }, children: ["+", (metrics.total_insertions || 0).toLocaleString()] }), _jsx("div", { className: "metric-subtext", children: _jsx("span", { children: "Code volume added" }) })] }), _jsxs("div", { className: "glass-panel metric-card", style: { '--card-accent': 'var(--rose)' }, children: [_jsxs("div", { className: "metric-header", children: [_jsx("span", { children: "Lines Deleted" }), _jsx(MinusCircle, { size: 16, color: "var(--rose)" })] }), _jsxs("div", { className: "metric-value mono", style: { color: 'var(--rose)' }, children: ["-", (metrics.total_deletions || 0).toLocaleString()] }), _jsx("div", { className: "metric-subtext", children: _jsx("span", { children: "Refactored & pruned code" }) })] }), _jsxs("div", { className: "glass-panel metric-card", style: { '--card-accent': 'var(--amber)' }, children: [_jsxs("div", { className: "metric-header", children: [_jsx("span", { children: "Files Changed" }), _jsx(FileCode2, { size: 16, color: "var(--amber)" })] }), _jsx("div", { className: "metric-value mono", children: (metrics.total_files_changed || 0).toLocaleString() }), _jsx("div", { className: "metric-subtext", children: _jsx("span", { children: "Across all revisions" }) })] }), _jsxs("div", { className: "glass-panel metric-card", style: { '--card-accent': 'var(--violet)' }, children: [_jsxs("div", { className: "metric-header", children: [_jsx("span", { children: "Language / Branch" }), _jsx(Code, { size: 16, color: "var(--violet)" })] }), _jsx("div", { className: "metric-value", style: { fontSize: '1.4rem' }, children: repository.language || 'Multi-language' }), _jsxs("div", { className: "metric-subtext mono", children: [_jsxs("span", { children: ["Branch: ", _jsx("strong", { children: repository.default_branch })] }), repository.head_commit_hash && (_jsxs("span", { children: ["\u2022 ", repository.head_commit_hash.substring(0, 7)] }))] })] })] }));
};
