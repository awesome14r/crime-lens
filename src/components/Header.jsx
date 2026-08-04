import React, { useState } from 'react'
import {
  Radar,
  Search,
  Moon,
  Sun,
  Download,
  ChevronDown,
  UserCircle2,
  ShieldAlert,
  Command, Send, Plus
} from 'lucide-react'
import { useCase } from '../context/CaseContext'
import { themeClasses } from '../theme'
import { generateCaseReportPdf } from '../utils/reportPdf'
import AgentProfile from './AgentProfile'
import { AGENT_ROSTER } from '../data/mockData'
import { generateCaseFromFir } from '../utils/generateCaseFromFir'

export default function Header({ onLogout }) {
  const {
    activeCaseId,
    setActiveCaseId,
    activeCase,
    searchQuery,
    setSearchQuery,
    theme,
    setTheme,
    setCommandPaletteOpen,
    caseList,
    agentName,
    agentCodeName,
    addCase
  } = useCase()
  const [caseMenuOpen, setCaseMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareTargets, setShareTargets] = useState([])
  const [shareMessage, setShareMessage] = useState('')
  const [fir, setFir] = useState('')
  const [firError, setFirError] = useState('')
  const t = themeClasses(theme)

  const handleExport = () => {
    generateCaseReportPdf(activeCase, { name: agentName, codeName: agentCodeName })
  }

  return (
    <header className={`relative border-b ${t.border} ${t.panelSolid} px-4 py-3 flex items-center gap-4 z-30`}>
      {/* Scanline accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden opacity-60">
        <div className="h-full w-full bg-gradient-to-r from-transparent via-signal-cyan to-transparent" />
      </div>

      {/* Branding */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="relative flex h-9 w-9 items-center justify-center rounded border border-signal-cyan/40 bg-signal-cyan/10 shadow-glow">
          <Radar className="h-5 w-5 text-signal-cyan" strokeWidth={1.75} />
        </div>
        <div className="leading-tight">
          <div className="font-display font-semibold text-lg tracking-tight text-slate-50">
            Crime<span className="text-signal-cyan">Lens</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.2em] text-signal-amber">
            <ShieldAlert className="h-2.5 w-2.5" />
            <span className="animate-pulseSlow">Classified // Investigation Unit</span>
          </div>
        </div>
      </div>

      <div className={`h-8 w-px ${t.border} border-l hidden md:block`} />

      {/* Case switcher */}
      <div className="relative hidden md:block">
        <button
          onClick={() => setCaseMenuOpen((o) => !o)}
          className={`flex items-center gap-2 rounded border ${t.border} ${t.panelAlt} px-3 py-1.5 text-sm ${t.hoverPanel} transition-colors`}
        >
          <span className="font-mono text-signal-cyan text-xs">{activeCase.id}</span>
          <span className={`${t.text} font-medium`}>{activeCase.title}</span>
          <ChevronDown className={`h-3.5 w-3.5 ${t.textMuted} transition-transform ${caseMenuOpen ? 'rotate-180' : ''}`} />
        </button>
        {caseMenuOpen && (
          <div className={`absolute left-0 mt-1.5 w-80 rounded border ${t.border} ${t.panelSolid} shadow-xl shadow-black/40 overflow-hidden`}>
            {caseList.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCaseId(c.id)
                  setCaseMenuOpen(false)
                }}
                className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 text-sm ${t.hoverPanel} transition-colors ${
                  c.id === activeCaseId ? 'bg-signal-cyan/5' : ''
                }`}
              >
                <div>
                  <div className="font-mono text-[11px] text-signal-cyan">{c.id}</div>
                  <div className={t.text}>{c.title}</div>
                </div>
                <span
                  className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                    c.status === 'Active'
                      ? 'border-signal-jade/40 text-signal-jade bg-signal-jade/10'
                      : 'border-slate-500/40 text-slate-400 bg-slate-500/10'
                  }`}
                >
                  {c.status}
                </span>
              </button>
            ))}
            <form onSubmit={(e) => { e.preventDefault(); try { addCase(generateCaseFromFir(fir)); setFir(''); setFirError(''); setCaseMenuOpen(false) } catch (err) { setFirError(err.message) } }} className={`border-t ${t.border} p-2`}><div className="flex gap-1"><input value={fir} onChange={e=>setFir(e.target.value)} placeholder="FIR-2026-MH-0421" className={`min-w-0 flex-1 rounded border ${t.border} ${t.input} px-2 py-1 text-[10px] font-mono`}/><button className="rounded border border-signal-cyan/40 px-2 text-signal-cyan"><Plus className="h-3 w-3"/></button></div>{firError && <div className="mt-1 text-[10px] text-signal-crimson">{firError}</div>}</form>
          </div>
        )}
      </div>

      {/* Global search */}
      <div className="flex-1 max-w-md ml-auto">
        <div className={`flex items-center gap-2 rounded border ${t.border} ${t.input} px-3 py-1.5`}>
          <Search className="h-3.5 w-3.5 text-signal-cyan shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suspects, evidence, locations…"
            className="bg-transparent outline-none text-sm w-full placeholder:text-inherit"
          />
        </div>
      </div>

      <button
        onClick={() => setCommandPaletteOpen(true)}
        className={`hidden sm:flex items-center gap-1.5 rounded border ${t.border} ${t.panelAlt} px-2.5 py-1.5 text-xs ${t.textMuted} ${t.hoverPanel} transition-colors shrink-0`}
      >
        <Command className="h-3.5 w-3.5 text-signal-cyan" />
        <span className="font-mono">K</span>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded border border-signal-amber/40 bg-signal-amber/10 px-3 py-1.5 text-xs font-medium text-signal-amber hover:bg-signal-amber/20 transition-colors shadow-glow-amber"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Export Briefing</span>
        </button>

        <button onClick={() => setShareOpen(true)} className={`hidden md:flex items-center gap-1 rounded border ${t.border} ${t.panelAlt} px-2.5 py-1.5 text-xs ${t.textMuted}`}><Send className="h-3.5 w-3.5 text-signal-cyan"/><span>Share Report</span></button>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`flex h-8 w-8 items-center justify-center rounded border ${t.border} ${t.panelAlt} ${t.hoverPanel} transition-colors`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-signal-amber" />
          ) : (
            <Moon className="h-4 w-4 text-void-600" />
          )}
        </button>

        <button onClick={() => setProfileOpen(true)} aria-label="Open agent profile" className={`flex h-8 w-8 items-center justify-center rounded-full border ${t.border} ${t.panelAlt}`}>
          <UserCircle2 className={`h-5 w-5 ${t.textMuted}`} />
        </button>
      </div>
      <AgentProfile open={profileOpen} onClose={() => setProfileOpen(false)} onLogout={onLogout} />
      {shareOpen && <div className="fixed inset-0 z-[120] flex items-center justify-center p-4"><button onClick={()=>setShareOpen(false)} className="absolute inset-0 bg-black/60"/><div className={`relative w-full max-w-sm rounded border ${t.border} ${t.panelSolid} p-4`}><div className="font-mono text-xs text-signal-cyan">SHARE CASE REPORT</div><div className="mt-3 space-y-2">{AGENT_ROSTER.map(code => <label key={code} className={`flex items-center gap-2 rounded border ${t.border} ${t.panelAlt} p-2 text-xs ${t.text}`}><input type="checkbox" checked={shareTargets.includes(code)} onChange={()=>setShareTargets(x=>x.includes(code)?x.filter(v=>v!==code):[...x,code])}/>{code}</label>)}</div><button onClick={()=>setShareMessage(shareTargets.length?`Report shared with ${shareTargets.join(', ')}`:'Select at least one agent.')} className="mt-3 rounded border border-signal-cyan/40 bg-signal-cyan/10 px-3 py-2 text-xs text-signal-cyan">Share</button>{shareMessage&&<div className="mt-2 text-xs text-signal-jade">{shareMessage}</div>}</div></div>}
    </header>
  )
}
