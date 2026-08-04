import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { User, Flame, FileText, MapPin, ZoomIn, ZoomOut, Maximize2, Pin } from 'lucide-react'
import { useCase } from '../context/CaseContext'
import { THREAT_COLORS } from '../data/mockData'
import { KIND_META } from '../utils/graphLayout'
import { themeClasses } from '../theme'

const KIND_ICON = { suspect: User, incident: Flame, location: MapPin, evidence: FileText }
const PADDING = 160
const CARD_W = 132

export default function CorkboardView({ nodes: modelNodes, edges: modelEdges, pathNodeIds, pathEdgeIds }) {
  const { selectedEntity, selectEntity, searchMatches, activeCase, theme } = useCase()
  const t = themeClasses(theme)
  const containerRef = useRef(null)
  const [view, setView] = useState({ x: 0, y: 0, scale: 0.85 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, viewX: 0, viewY: 0 })
  const [hoveredId, setHoveredId] = useState(null)

  // Normalize node coordinates into positive canvas space
  const { placedNodes, canvasW, canvasH } = useMemo(() => {
    if (!modelNodes.length) return { placedNodes: [], canvasW: 800, canvasH: 600 }
    const xs = modelNodes.map((n) => n.x)
    const ys = modelNodes.map((n) => n.y)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)
    const placed = modelNodes.map((n) => ({
      ...n,
      cx: n.x - minX + PADDING,
      cy: n.y - minY + PADDING
    }))
    return {
      placedNodes: placed,
      canvasW: maxX - minX + PADDING * 2,
      canvasH: maxY - minY + PADDING * 2
    }
  }, [modelNodes])

  const nodeById = useMemo(() => {
    const m = new Map()
    placedNodes.forEach((n) => m.set(n.id, n))
    return m
  }, [placedNodes])

  const pathActive = Boolean(pathNodeIds && pathNodeIds.size > 0)
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

  // Native (non-passive) wheel listener so we can actually preventDefault for zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      setView((v) => {
        const delta = -e.deltaY * 0.0012
        const nextScale = Math.min(2, Math.max(0.35, v.scale + delta * v.scale))
        return { ...v, scale: nextScale }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const onMouseDown = useCallback(
    (e) => {
      setDragging(true)
      dragStart.current = { x: e.clientX, y: e.clientY, viewX: view.x, viewY: view.y }
    },
    [view]
  )
  const onMouseMove = useCallback((e) => {
    if (!dragging) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setView((v) => ({ ...v, x: dragStart.current.viewX + dx, y: dragStart.current.viewY + dy }))
  }, [dragging])
  const onMouseUp = useCallback(() => setDragging(false), [])

  const resetView = () => setView({ x: 0, y: 0, scale: 0.85 })
  const zoomBy = (factor) => setView((v) => ({ ...v, scale: Math.min(2, Math.max(0.35, v.scale * factor)) }))

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.05), transparent 40%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.04), transparent 45%), #3b2a1e',
          backgroundImage:
            'radial-gradient(rgba(0,0,0,0.18) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.12) 1px, transparent 1px)',
          backgroundSize: '5px 5px, 9px 9px',
          backgroundPosition: '0 0, 3px 4px'
        }}
      >
        <div
          className="relative"
          style={{
            width: canvasW,
            height: canvasH,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transformOrigin: '0 0'
          }}
        >
          {/* Red string layer */}
          <svg className="absolute inset-0 pointer-events-none" width={canvasW} height={canvasH}>
            {modelEdges.map((edge) => {
              const a = nodeById.get(edge.source)
              const b = nodeById.get(edge.target)
              if (!a || !b) return null
              const onPath = pathActive && pathEdgeIds.has(edge.id)
              const active = !pathActive && focusId && (edge.source === focusId || edge.target === focusId)
              const dimmed = pathActive ? !onPath : focusId ? !active : false
              const midX = (a.cx + b.cx) / 2
              const sag = 18 + Math.abs(a.cx - b.cx) * 0.04
              const midY = (a.cy + b.cy) / 2 + sag
              const color = onPath ? '#ff5470' : active ? '#3fd0ff' : '#c0392b'
              return (
                <path
                  key={edge.id}
                  d={`M ${a.cx} ${a.cy} Q ${midX} ${midY} ${b.cx} ${b.cy}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={onPath || active ? 2.4 : 1.4}
                  opacity={dimmed ? 0.12 : 0.8}
                />
              )
            })}
          </svg>

          {/* Cards */}
          {placedNodes.map((n) => {
            const meta = KIND_META[n.kind]
            const Icon = KIND_ICON[n.kind]
            const color = n.kind === 'suspect' ? THREAT_COLORS[n.threatLevel] : meta.color
            const searchDimmed = searchMatches ? !searchMatches.has(n.id) : false
            const focusDimmed = !pathActive && neighborIds ? !neighborIds.has(n.id) : false
            const pathDimmed = pathActive ? !pathNodeIds.has(n.id) : false
            const dimmed = searchDimmed || focusDimmed || pathDimmed
            const onPath = pathActive && pathNodeIds.has(n.id)
            const ctxType = n.kind === 'incident' || n.kind === 'location' ? 'location' : n.kind

            return (
              <button
                key={n.id}
                onClick={() => selectEntity(ctxType, n.id)}
                onMouseEnter={() => setHoveredId(n.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="absolute text-left transition-all duration-150"
                style={{
                  left: n.cx - CARD_W / 2,
                  top: n.cy - 60,
                  width: CARD_W,
                  opacity: dimmed ? 0.25 : 1,
                  transform: selectedEntity?.id === n.id || hoveredId === n.id ? 'rotate(0deg) scale(1.05)' : `rotate(${(n.cx * 13) % 5 - 2.5}deg)`,
                  zIndex: hoveredId === n.id ? 20 : 10
                }}
              >
                <div
                  className="relative rounded-sm shadow-[0_6px_14px_rgba(0,0,0,0.45)] px-2 pt-2 pb-2.5"
                  style={{
                    background: n.kind === 'suspect' ? '#f4ede1' : '#eee5cf',
                    border: onPath ? `2px solid ${color}` : '1px solid rgba(0,0,0,0.15)'
                  }}
                >
                  {/* Thumbtack */}
                  <Pin
                    className="absolute -top-2 left-1/2 -translate-x-1/2 h-3.5 w-3.5 drop-shadow"
                    style={{ color, transform: 'rotate(45deg)' }}
                    fill={color}
                  />
                  <div
                    className="h-14 w-full rounded-[2px] flex items-center justify-center mb-1.5"
                    style={{ background: `${color}25`, border: `1px solid ${color}55` }}
                  >
                    <Icon className="h-6 w-6" style={{ color }} />
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wide" style={{ color }}>
                    {meta.label}
                  </div>
                  <div className="text-[11px] font-semibold text-stone-800 leading-tight mt-0.5 line-clamp-2">
                    {n.label}
                  </div>
                  {n.sublabel && <div className="text-[9px] text-stone-500 font-mono mt-0.5 truncate">{n.sublabel}</div>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Zoom controls */}
      <div className={`absolute bottom-3 right-3 z-10 flex flex-col gap-1 rounded border ${t.border} ${t.panelSolid} p-1 shadow-lg`}>
        <button onClick={() => zoomBy(1.2)} className={`h-7 w-7 flex items-center justify-center rounded ${t.hoverPanel}`}>
          <ZoomIn className="h-3.5 w-3.5 text-signal-cyan" />
        </button>
        <button onClick={() => zoomBy(0.8)} className={`h-7 w-7 flex items-center justify-center rounded ${t.hoverPanel}`}>
          <ZoomOut className="h-3.5 w-3.5 text-signal-cyan" />
        </button>
        <button onClick={resetView} className={`h-7 w-7 flex items-center justify-center rounded ${t.hoverPanel}`}>
          <Maximize2 className="h-3.5 w-3.5 text-signal-cyan" />
        </button>
      </div>

      <div className={`absolute top-3 left-3 z-10 rounded border ${t.border} ${t.panelSolid} px-3 py-1.5 text-[10px] font-mono ${t.textFaint} shadow-lg`}>
        Drag to pan · Scroll to zoom
      </div>
    </div>
  )
}
