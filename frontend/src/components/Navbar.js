import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronDown, Layers, Plus, RefreshCw, } from 'lucide-react';
export const Navbar = ({ repositories, selectedRepo, onSelectRepo, onOpenIngestModal, onResync, isResyncing, backendStatus, }) => {
    return (_jsxs("header", { className: "app-header", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '14px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("div", { style: {
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '6px',
                                    background: '#18181b',
                                    border: '1px solid var(--border-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-primary)',
                                }, children: _jsx(Layers, { size: 14 }) }), _jsx("span", { style: { fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }, children: "bigdata-pro" })] }), _jsx("span", { style: { color: 'var(--text-dim)' }, children: "/" }), repositories.length > 0 && selectedRepo && (_jsxs("div", { style: { position: 'relative', display: 'flex', alignItems: 'center' }, children: [_jsx("select", { id: "repo-selector", className: "minimal-select", value: `${selectedRepo.owner}/${selectedRepo.name}`, onChange: (e) => {
                                    const found = repositories.find((r) => `${r.owner}/${r.name}` === e.target.value);
                                    if (found)
                                        onSelectRepo(found);
                                }, children: repositories.map((r) => (_jsxs("option", { value: `${r.owner}/${r.name}`, children: [r.owner, "/", r.name] }, r.id))) }), _jsx(ChevronDown, { size: 12, style: {
                                    position: 'absolute',
                                    right: '8px',
                                    pointerEvents: 'none',
                                    color: 'var(--text-muted)',
                                } })] }))] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [_jsxs("div", { style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-xs)',
                            border: '1px solid var(--border-subtle)',
                            background: '#0d0d0f',
                        }, title: backendStatus ? 'Apache Iceberg + Spark + PostgreSQL operational' : 'Lakehouse API offline', children: [_jsx("span", { className: "pulse-dot", style: { backgroundColor: backendStatus ? 'var(--status-emerald)' : 'var(--status-rose)' } }), _jsx("span", { className: "mono", children: backendStatus ? 'lakehouse.online' : 'offline' })] }), selectedRepo && (_jsxs("button", { id: "resync-btn", className: "btn btn-secondary btn-sm", onClick: onResync, disabled: isResyncing, title: "Fetch latest commits from GitHub", children: [_jsx(RefreshCw, { size: 12, style: {
                                    animation: isResyncing ? 'spin 1s linear infinite' : 'none',
                                    opacity: isResyncing ? 1 : 0.7,
                                } }), _jsx("span", { children: isResyncing ? 'Syncing' : 'Sync' })] })), _jsxs("button", { id: "open-ingest-modal-btn", className: "btn btn-primary btn-sm", onClick: onOpenIngestModal, children: [_jsx(Plus, { size: 13 }), _jsx("span", { children: "Ingest Repo" })] })] }), _jsx("style", { children: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` })] }));
};
