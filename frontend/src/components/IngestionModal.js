import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { fetchJobStatus, triggerIngestion } from '../services/api';
export const IngestionModal = ({ isOpen, onClose, onIngestionSuccess, }) => {
    const [repoUrl, setRepoUrl] = useState('');
    const [branch, setBranch] = useState('');
    const [token, setToken] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeJob, setActiveJob] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    useEffect(() => {
        if (!isOpen) {
            setRepoUrl('');
            setBranch('');
            setToken('');
            setIsSubmitting(false);
            setActiveJob(null);
            setErrorMessage(null);
        }
    }, [isOpen]);
    useEffect(() => {
        if (!activeJob || activeJob.status === 'completed' || activeJob.status === 'failed') {
            return;
        }
        const interval = setInterval(async () => {
            try {
                const updated = await fetchJobStatus(activeJob.id);
                setActiveJob(updated);
                if (updated.status === 'completed') {
                    setTimeout(() => {
                        onIngestionSuccess(updated.repo_owner, updated.repo_name);
                        onClose();
                    }, 1000);
                }
                else if (updated.status === 'failed') {
                    setErrorMessage(updated.error_message || 'Ingestion failed on container worker');
                }
            }
            catch (err) {
                console.error('Failed to poll job status', err);
            }
        }, 1500);
        return () => clearInterval(interval);
    }, [activeJob, onIngestionSuccess, onClose]);
    if (!isOpen)
        return null;
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!repoUrl.trim())
            return;
        setIsSubmitting(true);
        setErrorMessage(null);
        try {
            const res = await triggerIngestion({
                repo_url: repoUrl.trim(),
                branch: branch.trim() || undefined,
                access_token: token.trim() || undefined,
            });
            setActiveJob({
                id: res.job_id,
                repo_url: repoUrl,
                repo_owner: res.owner,
                repo_name: res.name,
                branch: branch || 'main',
                status: 'queued',
                progress_pct: 10,
                current_step: 'Submitting to blobless clone pipeline…',
                total_commits: 0,
                error_message: null,
                created_at: new Date().toISOString(),
            });
        }
        catch (err) {
            setErrorMessage(err.message || 'Failed to submit ingestion job');
            setIsSubmitting(false);
        }
    };
    return (_jsx("div", { className: "modal-backdrop", onClick: onClose, role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "modal-dialog", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--border-subtle)',
                    }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }, children: "Ingest Repository" }), _jsx("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)' }, children: "Blobless clone extraction into MinIO Parquet & PostgreSQL." })] }), _jsx("button", { onClick: onClose, style: {
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                            }, children: _jsx(X, { size: 16 }) })] }), _jsxs("div", { style: { padding: '20px' }, children: [errorMessage && (_jsxs("div", { style: {
                                padding: '10px 12px',
                                borderRadius: 'var(--radius-xs)',
                                background: 'var(--status-rose-bg)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: 'var(--status-rose)',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '14px',
                            }, children: [_jsx(AlertCircle, { size: 15 }), _jsx("span", { children: errorMessage })] })), activeJob ? (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '14px', padding: '6px 0' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("span", { className: "mono", style: { fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }, children: [activeJob.repo_owner, "/", activeJob.repo_name] }), _jsx("span", { className: "badge badge-neutral", children: activeJob.status.toUpperCase() })] }), _jsx("div", { style: { height: '4px', background: '#222226', borderRadius: '2px', overflow: 'hidden' }, children: _jsx("div", { style: {
                                            height: '100%',
                                            width: `${activeJob.progress_pct}%`,
                                            background: activeJob.status === 'failed' ? 'var(--status-rose)' : 'var(--text-primary)',
                                            transition: 'width 0.3s ease',
                                        } }) }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }, children: [_jsx("span", { children: activeJob.current_step }), _jsxs("span", { className: "mono tabular", children: [activeJob.progress_pct, "%"] })] }), activeJob.total_commits > 0 && (_jsxs("div", { style: { fontSize: '0.75rem', color: 'var(--status-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsx(CheckCircle2, { size: 13 }), _jsxs("span", { className: "mono tabular", children: [activeJob.total_commits.toLocaleString(), " commits extracted"] })] })), activeJob.status !== 'completed' && activeJob.status !== 'failed' && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.725rem' }, children: [_jsx(Loader2, { size: 12, className: "animate-spin", style: { animation: 'spin 1s linear infinite' } }), _jsx("span", { children: "Processing in background\u2026" })] }))] })) : (_jsxs("form", { onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: '14px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }, children: "GitHub Repository URL or Shorthand *" }), _jsx("input", { id: "repo-url-input", type: "text", required: true, placeholder: "e.g. facebook/react or https://github.com/...", className: "form-input", value: repoUrl, onChange: (e) => setRepoUrl(e.target.value), autoFocus: true })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }, children: "Target Branch (Optional)" }), _jsx("input", { id: "branch-input", type: "text", placeholder: "Defaults to remote default (e.g. main / master)", className: "form-input", value: branch, onChange: (e) => setBranch(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }, children: "GitHub Access Token (Optional)" }), _jsx("input", { id: "token-input", type: "password", placeholder: "ghp_xxxxxxxxxxxx (for private repositories)", className: "form-input", value: token, onChange: (e) => setToken(e.target.value) })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }, children: [_jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: onClose, disabled: isSubmitting, children: "Cancel" }), _jsx("button", { id: "submit-ingest-btn", type: "submit", className: "btn btn-primary btn-sm", disabled: isSubmitting || !repoUrl.trim(), children: isSubmitting ? 'Dispatching…' : 'Start Ingestion' })] })] }))] })] }) }));
};
