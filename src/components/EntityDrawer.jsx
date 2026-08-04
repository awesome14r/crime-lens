import React from 'react'
import { X, User, MapPin, FileText, ArrowUpRight } from 'lucide-react'
import { useCase } from '../context/CaseContext'
import { THREAT_COLORS, LOCATION_TYPE_META, EVIDENCE_TYPE_META } from '../data/mockData'
import { themeClasses } from '../theme'

export default function EntityDrawer() {
  const { selectedEntity, clearEntity, activeCase, selectEntity, theme } = useCase()
  const t = themeClasses(theme)

  if (!selectedEntity) return null

  const { type, id } = selectedEntity
  let content = null

  if (type === 'suspect') {
    const s = activeCase.suspects.find((x) => x.id === id)
    if (!s) return null
    const relatedEdges = activeCase.relationships.filter((r) => r.source === s.id || r.target === s.id)
    content = (
      <>
        <DrawerHeader icon={User} color={THREAT_COLORS[s.threatLevel]} label="Suspect Profile" t={t} onClose={clearEntity} />
        <div className="px-5 pt-4">
          <div className="flex items-center gap-3">
            <div
              className="h-14 w-14 rounded-full border-2 flex items-center justify-center text-lg font-display font-semibold shrink-0"
              style={{ borderColor: THREAT_COLORS[s.threatLevel], color: THREAT_COLORS[s.threatLevel] }}
            >
              {s.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className={`font-display font-semibold text-lg ${t.text}`}>{s.name}</div>
              <div className="text-signal-cyan text-sm font-mono">"{s.alias}"</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-4 text-xs">
            <Field label="Age" value={s.age} t={t} />
            <Field
              label="Threat Level"
              value={s.threatLevel}
              valueClass="font-semibold"
              valueStyle={{ color: THREAT_COLORS[s.threatLevel] }}
              t={t}
            />
            <Field label="Status" value={s.status} t={t} />
            <Field label="Last Known Location" value={s.lastKnownLocation} t={t} />
          </div>

          <p className={`mt-4 text-sm ${t.textMuted} leading-relaxed`}>{s.notes}</p>
          {s.involvementSummary && <div className={`mt-3 rounded border ${t.border} ${t.panelAlt} p-3 text-xs leading-relaxed ${t.textMuted}`}><div className="mb-1 font-mono text-[10px] text-signal-cyan">CASE INVOLVEMENT</div>{s.involvementSummary}</div>}

          <RelatedSection edges={relatedEdges} activeId={s.id} onSelect={selectEntity} activeCase={activeCase} t={t} />
        </div>
      </>
    )
  }

  if (type === 'location') {
    const l = activeCase.locations.find((x) => x.id === id)
    if (!l) return null
    const meta = LOCATION_TYPE_META[l.type]
    const relatedEdges = activeCase.relationships.filter((r) => r.source === l.id || r.target === l.id)
    content = (
      <>
        <DrawerHeader icon={MapPin} color={meta.color} label={meta.label} t={t} onClose={clearEntity} />
        <div className="px-5 pt-4">
          <div className={`font-display font-semibold text-lg ${t.text}`}>{l.name}</div>
          <div className={`text-sm ${t.textMuted} font-mono mt-0.5`}>{l.address}</div>

          <div className="grid grid-cols-2 gap-2.5 mt-4 text-xs">
            <Field label="Date / Time" value={l.datetime} t={t} />
            <Field label="Coordinates" value={`${l.lat.toFixed(3)}, ${l.lng.toFixed(3)}`} t={t} />
          </div>

          <p className={`mt-4 text-sm ${t.textMuted} leading-relaxed`}>{l.description}</p>

          <RelatedSection edges={relatedEdges} activeId={l.id} onSelect={selectEntity} activeCase={activeCase} t={t} />
        </div>
      </>
    )
  }

  if (type === 'evidence') {
    const e = activeCase.evidence.find((x) => x.id === id)
    if (!e) return null
    const meta = EVIDENCE_TYPE_META[e.type]
    const suspect = activeCase.suspects.find((s) => s.id === e.linkedSuspectId)
    const location = activeCase.locations.find((loc) => loc.id === e.linkedLocationId)
    content = (
      <>
        <DrawerHeader icon={FileText} color={meta.color} label={`${meta.label} Evidence`} t={t} onClose={clearEntity} />
        <div className="px-5 pt-4">
          <div className={`font-display font-semibold text-lg ${t.text}`}>{e.title}</div>
          <div className="text-xs font-mono text-signal-cyan mt-0.5">{e.id}</div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={t.textMuted}>Confidence Score</span>
              <span className="font-mono" style={{ color: meta.color }}>{e.confidence}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-void-700/60 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${e.confidence}%`, background: meta.color }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-4 text-xs">
            <Field label="Chain of Custody" value={e.chainOfCustody} t={t} />
            <Field label="Type" value={e.type} t={t} />
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {e.tags.map((tag) => (
              <span key={tag} className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${t.border} ${t.textMuted}`}>
                {tag}
              </span>
            ))}
          </div>

          <div className={`mt-4 pt-4 border-t ${t.border} space-y-2`}>
            {suspect && (
              <LinkRow icon={User} label={`${suspect.name} ("${suspect.alias}")`} onClick={() => selectEntity('suspect', suspect.id)} t={t} />
            )}
            {location && (
              <LinkRow icon={MapPin} label={location.name} onClick={() => selectEntity('location', location.id)} t={t} />
            )}
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={clearEntity} />
      <div
        className={`relative w-full max-w-sm h-full border-l ${t.border} ${t.panelSolid} shadow-2xl shadow-black/60 overflow-y-auto scrollbar-tactical animate-[fadeIn_0.15s_ease-out]`}
      >
        {content}
        <div className="h-6" />
      </div>
    </div>
  )
}

