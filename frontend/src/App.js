import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { AlertCircle, BarChart3, BrainCircuit, Database, ExternalLink, GitBranch, LayoutDashboard, Network, Radio, } from 'lucide-react';
import { BusFactorRiskTable } from './components/BusFactorRiskTable';
import { CollaborationGraph } from './components/CollaborationGraph';
import { CommitAnalyticsView } from './components/CommitAnalyticsView';
import { ContributorRetentionView } from './components/ContributorRetentionView';
import { GithubIcon } from './components/GithubIcon';
import { HealthScorePanel } from './components/HealthScorePanel';
import { IngestionModal } from './components/IngestionModal';
import { LiveEventStream } from './components/LiveEventStream';
import { Navbar } from './components/Navbar';
import { OverviewCards } from './components/OverviewCards';
import { fetchCollaborationGraph, fetchCommitTypes, fetchContributorStats, fetchHealth, fetchRepoOverview, fetchRepositories, triggerResync, } from './services/api';
export const App = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [repositories, setRepositories] = useState([]);
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [overview, setOverview] = useState(null);
    const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
    const [commitTypes, setCommitTypes] = useState([]);
    const [contributorStats, setContributorStats] = useState([]);
    const [minGraphWeight, setMinGraphWeight] = useState(2);
    const [isLoading, setIsLoading] = useState(true);
    const [isGraphLoading, setIsGraphLoading] = useState(false);
    const [isResyncing, setIsResyncing] = useState(false);
    const [backendStatus, setBackendStatus] = useState(true);
    const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    // 1. Initial health & repositories load
    useEffect(() => {
        const init = async () => {
            try {
                await fetchHealth();
                setBackendStatus(true);
            }
            catch {
                setBackendStatus(false);
            }
            try {
                const repos = await fetchRepositories();
                setRepositories(repos);
                if (repos.length > 0) {
                    setSelectedRepo(repos[0]);
                }
            }
            catch (err) {
                setErrorMessage(err.message || 'Failed to connect to serving database');
            }
            finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);
    // 2. Load repository data whenever selectedRepo changes
    useEffect(() => {
        if (!selectedRepo)
            return;
        const loadRepoData = async () => {
            setIsLoading(true);
            setErrorMessage(null);
            try {
                const [ov, ct, cs] = await Promise.all([
                    fetchRepoOverview(selectedRepo.owner, selectedRepo.name),
                    fetchCommitTypes(selectedRepo.owner, selectedRepo.name).catch(() => []),
                    fetchContributorStats(selectedRepo.owner, selectedRepo.name, 150).catch(() => []),
                ]);
                setOverview(ov);
                setCommitTypes(ct);
                setContributorStats(cs);
            }
            catch (err) {
                setErrorMessage(err.message || 'Error loading repository analytics');
            }
            finally {
                setIsLoading(false);
            }
        };
        loadRepoData();
    }, [selectedRepo]);
    // 3. Load collaboration graph when tab or minWeight changes
    useEffect(() => {
        if (!selectedRepo || (activeTab !== 'network' && activeTab !== 'overview'))
            return;
        const loadGraph = async () => {
            setIsGraphLoading(true);
            try {
                const data = await fetchCollaborationGraph(selectedRepo.owner, selectedRepo.name, minGraphWeight);
                setGraphData(data);
            }
            catch (err) {
                console.error('Failed to load graph data', err);
            }
            finally {
                setIsGraphLoading(false);
            }
        };
        loadGraph();
    }, [selectedRepo, minGraphWeight, activeTab]);
    // Handle re-sync
    const handleResync = async () => {
        if (!selectedRepo)
            return;
        setIsResyncing(true);
        try {
            await triggerResync(selectedRepo.owner, selectedRepo.name);
            setTimeout(async () => {
                const ov = await fetchRepoOverview(selectedRepo.owner, selectedRepo.name);
                setOverview(ov);
                setIsResyncing(false);
            }, 3000);
        }
        catch (err) {
            alert(err.message || 'Re-sync trigger failed');
            setIsResyncing(false);
        }
    };
    // Handle successful ingestion
    const handleIngestionSuccess = async (owner, name) => {
        try {
            const repos = await fetchRepositories();
            setRepositories(repos);
            const newlyAdded = repos.find((r) => r.owner === owner && r.name === name);
            if (newlyAdded) {
                setSelectedRepo(newlyAdded);
            }
            else if (repos.length > 0) {
                setSelectedRepo(repos[0]);
            }
        }
        catch (err) {
            console.error('Failed to reload repositories', err);
        }
    };
    return (_jsxs("div", { className: "app-container", children: [_jsx(Navbar, { repositories: repositories, selectedRepo: selectedRepo, onSelectRepo: (r) => setSelectedRepo(r), onOpenIngestModal: () => setIsIngestModalOpen(true), onResync: handleResync, isResyncing: isResyncing, backendStatus: backendStatus }), errorMessage && (_jsxs("div", { style: {
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#fda4af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx(AlertCircle, { size: 20 }), _jsx("span", { children: errorMessage })] }), _jsx("button", { className: "btn btn-secondary btn-sm", onClick: () => window.location.reload(), children: "Retry Connection" })] })), selectedRepo && (_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    padding: '0 4px',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '14px' }, children: [_jsx("div", { style: {
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--border-subtle)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }, children: _jsx(GithubIcon, { size: 24, color: "var(--primary-light)" }) }), _jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsxs("h1", { style: { fontSize: '1.5rem', fontWeight: 800 }, children: [selectedRepo.owner, " / ", _jsx("span", { style: { color: 'var(--primary-light)' }, children: selectedRepo.name })] }), _jsx("span", { className: "badge badge-indigo", children: selectedRepo.language || 'Codebase' })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }, children: [_jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx(GitBranch, { size: 13 }), " ", selectedRepo.default_branch] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: ["Lakehouse Sync:", ' ', selectedRepo.synced_at
                                                        ? new Date(selectedRepo.synced_at).toLocaleString()
                                                        : 'Realtime'] }), _jsx("span", { children: "\u2022" }), _jsxs("a", { href: `https://github.com/${selectedRepo.owner}/${selectedRepo.name}`, target: "_blank", rel: "noreferrer", style: { color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }, children: ["GitHub ", _jsx(ExternalLink, { size: 11 })] })] })] })] }), _jsxs("nav", { className: "tab-nav", "aria-label": "Dashboard Views", children: [_jsxs("button", { id: "tab-overview", className: `tab-btn ${activeTab === 'overview' ? 'active' : ''}`, onClick: () => setActiveTab('overview'), children: [_jsx(LayoutDashboard, { size: 16 }), _jsx("span", { children: "Overview" })] }), _jsxs("button", { id: "tab-network", className: `tab-btn ${activeTab === 'network' ? 'active' : ''}`, onClick: () => setActiveTab('network'), children: [_jsx(Network, { size: 16 }), _jsx("span", { children: "Collaboration Network" })] }), _jsxs("button", { id: "tab-commits", className: `tab-btn ${activeTab === 'commits' ? 'active' : ''}`, onClick: () => setActiveTab('commits'), children: [_jsx(BarChart3, { size: 16 }), _jsx("span", { children: "Commit Taxonomy" })] }), _jsxs("button", { id: "tab-retention", className: `tab-btn ${activeTab === 'retention' ? 'active' : ''}`, onClick: () => setActiveTab('retention'), children: [_jsx(BrainCircuit, { size: 16 }), _jsx("span", { children: "ML Personas" })] }), _jsxs("button", { id: "tab-stream", className: `tab-btn ${activeTab === 'stream' ? 'active' : ''}`, onClick: () => setActiveTab('stream'), children: [_jsx(Radio, { size: 16 }), _jsx("span", { children: "Live Telemetry" })] })] })] })), overview ? (_jsxs("main", { id: "main-content", style: { display: 'flex', flexDirection: 'column', gap: '28px' }, children: [activeTab === 'overview' && (_jsxs(_Fragment, { children: [_jsx(OverviewCards, { overview: overview }), _jsx(HealthScorePanel, { health: overview.health }), overview.critical_modules && overview.critical_modules.length > 0 && (_jsx(BusFactorRiskTable, { modules: overview.critical_modules }))] })), activeTab === 'network' && (_jsx(CollaborationGraph, { data: graphData, isLoading: isGraphLoading, minWeight: minGraphWeight, onChangeMinWeight: setMinGraphWeight })), activeTab === 'commits' && (_jsx(CommitAnalyticsView, { commitTypes: commitTypes, contributorStats: contributorStats })), activeTab === 'retention' && (_jsx(ContributorRetentionView, { contributors: contributorStats, totalCommits: overview.metrics.total_commits })), activeTab === 'stream' && (_jsx(LiveEventStream, { repoName: selectedRepo ? `${selectedRepo.owner}/${selectedRepo.name}` : undefined }))] })) : (_jsx("div", { className: "glass-panel", style: { padding: '60px 24px', textAlign: 'center' }, children: _jsxs("div", { style: { maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }, children: [_jsx("div", { style: {
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                background: 'rgba(99, 102, 241, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--primary-light)',
                            }, children: _jsx(Database, { size: 28 }) }), _jsx("h2", { style: { fontSize: '1.35rem' }, children: "No Tracked Repositories Selected" }), _jsx("p", { style: { color: 'var(--text-muted)', fontSize: '0.9rem' }, children: "The Lakehouse is initialized and ready. Submit your first repository to begin blobless historical ingestion and analytics computation." }), _jsx("button", { className: "btn btn-primary", onClick: () => setIsIngestModalOpen(true), style: { marginTop: '8px' }, children: "Ingest a Repository" })] }) })), _jsx(IngestionModal, { isOpen: isIngestModalOpen, onClose: () => setIsIngestModalOpen(false), onIngestionSuccess: handleIngestionSuccess })] }));
};
export default App;
