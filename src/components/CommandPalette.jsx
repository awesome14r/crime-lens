import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Command, Search, User, MapPin, FileText, CornerDownLeft, Map, Waypoints, Users, Boxes, GanttChartSquare, Sparkles } from 'lucide-react'
import { useCase } from '../context/CaseContext'
import { THREAT_COLORS, LOCATION_TYPE_META, EVIDENCE_TYPE_META } from '../data/mockData'
import { themeClasses } from '../theme'

const TAB_COMMANDS = [
  { id: 'map', label: 'Go to Map View', icon: Map },
  { id: 'graph', label: 'Go to Graph View', icon: Waypoints },
  { id: 'suspects', label: 'Go to Suspect Matrix', icon: Users },
  { id: 'evidence', label: 'Go to Evidence Wall', icon: Boxes },
  { id: 'timeline', label: 'Go to Timeline', icon: GanttChartSquare },
  { id: 'insights', label: 'Go to AI Insights', icon: Sparkles }
]

export default function CommandPalette() {
  const { activeCase, selectEntity, setActiveTab, theme, commandPaletteOpen: open, setCommandPaletteOpen: setOpen } = useCase()
  const t = themeClasses(theme)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      const isK = e.key === 'k' || e.key === 'K'
      if ((e.metaKey || e.ctrlKey) && isK) {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const items = []

    TAB_COMMANDS.forEach((cmd) => {
      if (!q || cmd.label.toLowerCase().includes(q)) {
        items.push({ kind: 'tab', id: cmd.id, label: cmd.label, icon: cmd.icon, color: '#3fd0ff' })
      }
    })

    activeCase.suspects.forEach((s) => {
      if (!q || s.name.toLowerCase().includes(q) || s.alias.toLowerCase().includes(q)) {
        items.push({
          kind: 'suspect',
          id: s.id,
          label: s.name,
          sublabel: `"${s.alias}" · ${s.threatLevel} threat`,
          icon: User,
          color: THREAT_COLORS[s.threatLevel]
        })
      }
    })

    activeCase.locations.forEach((l) => {
      if (!q || l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q)) {
        items.push({
          kind: 'location',
          id: l.id,
          label: l.name,
          sublabel: l.address,
          icon: MapPin,
          color: LOCATION_TYPE_META[l.type].color
        })
      }
    })

    activeCase.evidence.forEach((e) => {
      if (!q || e.title.toLowerCase().includes(q) || e.type.toLowerCase().includes(q)) {
        items.push({
          kind: 'evidence',
          id: e.id,
          label: e.title,
          sublabel: `${e.type} · ${e.confidence}% confidence`,
          icon: FileText,
          color: EVIDENCE_TYPE_META[e.type].color
        })
      }
    })

    return items.slice(0, 9)
  }, [query, activeCase])

  useEffect(() => {
    setActiveIndex(0)
  }, [results.length])

  const runResult = (item) => {
    if (!item) return
    if (item.kind === 'tab') {
      setActiveTab(item.id)
    } else {
      const ctxType = item.kind === 'location' ? 'location' : item.kind
      selectEntity(ctxType, item.id)
    }
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      runResult(results[activeIndex])
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[14vh] px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className={`relative w-full max-w-lg rounded-lg border ${t.border} ${t.panelSolid} shadow-2xl shadow-black/60 overflow-hidden`}>
        <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${t.border}`}>
          <Search className="h-4 w-4 text-signal-cyan shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a suspect, location, evidence item, or view…"
            className="bg-transparent outline-none text-sm w-full placeholder:text-slate-500"
          />
          <kbd className={`hidden sm:flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded border ${t.border} ${t.textFaint}`}>
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto scrollbar-tactical py-1.5">
          {results.length === 0 && (
            <div className={`px-4 py-6 text-center text-sm ${t.textFaint}`}>No matches.</div>
          )}
          {results.map((item, i) => {
            const Icon = item.icon
            const active = i === activeIndex
            return (
              <button
                key={`${item.kind}-${item.id}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => runResult(item)}
                className={`w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors ${
                  active ? 'bg-signal-cyan/10' : ''
                }`}
              >
                <div className="h-6 w-6 rounded flex items-center justify-center shrink-0" style={{ background: `${item.color}22` }}>
                  <Icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm ${t.text} truncate`}>{item.label}</div>
                  {item.sublabel && <div className={`text-[11px] ${t.textFaint} truncate`}>{item.sublabel}</div>}
                </div>
                {active && <CornerDownLeft className="h-3.5 w-3.5 text-signal-cyan shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
