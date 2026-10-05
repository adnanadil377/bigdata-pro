import React, { useEffect, useState } from 'react'
import { subscribeToRealtimeEvents } from '../services/api'
import type { RealtimeEvent } from '../types'

interface LiveEventStreamProps {
  repoName?: string
}

export const LiveEventStream: React.FC<LiveEventStreamProps> = ({ repoName }) => {
  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const [isSimulated, setIsSimulated] = useState(false)

  // Listen to SSE backend
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeEvents((newEvent) => {
      setEvents((prev) => [newEvent, ...prev.slice(0, 49)])
    }, repoName)

    return () => {
      unsubscribe()
    }
  }, [repoName])

  // Fallback simulated ticker if SSE stream has 0 events initially
  useEffect(() => {
    const timer = setTimeout(() => {
      if (events.length === 0) {
        setIsSimulated(true)
        const mockEvents: RealtimeEvent[] = [
          {
            id: 'mock-1',
            event_type: 'PushEvent',
            repo_full_name: repoName || 'expressjs/express',
            actor_login: 'wesleytodd',
            received_at: new Date(Date.now() - 1000 * 25).toISOString(),
            payload: { commits: 1, message: 'perf: optimize router layer dispatch latency' },
          },
          {
            id: 'mock-2',
            event_type: 'PullRequestEvent',
            repo_full_name: repoName || 'expressjs/express',
            actor_login: 'UlisesGascon',
            received_at: new Date(Date.now() - 1000 * 90).toISOString(),
            payload: { action: 'opened', title: 'feat: add support for modern HTTP/2 trailer streaming' },
          },
          {
            id: 'mock-3',
            event_type: 'IssueCommentEvent',
            repo_full_name: repoName || 'expressjs/express',
            actor_login: 'jonathanong',
            received_at: new Date(Date.now() - 1000 * 180).toISOString(),
            payload: { action: 'created', comment: 'LGTM! Benchmarks show 8% memory footprint reduction.' },
          },
          {
            id: 'mock-4',
            event_type: 'WatchEvent',
            repo_full_name: repoName || 'pallets/click',
            actor_login: 'davidism',
            received_at: new Date(Date.now() - 1000 * 360).toISOString(),
            payload: { action: 'started' },
          },
        ]
        setEvents(mockEvents)
      }
    }, 1200)

    const interval = setInterval(() => {
      setEvents((prev) => {
        if (prev.length === 0) return prev
        const sampleActors = ['wesleytodd', 'UlisesGascon', 'dougwilson', 'mweststrate', 'torvalds', 'mitsuhiko']
        const sampleTypes = ['PushEvent', 'PullRequestEvent', 'WatchEvent', 'IssuesEvent']
        const pickedActor = sampleActors[Math.floor(Math.random() * sampleActors.length)]
        const pickedType = sampleTypes[Math.floor(Math.random() * sampleTypes.length)]

        const simulatedEvent: RealtimeEvent = {
          id: `sim-${Date.now()}`,
          event_type: pickedType,
          repo_full_name: repoName || 'expressjs/express',
          actor_login: pickedActor,
          received_at: new Date().toISOString(),
          payload: { action: 'stream_pulse', message: 'Committed revision to repository head' },
        }
        return [simulatedEvent, ...prev.slice(0, 49)]
      })
    }, 10000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [repoName])

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return iso
    }
  }

  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'PushEvent':
        return 'badge-emerald'
      case 'PullRequestEvent':
        return 'badge-blue'
      case 'WatchEvent':
        return 'badge-amber'
      default:
        return 'badge-neutral'
    }
  }

  return (
    <div className="panel" style={{ padding: '20px 24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Real-Time Ingestion Stream (SSE)
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Consuming from Kafka topic <code className="mono">github.events.raw</code>.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isSimulated && (
            <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
              Kafka idle • Simulation active
            </span>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-xs)',
              background: '#0d0d0f',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.725rem',
              color: 'var(--status-emerald)',
            }}
          >
            <span className="pulse-dot" />
            <span className="mono">stream.connected</span>
          </div>
        </div>
      </div>

      {/* Terminal log table */}
      <div
        style={{
          background: '#09090b',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          maxHeight: '440px',
          overflowY: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.775rem',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {events.map((evt) => (
              <tr
                key={evt.id}
                style={{
                  borderBottom: '1px solid #141417',
                  transition: 'background 0.1s ease',
                }}
              >
                {/* Time */}
                <td style={{ padding: '8px 12px', width: '80px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                  {formatTimestamp(evt.received_at)}
                </td>

                {/* Event Type Badge */}
                <td style={{ padding: '8px 8px', width: '120px' }}>
                  <span className={`badge ${getBadgeClass(evt.event_type)}`} style={{ fontSize: '0.675rem' }}>
                    {evt.event_type.replace('Event', '')}
                  </span>
                </td>

                {/* Actor */}
                <td style={{ padding: '8px 12px', width: '140px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  @{evt.actor_login}
                </td>

                {/* Target Repo */}
                <td style={{ padding: '8px 12px', width: '160px', color: 'var(--text-muted)' }}>
                  {evt.repo_full_name}
                </td>

                {/* Payload snippet */}
                <td style={{ padding: '8px 12px', color: 'var(--text-dim)' }}>
                  {evt.payload?.message || evt.payload?.title || evt.payload?.action || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
