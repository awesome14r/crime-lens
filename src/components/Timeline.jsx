import React, { useMemo, useState } from 'react'
import {
  FolderOpen,
  Flame,
  FlaskConical,
  MessagesSquare,
  UserX,
  CheckCircle2,
  Circle,
  ListFilter
} from 'lucide-react'
import { useCase } from '../context/CaseContext'
import { parseCaseDate } from '../utils/date'
import { themeClasses } from '../theme'

const TYPE_META = {
  'Case Opened': { color: '#3fd0ff', icon: FolderOpen },
  Incident: { color: '#f5a623', icon: Flame },
  Alibi: { color: '#ff5470', icon: UserX },
  'Forensics Received': { color: '#b98bff', icon: FlaskConical },
  Interrogation: { color: '#2fe6a7', icon: MessagesSquare }
}

export default function Timeline() {
  const { activeCase, theme, timeCursor, timeFilterEnabled, setTimeCursor, setTimeFilterEnabled, caseMilestoneStatus, toggleMilestone, caseDateRange } = useCase()
  const t = themeClasses(theme)
  const [typeFilter, setTypeFilter] = useState('all')

  const eventTypes = useMemo(
    () => Array.from(new Set(activeCase.timeline.map((e) => e.type))),
    [activeCase]
  )

  const visibleEvents = activeCase.timeline.filter(
    (e) => typeFilter === 'all' || e.type === typeFilter
  )

  const jumpToEvent = (event) => {
    const ts = parseCaseDate(event.date)?.getTime()
    if (ts == null) return
    setTimeCursor(ts)
    setTimeFilterEnabled(true)
  }

  const completedCount = activeCase.milestones.filter((m) => caseMilestoneStatus[m.id]).length
  const progressPct = Math.round((completedCount / activeCase.milestones.length) * 100)

  return (
    <div className="h-full w-full flex flex-col gap-4 p-4 overflow-y-auto scrollbar-tactical">
      {/* Case progress tracker */}
      <div className={`rounded border ${t.border} ${t.panelSolid} p-4`}>
        <div className="flex items-center justify-between mb-3">
          <div className={`text-xs font-mono uppercase tracking-wider ${t.textFaint}`}>Case Progress Tracker</div>
          <div className="text-signal-cyan font-mono text-xs">{progressPct}%</div>
        </div>
        <div className="relative flex items-center justify-between">
          <div className={`absolute left-0 right-0 top-3 h-0.5 ${theme === 'dark' ? 'bg-void-600' : 'bg-slate-300'}`} />
          <div
            className="absolute left-0 top-3 h-0.5 bg-signal-cyan transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
          {activeCase.milestones.map((m, index) => {
            const complete = Boolean(caseMilestoneStatus[m.id])
            const reachedAt = caseDateRange.min + ((caseDateRange.max - caseDateRange.min) * index) / Math.max(1, activeCase.milestones.length - 1)
            const replayReached = timeFilterEnabled && timeCursor >= reachedAt
            return (
            <div key={m.id} className="relative z-10 flex flex-col items-center gap-1.5 flex-1">
              <button aria-label={`Mark ${m.label} complete`} onClick={() => toggleMilestone(m.id)} className="rounded-full">
                {complete ? <CheckCircle2 className="h-6 w-6 text-signal-cyan bg-void-950 rounded-full" /> : <Circle className={`h-6 w-6 ${replayReached ? 'text-signal-amber' : t.textFaint}`} style={{ background: theme === 'dark' ? '#0b0f19' : '#f1f5f9', borderRadius: '9999px' }} />}
              </button>
              <span className={`text-[10px] font-mono text-center leading-tight ${complete ? 'text-signal-cyan' : replayReached ? 'text-signal-amber' : t.textFaint}`}>
                {m.label}
              </span>
            </div>
          )})}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider ${t.textFaint}`}>
          <ListFilter className="h-3 w-3" /> Filter
        </span>
        <button
          onClick={() => setTypeFilter('all')}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
            typeFilter === 'all'
              ? 'border-signal-cyan/50 bg-signal-cyan/10 text-signal-cyan'
              : `${t.border} ${t.textMuted} ${t.hoverPanel}`
          }`}
        >
          All Events
        </button>
        {eventTypes.map((type) => {
          const meta = TYPE_META[type]
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${
                typeFilter === type ? '' : `${t.border} ${t.textMuted} ${t.hoverPanel}`
              }`}
              style={
                typeFilter === type
                  ? { borderColor: `${meta.color}66`, background: `${meta.color}18`, color: meta.color }
                  : {}
              }
            >
              <meta.icon className="h-3 w-3" />
              {type}
            </button>
          )
        })}
      </div>

      {/* Horizontal timeline */}
      <div className={`rounded border ${t.border} ${t.panelSolid} p-5 flex-1 overflow-x-auto scrollbar-tactical`}>
        <div className="relative min-w-max flex items-start gap-10 px-4" style={{ minHeight: 170 }}>
          <div className={`absolute left-0 right-0 top-[22px] h-0.5 ${theme === 'dark' ? 'bg-void-600' : 'bg-slate-300'}`} />
          {visibleEvents.map((event) => {
            const meta = TYPE_META[event.type] || TYPE_META.Incident
            const Icon = meta.icon
            const eventTs = parseCaseDate(event.date)?.getTime()
            const isFuture = timeFilterEnabled && eventTs != null && eventTs > timeCursor
            const isCursor = timeFilterEnabled && eventTs != null && Math.abs(eventTs - timeCursor) < 1000 * 60 * 60 * 12
            return (
              <button
                key={event.id}
                onClick={() => jumpToEvent(event)}
                className="relative flex flex-col items-center w-52 shrink-0 text-left transition-opacity"
                style={{ opacity: isFuture ? 0.35 : 1 }}
              >
                <div
                  className="h-11 w-11 rounded-full flex items-center justify-center border-2 z-10 transition-transform hover:scale-110"
                  style={{
                    borderColor: meta.color,
                    background: theme === 'dark' ? '#0e1420' : '#ffffff',
                    boxShadow: isCursor ? `0 0 0 3px ${meta.color}33, 0 0 16px ${meta.color}` : `0 0 12px ${meta.color}55`
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: meta.color }} />
                </div>
                <span className="mt-2 text-[10px] font-mono" style={{ color: meta.color }}>
                  {event.date}
                </span>
                <span
                  className="text-[10px] font-mono uppercase tracking-wide mt-0.5 px-1.5 py-0.5 rounded"
                  style={{ color: meta.color, background: `${meta.color}15` }}
                >
                  {event.type}
                </span>
                <p className={`mt-1.5 text-xs text-center ${t.textMuted} leading-snug`}>{event.description}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
