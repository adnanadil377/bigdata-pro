import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Filter, Network } from 'lucide-react'
import type { CollaborationGraphData, GraphNode } from '../types'

interface CollaborationGraphProps {
  data: CollaborationGraphData
  isLoading: boolean
  minWeight: number
  onChangeMinWeight: (weight: number) => void
}

export const CollaborationGraph: React.FC<CollaborationGraphProps> = ({
  data,
  isLoading,
  minWeight,
  onChangeMinWeight,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hoveredNode, setHoveredNode] = useState<{ id: string; degree: number; x: number; y: number } | null>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data || data.nodes.length === 0) return

    const width = containerRef.current.clientWidth || 800
    const height = 540

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Calculate node degree from edges
    const degreeMap = new Map<string, number>()
    data.edges.forEach((edge) => {
      const src = typeof edge.source === 'string' ? edge.source : edge.source.id
      const tgt = typeof edge.target === 'string' ? edge.target : edge.target.id
      degreeMap.set(src, (degreeMap.get(src) || 0) + 1)
      degreeMap.set(tgt, (degreeMap.get(tgt) || 0) + 1)
    })

    // Clone data for D3 mutation
    const nodes: GraphNode[] = data.nodes.map((n) => ({
      id: n.id,
      degree: degreeMap.get(n.id) || 1,
    }))

    const edges: any[] = data.edges.map((e) => ({
      source: typeof e.source === 'string' ? e.source : e.source.id,
      target: typeof e.target === 'string' ? e.target : e.target.id,
      weight: e.weight,
    }))

    // Zoom container
    const g = svg.append('g')

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Defs for gradients & glows
    const defs = svg.append('defs')
    const filter = defs.append('filter').attr('id', 'glow')
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Simulation
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        d3
          .forceLink(edges)
          .id((d: any) => d.id)
          .distance((d: any) => Math.max(40, 160 - Math.min(100, d.weight * 10)))
      )
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => Math.sqrt(d.degree || 1) * 4 + 10))

    // Edges
    const link = g
      .append('g')
      .attr('stroke', 'rgba(99, 102, 241, 0.25)')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke-width', (d: any) => Math.min(6, Math.max(1, Math.sqrt(d.weight || 1))))
      .attr('stroke-opacity', 0.6)

    // Nodes
    const node = g
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d: any) => Math.min(22, Math.max(5, Math.sqrt(d.degree || 1) * 3 + 4)))
      .attr('fill', (d: any) => {
        const deg = d.degree || 1
        if (deg > 15) return '#ec4899' // Core maintainer
        if (deg > 6) return '#6366f1'  // Active regular
        if (deg > 2) return '#06b6d4'  // Casual
        return '#64748b'              // Occasional
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.8)
      .attr('cursor', 'pointer')
      .call(
        d3
          .drag<any, GraphNode>()
          .on('start', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d: any) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )
      .on('mouseenter', (event, d: any) => {
        const [x, y] = d3.pointer(event, containerRef.current)
        setHoveredNode({ id: d.id, degree: d.degree || 1, x, y })
        if (event.currentTarget) {
          d3.select(event.currentTarget as SVGCircleElement).attr('stroke', '#06b6d4').attr('stroke-width', 3)
        }
      })
      .on('mouseleave', (event) => {
        setHoveredNode(null)
        if (event.currentTarget) {
          d3.select(event.currentTarget as SVGCircleElement).attr('stroke', '#ffffff').attr('stroke-width', 1.5)
        }
      })

    // Labels for top maintainers
    const label = g
      .append('g')
      .selectAll('text')
      .data(nodes.filter((n) => (n.degree || 0) >= 6))
      .join('text')
      .text((d: any) => d.id)
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-sans)')
      .attr('fill', 'var(--text-muted)')
      .attr('dx', 10)
      .attr('dy', 4)
      .attr('pointer-events', 'none')

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y)

      label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y)
    })

    return () => {
      simulation.stop()
    }
  }, [data])

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network size={20} color="var(--primary)" />
            Developer Collaboration Network
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.825rem' }}>
            Force-directed graph of shared module co-authorship. Nodes sized by collaboration degree.
          </p>
        </div>

        {/* Graph Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Min Weight Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Filter size={14} />
            <span>Min Shared Edits:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={minWeight}
              onChange={(e) => onChangeMinWeight(Number(e.target.value))}
              style={{ width: '80px', accentColor: 'var(--primary)' }}
            />
            <span className="mono badge badge-indigo">{minWeight}</span>
          </div>

          {/* Node Count Stat */}
          <span className="badge badge-cyan">
            {data.nodes.length} Developers • {data.edges.length} Edges
          </span>
        </div>
      </div>

      {/* Graph Canvas Container */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '540px',
          background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.4) 0%, rgba(10, 15, 29, 0.8) 100%)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(10, 15, 29, 0.7)',
              zIndex: 10,
              color: 'var(--primary-light)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Network size={32} style={{ animation: 'spin 1.5s linear infinite' }} />
              <span style={{ fontSize: '0.875rem' }}>Rendering collaboration topology…</span>
            </div>
          </div>
        )}

        <svg ref={svgRef} width="100%" height="100%" />

        {/* Hover Tooltip */}
        {hoveredNode && (
          <div
            style={{
              position: 'absolute',
              left: `${hoveredNode.x + 12}px`,
              top: `${hoveredNode.y - 12}px`,
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              fontSize: '0.8rem',
              pointerEvents: 'none',
              zIndex: 20,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'white' }}>{hoveredNode.id}</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.725rem' }}>
              Shared module co-edits with {hoveredNode.degree} developer(s)
            </div>
          </div>
        )}

        {/* Graph Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899' }} />
            <span style={{ color: 'var(--text-muted)' }}>Core Maintainer</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} />
            <span style={{ color: 'var(--text-muted)' }}>Regular</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }} />
            <span style={{ color: 'var(--text-muted)' }}>Casual</span>
          </div>
        </div>
      </div>
    </div>
  )
}
