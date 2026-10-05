import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { subscribeToRealtimeEvents } from '../services/api';
export const LiveEventStream = ({ repoName }) => {
    const [events, setEvents] = useState([]);
    const [isSimulated, setIsSimulated] = useState(false);
    // Listen to SSE backend
    useEffect(() => {
        const unsubscribe = subscribeToRealtimeEvents((newEvent) => {
            setEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
        }, repoName);
        return () => {
            unsubscribe();
        };
    }, [repoName]);
    // Fallback simulated ticker if SSE stream has 0 events initially
    useEffect(() => {
        const timer = setTimeout(() => {
            if (events.length === 0) {
                setIsSimulated(true);
                const mockEvents = [
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
                ];
                setEvents(mockEvents);
            }
        }, 1200);
        const interval = setInterval(() => {
            setEvents((prev) => {
                if (prev.length === 0)
                    return prev;
                const sampleActors = ['wesleytodd', 'UlisesGascon', 'dougwilson', 'mweststrate', 'torvalds', 'mitsuhiko'];
                const sampleTypes = ['PushEvent', 'PullRequestEvent', 'WatchEvent', 'IssuesEvent'];
                const pickedActor = sampleActors[Math.floor(Math.random() * sampleActors.length)];
                const pickedType = sampleTypes[Math.floor(Math.random() * sampleTypes.length)];
                const simulatedEvent = {
                    id: `sim-${Date.now()}`,
                    event_type: pickedType,
                    repo_full_name: repoName || 'expressjs/express',
                    actor_login: pickedActor,
                    received_at: new Date().toISOString(),
                    payload: { action: 'stream_pulse', message: 'Committed revision to repository head' },
                };
                return [simulatedEvent, ...prev.slice(0, 49)];
            });
        }, 10000);
        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [repoName]);
    const formatTimestamp = (iso) => {
        try {
            const d = new Date(iso);
            return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        catch {
            return iso;
        }
    };
    const getBadgeClass = (type) => {
        switch (type) {
            case 'PushEvent':
                return 'badge-emerald';
            case 'PullRequestEvent':
                return 'badge-blue';
            case 'WatchEvent':
                return 'badge-amber';
            default:
                return 'badge-neutral';
        }
    };
    return (_jsxs("div", { className: "panel", style: { padding: '20px 24px' }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }, children: "Real-Time Ingestion Stream (SSE)" }), _jsxs("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)' }, children: ["Consuming from Kafka topic ", _jsx("code", { className: "mono", children: "github.events.raw" }), "."] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [isSimulated && (_jsx("span", { className: "badge badge-neutral", style: { fontSize: '0.7rem' }, children: "Kafka idle \u2022 Simulation active" })), _jsxs("div", { style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '3px 8px',
                                    borderRadius: 'var(--radius-xs)',
                                    background: '#0d0d0f',
                                    border: '1px solid var(--border-subtle)',
                                    fontSize: '0.725rem',
                                    color: 'var(--status-emerald)',
                                }, children: [_jsx("span", { className: "pulse-dot" }), _jsx("span", { className: "mono", children: "stream.connected" })] })] })] }), _jsx("div", { style: {
                    background: '#09090b',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    maxHeight: '440px',
                    overflowY: 'auto',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.775rem',
                }, children: _jsx("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: _jsx("tbody", { children: events.map((evt) => (_jsxs("tr", { style: {
                                borderBottom: '1px solid #141417',
                                transition: 'background 0.1s ease',
                            }, children: [_jsx("td", { style: { padding: '8px 12px', width: '80px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }, children: formatTimestamp(evt.received_at) }), _jsx("td", { style: { padding: '8px 8px', width: '120px' }, children: _jsx("span", { className: `badge ${getBadgeClass(evt.event_type)}`, style: { fontSize: '0.675rem' }, children: evt.event_type.replace('Event', '') }) }), _jsxs("td", { style: { padding: '8px 12px', width: '140px', color: 'var(--text-primary)', fontWeight: 500 }, children: ["@", evt.actor_login] }), _jsx("td", { style: { padding: '8px 12px', width: '160px', color: 'var(--text-muted)' }, children: evt.repo_full_name }), _jsx("td", { style: { padding: '8px 12px', color: 'var(--text-dim)' }, children: evt.payload?.message || evt.payload?.title || evt.payload?.action || '—' })] }, evt.id))) }) }) })] }));
};
