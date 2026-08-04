import React, { useMemo, useState } from 'react'
import { Search, Filter, Link2, FileStack, Plus, X } from 'lucide-react'
import { useCase } from '../context/CaseContext'
import { THREAT_COLORS } from '../data/mockData'
import { themeClasses } from '../theme'

const THREAT_LEVELS = ['Critical', 'High', 'Medium', 'Low']
const STATUSES = ['In Custody', 'At Large', 'Person of Interest']

export default function SuspectDirectory() {
  const { activeCase, selectEntity, theme, addSuspect } = useCase()
  const t = themeClasses(theme)
  const [query, setQuery] = useState('')
  const [threatFilter, setThreatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', alias: '', age: '', threatLevel: 'Medium', status: 'Person of Interest', lastKnownLocation: '', notes: '' })
  const submit = (e) => { e.preventDefault(); if (!form.name.trim() || !form.alias.trim() || !form.lastKnownLocation.trim()) return; addSuspect({ ...form, age: Number(form.age) || 0 }); setAdding(false); setForm({ name: '', alias: '', age: '', threatLevel: 'Medium', status: 'Person of Interest', lastKnownLocation: '', notes: '' }) }

  const resolveConnection = (suspectId) => {
    const edge = activeCase.relationships.find((r) => r.source === suspectId || r.target === suspectId)
    if (!edge) return null
    const otherId = edge.source === suspectId ? edge.target : edge.source
    const loc = activeCase.locations.find((l) => l.id === otherId)
    const ev = activeCase.evidence.find((e) => e.id === otherId)
    const sus = activeCase.suspects.find((s) => s.id === otherId)
    const other = loc?.name || ev?.title || sus?.name
    return { label: edge.label, other, otherId, otherType: loc ? 'location' : ev ? 'evidence' : 'suspect' }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return activeCase.suspects.filter((s) => {
      const matchesQuery =
        !q || s.name.toLowerCase().includes(q) || s.alias.toLowerCase().includes(q)
      const matchesThreat = threatFilter === 'all' || s.threatLevel === threatFilter
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter
      return matchesQuery && matchesThreat && matchesStatus
    })
  }, [activeCase, query, threatFilter, statusFilter])

  return (
    <div className="h-full w-full flex flex-col p-4 gap-4 overflow-hidden">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        <div className={`flex items-center gap-2 rounded border ${t.border} ${t.input} px-3 py-1.5 min-w-[220px]`}>
          <Search className="h-3.5 w-3.5 text-signal-cyan" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or alias…"
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>

        <FilterDropdown
          label="Threat Level"
          value={threatFilter}
          onChange={setThreatFilter}
          options={THREAT_LEVELS}
          colorMap={THREAT_COLORS}
          t={t}
        />
        <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUSES} t={t} />

        <button onClick={() => setAdding(true)} className="flex items-center gap-1 rounded border border-signal-cyan/40 bg-signal-cyan/10 px-2.5 py-1.5 text-xs text-signal-cyan"><Plus className="h-3.5 w-3.5" /> Add Suspect</button>

        <span className={`ml-auto text-xs font-mono ${t.textFaint}`}>
          {filtered.length} / {activeCase.suspects.length} suspects
        </span>
      </div>
      {adding && <FormModal title="Add Suspect" t={t} onClose={() => setAdding(false)} onSubmit={submit}><div className="grid grid-cols-2 gap-3"><Input label="Name" value={form.name} onChange={(v) => setForm({...form,name:v})} required t={t}/><Input label="Alias" value={form.alias} onChange={(v) => setForm({...form,alias:v})} required t={t}/><Input label="Age" type="number" value={form.age} onChange={(v) => setForm({...form,age:v})} t={t}/><Select label="Threat" value={form.threatLevel} onChange={(v) => setForm({...form,threatLevel:v})} values={THREAT_LEVELS} t={t}/><Select label="Status" value={form.status} onChange={(v) => setForm({...form,status:v})} values={STATUSES} t={t}/><Input label="Last known location" value={form.lastKnownLocation} onChange={(v) => setForm({...form,lastKnownLocation:v})} required t={t}/></div><Input label="Notes" value={form.notes} onChange={(v) => setForm({...form,notes:v})} t={t}/></FormModal>}

      {/* Grid of profile cards */}
      <div className="flex-1 overflow-y-auto scrollbar-tactical">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-2">
          {filtered.map((s) => {
            const conn = resolveConnection(s.id)
            const color = THREAT_COLORS[s.threatLevel]
            return (
              <button
                key={s.id}
                onClick={() => selectEntity('suspect', s.id)}
                className={`text-left rounded-lg border ${t.border} ${t.panelSolid} p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-150 group`}
                style={{ boxShadow: `inset 3px 0 0 ${color}` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-12 w-12 rounded-full border-2 flex items-center justify-center font-display font-semibold shrink-0"
                    style={{ borderColor: color, color }}
                  >
                    {s.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <div className={`font-display font-semibold ${t.text} truncate group-hover:text-signal-cyan transition-colors`}>
                      {s.name}
                    </div>
                    <div className="text-signal-cyan text-xs font-mono truncate">"{s.alias}"</div>
                    <div className={`text-[11px] ${t.textFaint} mt-0.5`}>Age {s.age}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3">
                  <span
                    className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border"
                    style={{ color, borderColor: `${color}55`, background: `${color}15` }}
                  >
                    {s.threatLevel}
                  </span>
                  <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${t.border} ${t.textMuted}`}>
                    {s.status}
                  </span>
                </div>

                <div className={`flex items-center gap-1.5 mt-3 text-xs ${t.textMuted}`}>
                  <FileStack className="h-3.5 w-3.5 text-signal-violet shrink-0" />
                  <span>{s.linkedEvidenceCount} linked evidence item{s.linkedEvidenceCount === 1 ? '' : 's'}</span>
                </div>
                {s.involvementSummary && <p className={`mt-2 text-[11px] leading-relaxed ${t.textFaint}`}>{s.involvementSummary}</p>}

                {conn && (
                  <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${t.textMuted} truncate`}>
                    <Link2 className="h-3.5 w-3.5 text-signal-cyan shrink-0" />
                    <span className="truncate">
                      <span className="text-signal-cyan font-mono text-[10px] uppercase mr-1">{conn.label}</span>
                      {conn.other}
                    </span>
                  </div>
                )}
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className={`col-span-full text-center py-12 text-sm ${t.textFaint}`}>
              No suspects match the current filters.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function FormModal({ title, t, onClose, onSubmit, children }) { return <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"><button className="absolute inset-0 bg-black/60" onClick={onClose}/><form onSubmit={onSubmit} className={`relative w-full max-w-lg rounded-lg border ${t.border} ${t.panelSolid} p-5 shadow-2xl`}><div className="mb-4 flex justify-between"><span className="font-mono text-sm text-signal-cyan">{title}</span><button type="button" onClick={onClose}><X className="h-4 w-4"/></button></div><div className="space-y-3">{children}</div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className={`rounded border ${t.border} px-3 py-1.5 text-xs ${t.textMuted}`}>Cancel</button><button className="rounded border border-signal-cyan/40 bg-signal-cyan/10 px-3 py-1.5 text-xs text-signal-cyan">Save</button></div></form></div> }
export function Input({ label, value, onChange, t, required, type = 'text' }) { return <label className={`block text-[10px] font-mono ${t.textFaint}`}>{label}<input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} className={`mt-1 w-full rounded border ${t.border} ${t.input} px-2 py-1.5 text-xs outline-none`}/></label> }
export function Select({ label, value, onChange, values, t }) { return <label className={`block text-[10px] font-mono ${t.textFaint}`}>{label}<select value={value} onChange={(e) => onChange(e.target.value)} className={`mt-1 w-full rounded border ${t.border} ${t.input} px-2 py-1.5 text-xs outline-none`}>{values.map(v => <option key={v}>{v}</option>)}</select></label> }

function FilterDropdown({ label, value, onChange, options, colorMap, t }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none rounded border ${t.border} ${t.input} pl-3 pr-7 py-1.5 text-xs cursor-pointer outline-none`}
      >
        <option value="all">All {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <Filter className="h-3 w-3 text-signal-cyan absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  )
}