function DrawerHeader({ icon: Icon, color, label, onClose, t }) {
  return (
    <div className={`flex items-center justify-between px-5 py-4 border-b ${t.border} sticky top-0 ${t.panelSolid} backdrop-blur z-10`}>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded flex items-center justify-center" style={{ background: `${color}22`, border: `1px solid ${color}55` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color }}>
          {label}
        </span>
      </div>
      <button onClick={onClose} className={`${t.textMuted} hover:text-signal-crimson transition-colors`}>
        <X className="h-[18px] w-[18px]" />
      </button>
    </div>
  )
}

function Field({ label, value, valueClass = '', valueStyle, t }) {
  return (
    <div className={`rounded border ${t.border} ${t.panelAlt} px-2.5 py-1.5`}>
      <div className={`${t.textFaint} text-[10px] uppercase tracking-wide font-mono`}>{label}</div>
      <div className={`${t.text} mt-0.5 ${valueClass}`} style={valueStyle}>
        {value}
      </div>
    </div>
  )
}

function LinkRow({ icon: Icon, label, onClick, t }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 rounded border ${t.border} ${t.panelAlt} px-2.5 py-2 text-sm ${t.hoverPanel} transition-colors`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="h-3.5 w-3.5 text-signal-cyan shrink-0" />
        <span className={`${t.text} truncate`}>{label}</span>
      </div>
      <ArrowUpRight className={`h-3.5 w-3.5 ${t.textFaint} shrink-0`} />
    </button>
  )
}

function RelatedSection({ edges, activeId, onSelect, activeCase, t }) {
  if (!edges.length) return null

  const resolve = (entityId) => {
    const suspect = activeCase.suspects.find((s) => s.id === entityId)
    if (suspect) return { type: 'suspect', label: suspect.name, sub: suspect.alias }
    const location = activeCase.locations.find((l) => l.id === entityId)
    if (location) return { type: 'location', label: location.name, sub: location.address }
    const evidence = activeCase.evidence.find((e) => e.id === entityId)
    if (evidence) return { type: 'evidence', label: evidence.title, sub: evidence.type }
    return null
  }

  return (
    <div className={`mt-4 pt-4 border-t ${t.border}`}>
      <div className={`text-[10px] font-mono uppercase tracking-wider ${t.textFaint} mb-2`}>Connections ({edges.length})</div>
      <div className="space-y-1.5">
        {edges.map((edge, i) => {
          const otherId = edge.source === activeId ? edge.target : edge.source
          const other = resolve(otherId)
          if (!other) return null
          return (
            <button
              key={i}
              onClick={() => onSelect(other.type, otherId)}
              className={`w-full flex items-center justify-between gap-2 rounded border ${t.border} ${t.panelAlt} px-2.5 py-1.5 text-xs ${t.hoverPanel} transition-colors text-left`}
            >
              <div className="min-w-0">
                <div className={`${t.text} truncate`}>{other.label}</div>
                <div className={`${t.textFaint} truncate`}>{other.sub}</div>
              </div>
              <span className="text-signal-cyan font-mono text-[10px] uppercase whitespace-nowrap shrink-0">{edge.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
