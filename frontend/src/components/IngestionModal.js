import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Database, GitBranch, Key, Loader2, X, } from 'lucide-react';
import { fetchJobStatus, triggerIngestion } from '../services/api';
export const IngestionModal = ({ isOpen, onClose, onIngestionSuccess, }) => {
    const [repoUrl, setRepoUrl] = useState('');
    const [branch, setBranch] = useState('');
    const [token, setToken] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeJob, setActiveJob] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    // Reset state on modal open/close
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
    // Poll job status if a job is in flight
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
                    }, 1200);
                }
                else if (updated.status === 'failed') {
                    setErrorMessage(updated.error_message || 'Ingestion failed on worker');
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
            // Set initial job state
            setActiveJob({
                id: res.job_id,
                repo_url: repoUrl,
                repo_owner: res.owner,
                repo_name: res.name,
                branch: branch || 'main',
                status: 'queued',
                progress_pct: 10,
                current_step: 'Submitting to Lakehouse pipeline…',
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
    return (_jsx("div", { className: "modal-overlay", onClick: onClose, role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "modal-content", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '20px 24px',
                        borderBottom: '1px solid var(--border-subtle)',
                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx("div", { style: {
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        background: 'rgba(99, 102, 241, 0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--primary-light)',
                                    }, children: _jsx(Database, { size: 18 }) }), _jsxs("div", { children: [_jsx("h2", { style: { fontSize: '1.15rem' }, children: "Ingest GitHub Repository" }), _jsx("p", { style: { color: 'var(--text-dim)', fontSize: '0.775rem' }, children: "Zero depth limits \u2022 Blobless clone \u2022 MinIO Parquet & PostgreSQL" })] })] }), _jsx("button", { onClick: onClose, style: {
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                            }, children: _jsx(X, { size: 18 }) })] }), _jsxs("div", { style: { padding: '24px' }, children: [errorMessage && (_jsxs("div", { style: {
                                padding: '12px 14px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(244, 63, 94, 0.15)',
                                border: '1px solid rgba(244, 63, 94, 0.3)',
                                color: '#fda4af',
                                fontSize: '0.825rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '16px',
                            }, children: [_jsx(AlertCircle, { size: 16 }), _jsx("span", { children: errorMessage })] })), activeJob ? (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px 0' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("span", { style: { fontWeight: 600, color: 'white' }, children: [activeJob.repo_owner, "/", activeJob.repo_name] }), _jsx("span", { className: `badge ${activeJob.status === 'completed' ? 'badge-emerald' : activeJob.status === 'failed' ? 'badge-rose' : 'badge-indigo'}`, children: activeJob.status.toUpperCase() })] }), _jsx("div", { style: { height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }, children: _jsx("div", { style: {
                                            height: '100%',
                                            width: `${activeJob.progress_pct}%`,
                                            background: activeJob.status === 'failed' ? 'var(--rose)' : 'linear-gradient(90deg, #6366f1, #06b6d4)',
                                            borderRadius: '4px',
                                            transition: 'width 0.4s ease',
                                        } }) }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }, children: [_jsx("span", { children: activeJob.current_step }), _jsxs("span", { className: "mono", children: [activeJob.progress_pct, "%"] })] }), activeJob.total_commits > 0 && (_jsxs("div", { style: { fontSize: '0.775rem', color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsx(CheckCircle2, { size: 14 }), _jsxs("span", { children: [activeJob.total_commits.toLocaleString(), " commits extracted"] })] })), activeJob.status !== 'completed' && activeJob.status !== 'failed' && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '8px' }, children: [_jsx(Loader2, { size: 14, className: "animate-spin", style: { animation: 'spin 1s linear infinite' } }), _jsx("span", { children: "Pipeline running in container backend\u2026" })] }))] })) : (_jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "form-group", children: [_jsxs("label", { className: "form-label", htmlFor: "repo-url-input", children: [_jsx("span", { children: "GitHub Repository URL or Shorthand *" }), _jsx("span", { style: { fontSize: '0.725rem', color: 'var(--text-dim)' }, children: "e.g. facebook/react" })] }), _jsx("input", { id: "repo-url-input", type: "text", required: true, placeholder: "https://github.com/owner/repository", className: "form-input", value: repoUrl, onChange: (e) => setRepoUrl(e.target.value), autoFocus: true })] }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { className: "form-label", htmlFor: "branch-input", children: [_jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx(GitBranch, { size: 13 }), " Target Branch (Optional)"] }), _jsx("span", { style: { fontSize: '0.725rem', color: 'var(--text-dim)' }, children: "Defaults to remote default" })] }), _jsx("input", { id: "branch-input", type: "text", placeholder: "main, master, or release branch", className: "form-input", value: branch, onChange: (e) => setBranch(e.target.value) })] }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { className: "form-label", htmlFor: "token-input", children: [_jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx(Key, { size: 13 }), " Personal Access Token (Optional)"] }), _jsx("span", { style: { fontSize: '0.725rem', color: 'var(--text-dim)' }, children: "For private repositories" })] }), _jsx("input", { id: "token-input", type: "password", placeholder: "ghp_xxxxxxxxxxxxxxxxxxxx", className: "form-input", value: token, onChange: (e) => setToken(e.target.value) })] }), _jsxs("div", { style: {
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        gap: '12px',
                                        marginTop: '24px',
                                    }, children: [_jsx("button", { type: "button", className: "btn btn-secondary", onClick: onClose, disabled: isSubmitting, children: "Cancel" }), _jsx("button", { id: "submit-ingest-btn", type: "submit", className: "btn btn-primary", disabled: isSubmitting || !repoUrl.trim(), children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { size: 16, className: "animate-spin", style: { animation: 'spin 1s linear infinite' } }), _jsx("span", { children: "Dispatching\u2026" })] })) : (_jsx("span", { children: "Start Lakehouse Ingestion" })) })] })] }))] })] }) }));
};
