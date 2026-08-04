import React, { useState } from 'react'
import { ScanLine, ShieldCheck } from 'lucide-react'
import { useCase } from '../context/CaseContext'

export default function LoginScreen({ onAuthenticated }) {
  const { setAgentIdentity } = useCase()
  const [name, setName] = useState(() => localStorage.getItem('crimelens_agent_name') || '')
  const [passphrase, setPassphrase] = useState('')
  const [scanning, setScanning] = useState(false)
  const submit = (e) => {
    e.preventDefault()
    if (!name.trim() || !passphrase.trim() || scanning) return
    setScanning(true)
    window.setTimeout(() => { setAgentIdentity(name); onAuthenticated() }, 1400)
  }
  return <div className="min-h-screen bg-void-950 bg-grid text-slate-200 flex items-center justify-center px-4 overflow-hidden relative">
    <div className="absolute h-80 w-[40rem] -top-36 -left-24 rotate-[-20deg] bg-signal-cyan/15 blur-3xl animate-pulseSlow" />
    <div className="absolute h-72 w-[36rem] -bottom-32 -right-24 rotate-[25deg] bg-signal-amber/10 blur-3xl animate-pulseSlow" />
    <form onSubmit={submit} className="relative w-full max-w-md rounded-2xl border border-signal-cyan/25 bg-void-900/75 backdrop-blur-xl p-7 sm:p-9 shadow-glow">
      <div className="flex items-center justify-between border-b border-void-600 pb-5"><div><div className="font-display text-2xl font-semibold">Crime<span className="text-signal-cyan">Lens</span></div><div className="mt-1 text-[10px] font-mono tracking-[.22em] text-signal-amber">SECURE UPLINK ESTABLISHED<span className="animate-pulse">_</span></div></div><ShieldCheck className="h-8 w-8 text-signal-cyan" /></div>
      <div className="mt-6 space-y-4"><label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Agent Name<input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Enter field identity" className="mt-1.5 w-full rounded border border-void-600 bg-void-800 px-3 py-2.5 text-sm outline-none focus:border-signal-cyan" /></label><label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Access Code / Passphrase<input value={passphrase} onChange={(e) => setPassphrase(e.target.value)} required type="password" placeholder="••••••••" className="mt-1.5 w-full rounded border border-void-600 bg-void-800 px-3 py-2.5 text-sm outline-none focus:border-signal-cyan" /></label></div>
      <button className="mt-6 w-full rounded border border-signal-cyan/50 bg-signal-cyan/10 py-3 text-xs font-mono uppercase tracking-wider text-signal-cyan hover:bg-signal-cyan/20 disabled:opacity-70" disabled={scanning}>{scanning ? <span className="flex justify-center gap-2"><ScanLine className="h-4 w-4 animate-pulse" /> biometric scan in progress…</span> : 'Authenticate Agent'}</button>
      {scanning && <div className="mt-3 h-1 overflow-hidden rounded bg-void-700"><div className="h-full w-full origin-left animate-[scan_1.4s_linear] bg-signal-cyan" /></div>}
      <div className="mt-5 text-center text-[10px] font-mono text-slate-500">HANDSHAKE ID // CL-7F3A-DELTA</div>
    </form>
  </div>
}
