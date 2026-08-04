import React, { useMemo, useState } from 'react'
import { Waypoints, Pin, Plus } from 'lucide-react'
import { FormModal, Input, Select } from './SuspectDirectory'
import { useCase } from '../context/CaseContext'
import { buildGraphModel } from '../utils/graphLayout'
import NetworkGraph from './NetworkGraph'
import CorkboardView from './CorkboardView'
import PathFinder from './PathFinder'
import { themeClasses } from '../theme'

export default function GraphViewTab() {
  const { activeCase, timeFilterEnabled, timeCursor, theme, addRelationship } = useCase()
  const t = themeClasses(theme)
  const [mode, setMode] = useState('force')
  const [pathOpen, setPathOpen] = useState(false)
  const [pathHighlight, setPathHighlight] = useState(null) // { nodeIdSet, edgeIdSet } | null
  const [adding, setAdding] = useState(false)
  const [connection, setConnection] = useState({ source: '', target: '', label: '' })
  const entityOptions = [...activeCase.suspects, ...activeCase.locations, ...activeCase.evidence].map((item) => ({ id: item.id, label: item.name || item.title }))
  const submitConnection = (e) => { e.preventDefault(); if (!connection.source || !connection.target || connection.source === connection.target || !connection.label.trim()) return; addRelationship(connection); setConnection({ source: '', target: '', label: '' }); setAdding(false) }

  const { nodes: allNodes, edges: allEdges } = useMemo(() => buildGraphModel(activeCase), [activeCase])

  const { nodes, edges } = useMemo(() => {
    if (!timeFilterEnabled) return { nodes: allNodes, edges: allEdges }
    const visibleIds = new Set(allNodes.filter((n) => n.revealTimestamp <= timeCursor).map((n) => n.id))
    return {
      nodes: allNodes.filter((n) => visibleIds.has(n.id)),
      edges: allEdges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
    }
  }, [allNodes, allEdges, timeFilterEnabled, timeCursor])

  const Viz = mode === 'force' ? NetworkGraph : CorkboardView

  return (
    <div className="relative h-full w-full">
      <Viz
        nodes={nodes}
        edges={edges}
        pathNodeIds={pathHighlight?.nodeIdSet}
        pathEdgeIds={pathHighlight?.edgeIdSet}
      />

      {/* Mode toggle */}
      <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex rounded-full border ${t.border} ${t.panelSolid} p-1 shadow-lg`}>
        <button
          onClick={() => setMode('force')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            mode === 'force' ? 'bg-signal-cyan/15 text-signal-cyan' : `${t.textMuted} ${t.hoverPanel}`
          }`}
        >
          <Waypoints className="h-3.5 w-3.5" />
          Force Graph
        </button>
        <button
          onClick={() => setMode('corkboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            mode === 'corkboard' ? 'bg-signal-crimson/15 text-signal-crimson' : `${t.textMuted} ${t.hoverPanel}`
          }`}
        >
          <Pin className="h-3.5 w-3.5" />
          Corkboard
        </button>
      </div>

      <PathFinder
        nodes={nodes}
        edges={edges}
        open={pathOpen}
        onToggle={() => setPathOpen((o) => !o)}
        onResult={setPathHighlight}
      />
      <button onClick={() => setAdding(true)} className="absolute top-14 right-3 z-10 flex items-center gap-1 rounded border border-signal-cyan/40 bg-void-900/90 px-3 py-2 text-xs text-signal-cyan shadow-lg"><Plus className="h-3.5 w-3.5" /> Add Connection</button>
      {adding && <FormModal title="Add Graph Connection" t={t} onClose={() => setAdding(false)} onSubmit={submitConnection}><Select label="From" value={connection.source} values={['', ...entityOptions.map(x => x.id)]} onChange={(v) => setConnection({...connection,source:v})} t={t}/><Select label="To" value={connection.target} values={['', ...entityOptions.map(x => x.id)]} onChange={(v) => setConnection({...connection,target:v})} t={t}/><Input label="Relationship label" value={connection.label} onChange={(v) => setConnection({...connection,label:v})} required t={t}/><div className={`text-[10px] ${t.textFaint}`}>Entities: {entityOptions.map(x => `${x.id} ${x.label}`).join(' · ')}</div></FormModal>}

      {timeFilterEnabled && nodes.length < allNodes.length && (
        <div
          className={`absolute top-3 left-1/2 -translate-x-1/2 z-10 rounded-full border border-signal-amber/40 bg-signal-amber/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-signal-amber shadow-lg`}
        >
          {nodes.length} / {allNodes.length} entities revealed as of current replay point
        </div>
      )}
    </div>
  )
}
