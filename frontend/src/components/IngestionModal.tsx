import React, { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Database,
  ExternalLink,
  GitBranch,
  Key,
  Loader2,
  X,
} from 'lucide-react'
import { fetchJobStatus, triggerIngestion } from '../services/api'
import { IngestionJob } from '../types'

interface IngestionModalProps {
  isOpen: boolean
  onClose: () => void
  onIngestionSuccess: (owner: string, name: string) => void
}

export const IngestionModal: React.FC<IngestionModalProps> = ({
  isOpen,
  onClose,
  onIngestionSuccess,
}) => {
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('')
  const [token, setToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeJob, setActiveJob] = useState<IngestionJob | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Reset state on modal open/close
  useEffect(() => {
    if (!isOpen) {
      setRepoUrl('')
      setBranch('')
      setToken('')
      setIsSubmitting(false)
      setActiveJob(null)
      setErrorMessage(null)
    }
  }, [isOpen])

  // Poll job status if a job is in flight
  useEffect(() => {
    if (!activeJob || activeJob.status === 'completed' || activeJob.status === 'failed') {
      return
    }

    const interval = setInterval(async () => {
      try {
        const updated = await fetchJobStatus(activeJob.id)
        setActiveJob(updated)

        if (updated.status === 'completed') {
          setTimeout(() => {
            onIngestionSuccess(updated.repo_owner, updated.repo_name)
            onClose()
          }, 1200)
        } else if (updated.status === 'failed') {
          setErrorMessage(updated.error_message || 'Ingestion failed on worker')
        }
      } catch (err: any) {
        console.error('Failed to poll job status', err)
      }
    }, 1500)

    return () => clearInterval(interval)
  }, [activeJob, onIngestionSuccess, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl.trim()) return

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const res = await triggerIngestion({
        repo_url: repoUrl.trim(),
        branch: branch.trim() || undefined,
        access_token: token.trim() || undefined,
      })

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
      })
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit ingestion job')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-light)',
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem' }}>Ingest GitHub Repository</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.775rem' }}>
                Zero depth limits • Blobless clone • MinIO Parquet & PostgreSQL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {errorMessage && (
            <div
              style={{
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
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeJob ? (
            /* Progress Tracking View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: 'white' }}>
                  {activeJob.repo_owner}/{activeJob.repo_name}
                </span>
                <span className={`badge ${activeJob.status === 'completed' ? 'badge-emerald' : activeJob.status === 'failed' ? 'badge-rose' : 'badge-indigo'}`}>
                  {activeJob.status.toUpperCase()}
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${activeJob.progress_pct}%`,
                    background: activeJob.status === 'failed' ? 'var(--rose)' : 'linear-gradient(90deg, #6366f1, #06b6d4)',
                    borderRadius: '4px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>{activeJob.current_step}</span>
                <span className="mono">{activeJob.progress_pct}%</span>
              </div>

              {activeJob.total_commits > 0 && (
                <div style={{ fontSize: '0.775rem', color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} />
                  <span>{activeJob.total_commits.toLocaleString()} commits extracted</span>
                </div>
              )}

              {activeJob.status !== 'completed' && activeJob.status !== 'failed' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '8px' }}>
                  <Loader2 size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Pipeline running in container backend…</span>
                </div>
              )}
            </div>
          ) : (
            /* Ingestion Form */
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="repo-url-input">
                  <span>GitHub Repository URL or Shorthand *</span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>e.g. facebook/react</span>
                </label>
                <input
                  id="repo-url-input"
                  type="text"
                  required
                  placeholder="https://github.com/owner/repository"
                  className="form-input"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="branch-input">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <GitBranch size={13} /> Target Branch (Optional)
                  </span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>Defaults to remote default</span>
                </label>
                <input
                  id="branch-input"
                  type="text"
                  placeholder="main, master, or release branch"
                  className="form-input"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="token-input">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Key size={13} /> Personal Access Token (Optional)
                  </span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>For private repositories</span>
                </label>
                <input
                  id="token-input"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="form-input"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '24px',
                }}
              >
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button
                  id="submit-ingest-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || !repoUrl.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Dispatching…</span>
                    </>
                  ) : (
                    <span>Start Lakehouse Ingestion</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
