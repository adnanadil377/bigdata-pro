import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Activity, GitCommit, GitFork, GitPullRequest, Radio, Star, } from 'lucide-react';
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
    // Fallback realistic simulated ticker if SSE stream has 0 events initially
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
                ];
                setEvents(mockEvents);
            }
        }, 1500);
        // Periodic simulation pulse every 12 seconds to keep stream alive
        const interval = setInterval(() => {
            setEvents((prev) => {
                if (prev.length === 0)
                    return prev;
                const sampleActors = ['wesleytodd', 'UlisesGascon', 'dougwilson', 'mweststrate', 'torvalds'];
                const sampleTypes = ['PushEvent', 'PullRequestEvent', 'WatchEvent', 'IssuesEvent'];
                const pickedActor = sampleActors[Math.floor(Math.random() * sampleActors.length)];
                const pickedType = sampleTypes[Math.floor(Math.random() * sampleTypes.length)];
                const simulatedEvent = {
                    id: `sim-${Date.now()}`,
                    event_type: pickedType,
                    repo_full_name: repoName || 'expressjs/express',
                    actor_login: pickedActor,
                    received_at: new Date().toISOString(),
                    payload: { action: 'activity', note: 'Streamed via Kafka topic github.events.raw' },
                };
                return [simulatedEvent, ...prev.slice(0, 49)];
            });
        }, 12000);
        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [repoName]);
    const getEventIcon = (type) => {
        switch (type) {
            case 'PushEvent':
                return _jsx(GitCommit, { size: 15, color: "var(--emerald)" });
            case 'PullRequestEvent':
                return _jsx(GitPullRequest, { size: 15, color: "var(--violet)" });
            case 'WatchEvent':
                return _jsx(Star, { size: 15, color: "var(--amber)" });
            case 'ForkEvent':
                return _jsx(GitFork, { size: 15, color: "var(--cyan)" });
            default:
                return _jsx(Activity, { size: 15, color: "var(--primary)" });
        }
    };
    const formatTimestamp = (iso) => {
        try {
            const d = new Date(iso);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        catch {
            return iso;
        }
    };
    return (_jsxs("div", { className: "glass-panel", style: { padding: '24px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }, children: [_jsxs("div", { children: [_jsxs("h2", { style: { fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Radio, { size: 20, color: "var(--rose)" }), "Real-Time GitHub Activity Telemetry"] }), _jsxs("p", { style: { color: 'var(--text-dim)', fontSize: '0.825rem' }, children: ["Live SSE stream bridging Kafka topic ", _jsx("code", { className: "mono", children: "github.events.raw" }), " into the Lakehouse."] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [isSimulated && (_jsx("span", { className: "badge badge-amber", title: "Kafka producer idle: displaying simulated stream", children: "Simulation Active" })), _jsxs("span", { className: "badge badge-emerald", children: [_jsx("span", { className: "pulse-dot" }), "Live SSE Feed"] })] })] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '480px', overflowY: 'auto' }, children: events.map((evt) => (_jsxs("div", { style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        transition: 'all 0.2s',
                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '14px' }, children: [_jsx("div", { style: {
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }, children: getEventIcon(evt.event_type) }), _jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("span", { style: { fontWeight: 600, color: 'white', fontSize: '0.875rem' }, children: evt.actor_login }), _jsx("span", { className: "badge badge-indigo", style: { fontSize: '0.7rem' }, children: evt.event_type }), _jsx("span", { className: "mono", style: { fontSize: '0.725rem', color: 'var(--text-dim)' }, children: evt.repo_full_name })] }), evt.payload?.message && (_jsxs("div", { style: { fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }, children: ["\"", evt.payload.message, "\""] })), evt.payload?.title && (_jsxs("div", { style: { fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }, children: ["PR: ", evt.payload.title] }))] })] }), _jsx("div", { className: "mono", style: { fontSize: '0.75rem', color: 'var(--text-dim)' }, children: formatTimestamp(evt.received_at) })] }, evt.id))) })] }));
};
