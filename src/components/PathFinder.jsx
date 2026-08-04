import React, { useMemo, useState } from 'react'
import { Route, X, ArrowRight, SearchX } from 'lucide-react'
import { useCase } from '../context/CaseContext'
import { findShortestPath } from '../utils/graphLayout'
import { themeClasses } from '../theme'

export default function PathFinder({ nodes, edges, onResult, open, onToggle }) {
  const { activeCase, theme } = useCase()
  const t = themeClasses(theme)
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [result, setResult] = useState(null) // { path, edgeLabels } | 'none' | null

  const nodeById = useMemo(() => {
    const m = new Map()
    nodes.forEach((n) => m.set(n.id, n))
    return m
  }, [nodes])

  const suspects = activeCase.suspects

  const handleFind = () => {
    if (!fromId || !toId || fromId === toId) return
    const found = findShortestPath(nodes, edges, fromId, toId)
    if (!found) {
      setResult('none')
      onResult(null)
      return
    }
    setResult(found)
    const nodeIdSet = new Set(found.path)
    const edgeIdSet = new Set()
    for (let i = 0; i < found.path.length - 1; i++) {
      const a = found.path[i]
      const b = found.path[i + 1]
      const edge = edges.find((e) => (e.source === a && e.target === b) || (e.source === b && e.target === a))
      if (edge) edgeIdSet.add(edge.id)
    }
    onResult({ nodeIdSet, edgeIdSet })
  }

  const handleClear = () => {
    setFromId('')
    setToId('')
    setResult(null)
    onResult(null)
  }

  if (!open) {
    return (
      <button
        onClick={onToggle}
        className={`absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded border ${t.border} ${t.panelSolid} px-3 py-2 text-xs font-medium ${t.textMuted} ${t.hoverPanel} shadow-lg transition-colors`}
      >
        <Route className="h-3.5 w-3.5 text-signal-cyan" />
        Connection Finder
      </button>
    )
  }

  return (
    <div className={`absolute top-3 right-3 z-10 w-72 rounded border ${t.border} ${t.panelSolid} shadow-xl shadow-black/40`}>
      <div className={`flex items-center justify-between px-3 py-2.5 border-b ${t.border}`}>
        <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-signal-cyan">
          <Route className="h-3.5 w-3.5" />
          Connection Finder
        </div>
        <button onClick={onToggle} className={`${t.textMuted} hover:text-signal-crimson transition-colors`}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3 space-y-2.5">
        <SuspectSelect label="From" value={fromId} onChange={setFromId} suspects={suspects} exclude={toId} t={t} />
        <SuspectSelect label="To" value={toId} onChange={setToId} suspects={suspects} exclude={fromId} t={t} />

        <div className="flex gap-2">
          <button
            onClick={handleFind}
            disabled={!fromId || !toId || fromId === toId}
            className="flex-1 rounded bg-signal-cyan/15 border border-signal-cyan/40 text-signal-cyan text-xs font-medium py-1.5 hover:bg-signal-cyan/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Find Connection
          </button>
          {result && (
            <button
              onClick={handleClear}
              className={`rounded border ${t.border} px-2.5 text-xs ${t.textMuted} ${t.hoverPanel} transition-colors`}
            >
              Clear
            </button>
          )}
        </div>

        {result === 'none' && (
          <div className={`flex items-center gap-1.5 text-xs ${t.textFaint} pt-1`}>
            <SearchX className="h-3.5 w-3.5" />
            No connecting path found in this case.
          </div>
        )}

        {result && result !== 'none' && (
          <div className={`pt-2 border-t ${t.border} space-y-1.5`}>
            <div className={`text-[10px] font-mono uppercase tracking-wider ${t.textFaint}`}>
              {result.path.length - 1} hop{result.path.length - 1 === 1 ? '' : 's'}
            </div>
            <div className="flex flex-col gap-1">
              {result.path.map((id, i) => {
                const node = nodeById.get(id)
                return (
                  <React.Fragment key={id}>
                    <div className={`text-xs ${t.text} truncate`}>{node?.label || id}</div>
                    {i < result.edgeLabels.length && (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-signal-crimson pl-1">
                        <ArrowRight className="h-3 w-3" />
                        {result.edgeLabels[i]}
                      </div>
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SuspectSelect({ label, value, onChange, suspects, exclude, t }) {
  return (
    <div>
      <label className={`text-[10px] font-mono uppercase tracking-wider ${t.textFaint} block mb-1`}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded border ${t.border} ${t.input} px-2 py-1.5 text-xs outline-none`}
      >
        <option value="">Select suspect…</option>
        {suspects
          .filter((s) => s.id !== exclude)
          .map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ("{s.alias}")
            </option>
          ))}
      </select>
    </div>
  )
}
