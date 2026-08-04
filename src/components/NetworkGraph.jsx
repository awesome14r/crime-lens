import React, { useMemo, useState, useCallback, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow'
import { User, Flame, FileText, MapPin, Waypoints } from 'lucide-react'
import { useCase } from '../context/CaseContext'
import { THREAT_COLORS } from '../data/mockData'
import { KIND_META } from '../utils/graphLayout'
import { themeClasses } from '../theme'

const KIND_ICON = { suspect: User, incident: Flame, location: MapPin, evidence: FileText }

function CustomNode({ data }) {
  const meta = KIND_META[data.kind]
  const Icon = KIND_ICON[data.kind]
  const color = data.kind === 'suspect' ? THREAT_COLORS[data.threatLevel] : meta.color

  return (
    <div
      className="rounded-lg border px-3 py-2 backdrop-blur transition-all"
      style={{
        background: data.dimmed ? 'rgba(19,27,41,0.35)' : 'rgba(19,27,41,0.92)',
        borderColor: data.selected || data.hovered || data.onPath ? color : `${color}55`,
        boxShadow:
          data.selected || data.hovered || data.onPath ? `0 0 0 1px ${color}, 0 0 18px ${color}77` : 'none',
        opacity: data.dimmed ? 0.25 : 1,
        minWidth: 140
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      <div className="flex items-center gap-1.5">
        <div className="h-5 w-5 rounded flex items-center justify-center shrink-0" style={{ background: `${color}22` }}>
          <Icon className="h-3 w-3" style={{ color }} />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-wide" style={{ color }}>
          {meta.label}
        </div>
      </div>
      <div className="text-xs font-medium text-slate-100 mt-1 leading-tight">{data.label}</div>
      {data.sublabel && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{data.sublabel}</div>}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  )
}

const nodeTypes = { entity: CustomNode }

export default function NetworkGraph({ nodes: modelNodes, edges: modelEdges, pathNodeIds, pathEdgeIds }) {
  const { activeCase, selectedEntity, selectEntity, searchMatches, theme } = useCase()
  const t = themeClasses(theme)
  const [hoveredId, setHoveredId] = useState(null)

  const initialNodes = useMemo(
    () =>
      modelNodes.map((n) => ({
        id: n.id,
        type: 'entity',
        position: { x: n.x, y: n.y },
        data: { ...n }
      })),
    [modelNodes]
  )

  const initialEdges = useMemo(
    () =>
      modelEdges.map((l) => ({
        id: l.id,
        source: l.source,
        target: l.target,
        label: l.label,
        labelStyle: { fill: '#94a3b8', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' },
        labelBgStyle: { fill: '#0e1420', fillOpacity: 0.85 },
        style: { stroke: '#334257', strokeWidth: 1.4 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#334257', width: 14, height: 14 }
      })),
    [modelEdges]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  const pathActive = Boolean(pathNodeIds && pathNodeIds.size > 0)

  // 1st-degree neighbor set for whichever node is hovered or selected
  const focusId = hoveredId || (selectedEntity ? selectedEntity.id : null)
  const neighborIds = useMemo(() => {
    if (!focusId) return null
    const set = new Set([focusId])
    activeCase.relationships.forEach((r) => {
      if (r.source === focusId) set.add(r.target)
      if (r.target === focusId) set.add(r.source)
    })
    return set
  }, [focusId, activeCase])

  const displayNodes = useMemo(
    () =>
      nodes.map((n) => {
        const searchDimmed = searchMatches ? !searchMatches.has(n.id) : false
        const focusDimmed = !pathActive && neighborIds ? !neighborIds.has(n.id) : false
        const pathDimmed = pathActive ? !pathNodeIds.has(n.id) : false
        return {
          ...n,
          data: {
            ...n.data,
            selected: selectedEntity?.id === n.id,
            hovered: hoveredId === n.id,
            onPath: pathActive && pathNodeIds.has(n.id),
            dimmed: searchDimmed || focusDimmed || pathDimmed
          }
        }
      }),
    [nodes, selectedEntity, hoveredId, neighborIds, searchMatches, pathActive, pathNodeIds]
  )

  const displayEdges = useMemo(
    () =>
      edges.map((e) => {
        const onPath = pathActive && pathEdgeIds.has(e.id)
        const active = !pathActive && focusId && (e.source === focusId || e.target === focusId)
        const highlighted = onPath || active
        const dimmed = pathActive ? !onPath : focusId ? !active : false
        return {
          ...e,
          animated: highlighted,
          style: {
            ...e.style,
            stroke: onPath ? '#ff5470' : active ? '#3fd0ff' : '#334257',
            strokeWidth: highlighted ? 2.6 : 1.4,
            opacity: dimmed ? 0.15 : 1
          },
          labelStyle: { ...e.labelStyle, opacity: dimmed ? 0.15 : 1 },
          markerEnd: { ...e.markerEnd, color: onPath ? '#ff5470' : active ? '#3fd0ff' : '#334257' }
        }
      }),
    [edges, focusId, pathActive, pathEdgeIds]
  )

  const onNodeClick = useCallback(
    (_, node) => {
      const kind = node.data.kind
      const ctxType = kind === 'incident' || kind === 'location' ? 'location' : kind
      selectEntity(ctxType, node.id)
    },
    [selectEntity]
  )

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={(_, n) => setHoveredId(n.id)}
        onNodeMouseLeave={() => setHoveredId(null)}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#243247" gap={22} size={1} />
        <Controls className="!bg-void-900 !border-void-600 [&>button]:!bg-void-900 [&>button]:!border-void-600 [&>button]:!text-signal-cyan [&>button:hover]:!bg-void-700" />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(11,15,25,0.75)"
          nodeColor={(n) => {
            const kind = n.data?.kind
            return kind === 'suspect' ? THREAT_COLORS[n.data.threatLevel] : KIND_META[kind]?.color || '#334257'
          }}
          style={{ background: '#0e1420', border: '1px solid #243247' }}
        />
      </ReactFlow>

      <div className={`absolute top-3 left-3 z-10 rounded border ${t.border} ${t.panelSolid} px-3 py-2 shadow-lg`}>
        <div className={`text-[10px] font-mono uppercase tracking-wider ${t.textFaint} mb-1.5 flex items-center gap-1.5`}>
          <Waypoints className="h-3 w-3" /> Node Types
        </div>
        <div className="flex flex-col gap-1 text-xs">
          {Object.entries(KIND_META).map(([key, meta]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
              <span className={t.textMuted}>{meta.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
