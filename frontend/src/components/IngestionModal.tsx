import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'
import { fetchJobStatus, triggerIngestion } from '../services/api'
import type { IngestionJob } from '../types'

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
          }, 1000)
        } else if (updated.status === 'failed') {
          setErrorMessage(updated.error_message || 'Ingestion failed on container worker')
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
      })
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit ingestion job')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Ingest Repository
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Blobless clone extraction into MinIO Parquet & PostgreSQL.
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
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {errorMessage && (
            <div
              style={{
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
              }}
            >
              <AlertCircle size={15} />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeJob ? (
            /* Progress Stepper */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '6px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="mono" style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  {activeJob.repo_owner}/{activeJob.repo_name}
                </span>
                <span className="badge badge-neutral">{activeJob.status.toUpperCase()}</span>
              </div>

              {/* Minimal Progress Bar */}
              <div style={{ height: '4px', background: '#222226', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${activeJob.progress_pct}%`,
                    background: activeJob.status === 'failed' ? 'var(--status-rose)' : 'var(--text-primary)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>{activeJob.current_step}</span>
                <span className="mono tabular">{activeJob.progress_pct}%</span>
              </div>

              {activeJob.total_commits > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--status-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={13} />
                  <span className="mono tabular">{activeJob.total_commits.toLocaleString()} commits extracted</span>
                </div>
              )}

              {activeJob.status !== 'completed' && activeJob.status !== 'failed' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.725rem' }}>
                  <Loader2 size={12} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Processing in background…</span>
                </div>
              )}
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  GitHub Repository URL or Shorthand *
                </label>
                <input
                  id="repo-url-input"
                  type="text"
                  required
                  placeholder="e.g. facebook/react or https://github.com/..."
                  className="form-input"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Target Branch (Optional)
                </label>
                <input
                  id="branch-input"
                  type="text"
                  placeholder="Defaults to remote default (e.g. main / master)"
                  className="form-input"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  GitHub Access Token (Optional)
                </label>
                <input
                  id="token-input"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx (for private repositories)"
                  className="form-input"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button
                  id="submit-ingest-btn"
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmitting || !repoUrl.trim()}
                >
                  {isSubmitting ? 'Dispatching…' : 'Start Ingestion'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
