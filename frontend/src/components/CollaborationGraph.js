import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Filter } from 'lucide-react';
export const CollaborationGraph = ({ data, isLoading, minWeight, onChangeMinWeight, }) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredNode, setHoveredNode] = useState(null);
    useEffect(() => {
        if (!svgRef.current || !containerRef.current || !data || data.nodes.length === 0)
            return;
        const width = containerRef.current.clientWidth || 800;
        const height = 520;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
        // Calculate node degree from edges
        const degreeMap = new Map();
        data.edges.forEach((edge) => {
            const src = typeof edge.source === 'string' ? edge.source : edge.source.id;
            const tgt = typeof edge.target === 'string' ? edge.target : edge.target.id;
            degreeMap.set(src, (degreeMap.get(src) || 0) + 1);
            degreeMap.set(tgt, (degreeMap.get(tgt) || 0) + 1);
        });
        // Clone data for D3 mutation
        const nodes = data.nodes.map((n) => ({
            id: n.id,
            degree: degreeMap.get(n.id) || 1,
        }));
        const edges = data.edges.map((e) => ({
            source: typeof e.source === 'string' ? e.source : e.source.id,
            target: typeof e.target === 'string' ? e.target : e.target.id,
            weight: e.weight,
        }));
        // Zoom container
        const g = svg.append('g');
        const zoom = d3
            .zoom()
            .scaleExtent([0.3, 3])
            .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
        svg.call(zoom);
        // Simulation
        const simulation = d3
            .forceSimulation(nodes)
            .force('link', d3
            .forceLink(edges)
            .id((d) => d.id)
            .distance((d) => Math.max(35, 140 - Math.min(80, d.weight * 8))))
            .force('charge', d3.forceManyBody().strength(-100))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius((d) => Math.sqrt(d.degree || 1) * 3 + 8));
        // Edges (hairline subtle links)
        const link = g
            .append('g')
            .selectAll('line')
            .data(edges)
            .join('line')
            .attr('stroke', '#27272a')
            .attr('stroke-width', (d) => Math.min(3, Math.max(1, Math.sqrt(d.weight || 1))))
            .attr('stroke-opacity', 0.8);
        // Nodes
        const node = g
            .append('g')
            .selectAll('circle')
            .data(nodes)
            .join('circle')
            .attr('r', (d) => Math.min(18, Math.max(5, Math.sqrt(d.degree || 1) * 2.5 + 4)))
            .attr('fill', (d) => {
            const deg = d.degree || 1;
            if (deg > 15)
                return '#f4f4f5'; // Core Maintainer (bright crisp white)
            if (deg > 6)
                return '#a1a1aa'; // Active regular (zinc-400)
            return '#3f3f46'; // Casual (zinc-700)
        })
            .attr('stroke', '#18181b')
            .attr('stroke-width', 2)
            .attr('cursor', 'pointer')
            .call(d3
            .drag()
            .on('start', (event, d) => {
            if (!event.active)
                simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        })
            .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
        })
            .on('end', (event, d) => {
            if (!event.active)
                simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }))
            .on('mouseenter', (event, d) => {
            const [x, y] = d3.pointer(event, containerRef.current);
            setHoveredNode({ id: d.id, degree: d.degree || 1, x, y });
            if (event.currentTarget) {
                d3.select(event.currentTarget)
                    .attr('stroke', '#ffffff')
                    .attr('stroke-width', 3);
            }
        })
            .on('mouseleave', (event) => {
            setHoveredNode(null);
            if (event.currentTarget) {
                d3.select(event.currentTarget)
                    .attr('stroke', '#18181b')
                    .attr('stroke-width', 2);
            }
        });
        // Labels for top core maintainers
        const label = g
            .append('g')
            .selectAll('text')
            .data(nodes.filter((n) => (n.degree || 0) >= 8))
            .join('text')
            .text((d) => d.id)
            .attr('font-size', '11px')
            .attr('font-family', 'var(--font-sans)')
            .attr('font-weight', '500')
            .attr('fill', '#d4d4d8')
            .attr('dx', 10)
            .attr('dy', 4)
            .attr('pointer-events', 'none');
        simulation.on('tick', () => {
            link
                .attr('x1', (d) => d.source.x)
                .attr('y1', (d) => d.source.y)
                .attr('x2', (d) => d.target.x)
                .attr('y2', (d) => d.target.y);
            node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
            label.attr('x', (d) => d.x).attr('y', (d) => d.y);
        });
        return () => {
            simulation.stop();
        };
    }, [data]);
    return (_jsxs("div", { className: "panel", style: { padding: '20px 24px' }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '16px',
                }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }, children: "Developer Collaboration Network" }), _jsx("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)' }, children: "Co-authorship topology extracted from multi-author file commits." })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '14px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.775rem', color: 'var(--text-muted)' }, children: [_jsx(Filter, { size: 13 }), _jsx("span", { children: "Shared edit threshold:" }), _jsx("input", { type: "range", min: "1", max: "10", value: minWeight, onChange: (e) => onChangeMinWeight(Number(e.target.value)), style: { width: '70px', accentColor: '#f4f4f5' } }), _jsx("span", { className: "mono badge badge-neutral", children: minWeight })] }), _jsxs("span", { className: "badge badge-neutral", children: [data.nodes.length, " nodes \u2022 ", data.edges.length, " edges"] })] })] }), _jsxs("div", { ref: containerRef, style: {
                    position: 'relative',
                    width: '100%',
                    height: '520px',
                    background: '#0d0d0f',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    overflow: 'hidden',
                }, children: [isLoading && (_jsx("div", { style: {
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(9, 9, 11, 0.7)',
                            zIndex: 10,
                            color: 'var(--text-muted)',
                            fontSize: '0.85rem',
                        }, children: "Calculating topology\u2026" })), _jsx("svg", { ref: svgRef, width: "100%", height: "100%" }), hoveredNode && (_jsxs("div", { style: {
                            position: 'absolute',
                            left: `${hoveredNode.x + 10}px`,
                            top: `${hoveredNode.y - 10}px`,
                            background: '#18181b',
                            border: '1px solid var(--border-primary)',
                            borderRadius: 'var(--radius-xs)',
                            padding: '6px 10px',
                            fontSize: '0.775rem',
                            pointerEvents: 'none',
                            zIndex: 20,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        }, children: [_jsx("div", { style: { fontWeight: 600, color: 'var(--text-primary)' }, children: hoveredNode.id }), _jsxs("div", { style: { color: 'var(--text-dim)', fontSize: '0.7rem' }, children: ["Connected to ", hoveredNode.degree, " collaborator(s)"] })] })), _jsxs("div", { style: {
                            position: 'absolute',
                            bottom: '10px',
                            left: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '0.725rem',
                            color: 'var(--text-muted)',
                            background: 'rgba(13, 13, 15, 0.9)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-xs)',
                            border: '1px solid var(--border-subtle)',
                        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '5px' }, children: [_jsx("span", { style: { width: '8px', height: '8px', borderRadius: '50%', background: '#f4f4f5' } }), _jsx("span", { children: "Core Maintainer" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '5px' }, children: [_jsx("span", { style: { width: '8px', height: '8px', borderRadius: '50%', background: '#a1a1aa' } }), _jsx("span", { children: "Regular" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '5px' }, children: [_jsx("span", { style: { width: '8px', height: '8px', borderRadius: '50%', background: '#3f3f46' } }), _jsx("span", { children: "Casual" })] })] })] })] }));
};
