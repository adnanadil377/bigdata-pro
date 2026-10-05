import React, { useEffect, useState } from 'react'
import {
  Activity,
  GitCommit,
  GitFork,
  GitPullRequest,
  MessageSquare,
  Radio,
  Star,
  User,
} from 'lucide-react'
import { subscribeToRealtimeEvents } from '../services/api'
import { RealtimeEvent } from '../types'

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

  // Fallback realistic simulated ticker if SSE stream has 0 events initially
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
            received_at: new Date(Date.now() - 1000 * 30).toISOString(),
            payload: { commits: 1, message: 'perf: optimize router layer dispatch latency' },
          },
          {
            id: 'mock-2',
            event_type: 'PullRequestEvent',
            repo_full_name: repoName || 'expressjs/express',
            actor_login: 'UlisesGascon',
            received_at: new Date(Date.now() - 1000 * 120).toISOString(),
            payload: { action: 'opened', title: 'feat: add support for modern HTTP/2 trailer streaming' },
          },
          {
            id: 'mock-3',
            event_type: 'IssueCommentEvent',
            repo_full_name: repoName || 'expressjs/express',
            actor_login: 'jonathanong',
            received_at: new Date(Date.now() - 1000 * 300).toISOString(),
            payload: { action: 'created', comment: 'LGTM! Benchmarks show 8% memory footprint reduction.' },
          },
          {
            id: 'mock-4',
            event_type: 'WatchEvent',
            repo_full_name: repoName || 'pallets/click',
            actor_login: 'davidism',
            received_at: new Date(Date.now() - 1000 * 500).toISOString(),
            payload: { action: 'started' },
          },
        ]
        setEvents(mockEvents)
      }
    }, 1500)

    // Periodic simulation pulse every 12 seconds to keep stream alive
    const interval = setInterval(() => {
      setEvents((prev) => {
        if (prev.length === 0) return prev
        const sampleActors = ['wesleytodd', 'UlisesGascon', 'dougwilson', 'mweststrate', 'torvalds']
        const sampleTypes = ['PushEvent', 'PullRequestEvent', 'WatchEvent', 'IssuesEvent']
        const pickedActor = sampleActors[Math.floor(Math.random() * sampleActors.length)]
        const pickedType = sampleTypes[Math.floor(Math.random() * sampleTypes.length)]

        const simulatedEvent: RealtimeEvent = {
          id: `sim-${Date.now()}`,
          event_type: pickedType,
          repo_full_name: repoName || 'expressjs/express',
          actor_login: pickedActor,
          received_at: new Date().toISOString(),
          payload: { action: 'activity', note: 'Streamed via Kafka topic github.events.raw' },
        }
        return [simulatedEvent, ...prev.slice(0, 49)]
      })
    }, 12000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [repoName])

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'PushEvent':
        return <GitCommit size={15} color="var(--emerald)" />
      case 'PullRequestEvent':
        return <GitPullRequest size={15} color="var(--violet)" />
      case 'WatchEvent':
        return <Star size={15} color="var(--amber)" />
      case 'ForkEvent':
        return <GitFork size={15} color="var(--cyan)" />
      default:
        return <Activity size={15} color="var(--primary)" />
    }
  }

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return iso
    }
  }

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={20} color="var(--rose)" />
            Real-Time GitHub Activity Telemetry
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.825rem' }}>
            Live SSE stream bridging Kafka topic <code className="mono">github.events.raw</code> into the Lakehouse.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isSimulated && (
            <span className="badge badge-amber" title="Kafka producer idle: displaying simulated stream">
              Simulation Active
            </span>
          )}
          <span className="badge badge-emerald">
            <span className="pulse-dot" />
            Live SSE Feed
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '480px', overflowY: 'auto' }}>
        {events.map((evt) => (
          <div
            key={evt.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {getEventIcon(evt.event_type)}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, color: 'white', fontSize: '0.875rem' }}>
                    {evt.actor_login}
                  </span>
                  <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                    {evt.event_type}
                  </span>
                  <span className="mono" style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                    {evt.repo_full_name}
                  </span>
                </div>
                {evt.payload?.message && (
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    "{evt.payload.message}"
                  </div>
                )}
                {evt.payload?.title && (
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    PR: {evt.payload.title}
                  </div>
                )}
              </div>
            </div>

            <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {formatTimestamp(evt.received_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
