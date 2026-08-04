import React, { useMemo, useState } from 'react'
import { Radio, Fingerprint, FileSignature, Lock, FlaskConical, ShieldCheck, Plus } from 'lucide-react'
import { FormModal, Input, Select } from './SuspectDirectory'
import { useCase } from '../context/CaseContext'
import { EVIDENCE_TYPE_META } from '../data/mockData'
import { themeClasses } from '../theme'

const TYPE_ICON = { Digital: Radio, Physical: Fingerprint, Document: FileSignature }

const CUSTODY_META = {
  Secured: { color: '#2fe6a7', icon: ShieldCheck },
  Lab: { color: '#3fd0ff', icon: FlaskConical },
  Sealed: { color: '#ff5470', icon: Lock }
}

export default function EvidenceLocker() {
  const { activeCase, selectEntity, searchMatches, theme, addEvidence } = useCase()
  const t = themeClasses(theme)
  const [category, setCategory] = useState('all')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'Digital', confidence: 80, chainOfCustody: 'Secured', linkedSuspectId: '', linkedLocationId: '', tags: '' })
  const submit = (e) => { e.preventDefault(); if (!form.title.trim()) return; addEvidence({ ...form, confidence: Number(form.confidence), tags: form.tags.split(',').map(x => x.trim()).filter(Boolean) }); setAdding(false) }

  const categories = ['all', 'Digital', 'Physical', 'Document']

  const filtered = useMemo(
    () => activeCase.evidence.filter((e) => category === 'all' || e.type === category),
    [activeCase, category]
  )

  const findSuspect = (id) => activeCase.suspects.find((s) => s.id === id)
  const findLocation = (id) => activeCase.locations.find((l) => l.id === id)

  return (
    <div className="h-full w-full flex flex-col p-4 gap-4 overflow-hidden">
      <div className="flex items-center gap-2 shrink-0">
        {categories.map((cat) => {
          const meta = cat !== 'all' ? EVIDENCE_TYPE_META[cat] : null
          const active = category === cat
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                active ? '' : `${t.border} ${t.textMuted} ${t.hoverPanel}`
              }`}
              style={active ? { borderColor: meta ? `${meta.color}66` : '#3fd0ff66', background: meta ? `${meta.color}18` : '#3fd0ff18', color: meta ? meta.color : '#3fd0ff' } : {}}
            >
              {cat === 'all' ? 'All Evidence' : cat}
            </button>
          )
        })}
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 rounded border border-signal-cyan/40 bg-signal-cyan/10 px-2.5 py-1.5 text-xs text-signal-cyan"><Plus className="h-3.5 w-3.5" /> Add Evidence</button>
        <span className={`ml-auto text-xs font-mono ${t.textFaint}`}>
          {filtered.length} / {activeCase.evidence.length} items
        </span>
      </div>
      {adding && <FormModal title="Add Evidence" t={t} onClose={() => setAdding(false)} onSubmit={submit}><div className="grid grid-cols-2 gap-3"><Input label="Title" value={form.title} onChange={(v) => setForm({...form,title:v})} required t={t}/><Select label="Type" value={form.type} values={categories.slice(1)} onChange={(v) => setForm({...form,type:v})} t={t}/><Input label="Confidence score" type="number" value={form.confidence} onChange={(v) => setForm({...form,confidence:v})} t={t}/><Select label="Custody" value={form.chainOfCustody} values={Object.keys(CUSTODY_META)} onChange={(v) => setForm({...form,chainOfCustody:v})} t={t}/><Select label="Linked suspect" value={form.linkedSuspectId} values={['', ...activeCase.suspects.map(s => s.id)]} onChange={(v) => setForm({...form,linkedSuspectId:v})} t={t}/><Select label="Linked location" value={form.linkedLocationId} values={['', ...activeCase.locations.map(l => l.id)]} onChange={(v) => setForm({...form,linkedLocationId:v})} t={t}/></div><Input label="Tags (comma separated)" value={form.tags} onChange={(v) => setForm({...form,tags:v})} t={t}/></FormModal>}

      <div className="flex-1 overflow-y-auto scrollbar-tactical">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-2">
          {filtered.map((e) => {
            const meta = EVIDENCE_TYPE_META[e.type]
            const TypeIcon = TYPE_ICON[e.type]
            const custody = CUSTODY_META[e.chainOfCustody]
            const CustodyIcon = custody.icon
            const suspect = findSuspect(e.linkedSuspectId)
            const location = findLocation(e.linkedLocationId)
            const dimmed = searchMatches ? !searchMatches.has(e.id) : false

            return (
              <button
                key={e.id}
                onClick={() => selectEntity('evidence', e.id)}
                className={`text-left rounded-lg border ${t.border} ${t.panelSolid} p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-150`}
                style={{ opacity: dimmed ? 0.35 : 1 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded flex items-center justify-center shrink-0" style={{ background: `${meta.color}20` }}>
                      <TypeIcon className="h-4 w-4" style={{ color: meta.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm font-medium ${t.text} truncate`}>{e.title}</div>
                      <div className="text-[10px] font-mono text-signal-cyan">{e.id}</div>
                    </div>
                  </div>
                  <span
                    className="flex items-center gap-1 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border shrink-0"
                    style={{ color: custody.color, borderColor: `${custody.color}55`, background: `${custody.color}15` }}
                  >
                    <CustodyIcon className="h-2.5 w-2.5" />
                    {e.chainOfCustody}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className={t.textFaint}>Confidence</span>
                    <span className="font-mono" style={{ color: meta.color }}>{e.confidence}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-void-700/50 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${e.confidence}%`, background: meta.color }} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {e.tags.map((tag) => (
                    <span key={tag} className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${t.border} ${t.textFaint}`}>
                      {tag}
                    </span>
                  ))}
                </div>

                {(suspect || location) && (
                  <div className={`mt-3 pt-2.5 border-t ${t.border} text-[11px] ${t.textMuted} truncate`}>
                    {suspect && <span>{suspect.name} ({suspect.alias})</span>}
                    {suspect && location && <span className="mx-1">·</span>}
                    {location && <span>{location.name}</span>}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
