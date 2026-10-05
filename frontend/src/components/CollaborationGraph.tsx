import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Filter, Layers, Search } from 'lucide-react'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [hoveredNode, setHoveredNode] = useState<{ id: string; degree: number; x: number; y: number } | null>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data || data.nodes.length === 0) return

    const width = containerRef.current.clientWidth || 800
    const height = 520

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
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Simulation
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        d3
          .forceLink(edges)
          .id((d: any) => d.id)
          .distance((d: any) => Math.max(35, 140 - Math.min(80, d.weight * 8)))
      )
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => Math.sqrt(d.degree || 1) * 3 + 8))

    // Edges (hairline subtle links)
    const link = g
      .append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', '#27272a')
      .attr('stroke-width', (d: any) => Math.min(3, Math.max(1, Math.sqrt(d.weight || 1))))
      .attr('stroke-opacity', 0.8)

    // Nodes
    const node = g
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d: any) => Math.min(18, Math.max(5, Math.sqrt(d.degree || 1) * 2.5 + 4)))
      .attr('fill', (d: any) => {
        const deg = d.degree || 1
        if (deg > 15) return '#f4f4f5' // Core Maintainer (bright crisp white)
        if (deg > 6) return '#a1a1aa'  // Active regular (zinc-400)
        return '#3f3f46'              // Casual (zinc-700)
      })
      .attr('stroke', '#18181b')
      .attr('stroke-width', 2)
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
          d3.select(event.currentTarget as SVGCircleElement)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 3)
        }
      })
      .on('mouseleave', (event) => {
        setHoveredNode(null)
        if (event.currentTarget) {
          d3.select(event.currentTarget as SVGCircleElement)
            .attr('stroke', '#18181b')
            .attr('stroke-width', 2)
        }
      })

    // Labels for top core maintainers
    const label = g
      .append('g')
      .selectAll('text')
      .data(nodes.filter((n) => (n.degree || 0) >= 8))
      .join('text')
      .text((d: any) => d.id)
      .attr('font-size', '11px')
      .attr('font-family', 'var(--font-sans)')
      .attr('font-weight', '500')
      .attr('fill', '#d4d4d8')
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
    <div className="panel" style={{ padding: '20px 24px' }}>
      {/* Top Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Developer Collaboration Network
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Co-authorship topology extracted from multi-author file commits.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Threshold Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            <Filter size={13} />
            <span>Shared edit threshold:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={minWeight}
              onChange={(e) => onChangeMinWeight(Number(e.target.value))}
              style={{ width: '70px', accentColor: '#f4f4f5' }}
            />
            <span className="mono badge badge-neutral">{minWeight}</span>
          </div>

          <span className="badge badge-neutral">
            {data.nodes.length} nodes • {data.edges.length} edges
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '520px',
          background: '#0d0d0f',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
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
              background: 'rgba(9, 9, 11, 0.7)',
              zIndex: 10,
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
            }}
          >
            Calculating topology…
          </div>
        )}

        <svg ref={svgRef} width="100%" height="100%" />

        {/* Hover Tooltip */}
        {hoveredNode && (
          <div
            style={{
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
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{hoveredNode.id}</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
              Connected to {hoveredNode.degree} collaborator(s)
            </div>
          </div>
        )}

        {/* Minimal Legend */}
        <div
          style={{
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
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f4f4f5' }} />
            <span>Core Maintainer</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a1a1aa' }} />
            <span>Regular</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3f3f46' }} />
            <span>Casual</span>
          </div>
        </div>
      </div>
    </div>
  )
}
