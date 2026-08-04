import React, { useState } from 'react'
import { Map, Waypoints, Users, Boxes, GanttChartSquare, Sparkles, FileSearch } from 'lucide-react'
import { CaseProvider, useCase } from './context/CaseContext'
import { themeClasses } from './theme'
import Header from './components/Header'
import EntityDrawer from './components/EntityDrawer'
import CommandPalette from './components/CommandPalette'
import TemporalScrubber from './components/TemporalScrubber'
import CrimeMap from './components/CrimeMap'
import GraphViewTab from './components/GraphViewTab'
import Timeline from './components/Timeline'
import SuspectDirectory from './components/SuspectDirectory'
import EvidenceLocker from './components/EvidenceLocker'
import AIInsights from './components/AIInsights'
import LoginScreen from './components/LoginScreen'
import CaseBriefing from './components/CaseBriefing'
import WelcomeIntro from './components/WelcomeIntro'

const TABS = [
  { id: 'case-briefing', label: 'Case Briefing', icon: FileSearch },
  { id: 'map', label: 'Map View', icon: Map },
  { id: 'graph', label: 'Graph View', icon: Waypoints },
  { id: 'suspects', label: 'Suspect Matrix', icon: Users },
  { id: 'evidence', label: 'Evidence Wall', icon: Boxes },
  { id: 'timeline', label: 'Timeline', icon: GanttChartSquare },
  { id: 'insights', label: 'AI Insights', icon: Sparkles }
]

// The temporal scrubber only means something on views that plot entities in
// space/graph form or on the timeline itself.
const SCRUBBER_TABS = new Set(['map', 'graph', 'timeline'])

function AppShell({ onLogout }) {
  const { activeTab, setActiveTab, activeCase, theme, agentName } = useCase()
  const t = themeClasses(theme)

  return (
    <div className={`h-screen w-screen flex flex-col ${t.appBg} ${t.appBgImage} ${t.text} font-body overflow-hidden`}>
      <Header onLogout={onLogout} />

      {/* Case strip + tab bar */}
      <div className={`flex items-center gap-1 px-3 pt-2 border-b ${t.border} ${t.panelSolid} overflow-x-auto scrollbar-tactical shrink-0`}>
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-t-md transition-colors whitespace-nowrap ${
                active ? 'text-signal-cyan' : `${t.textMuted} ${t.hoverPanel}`
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {active && <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-signal-cyan rounded-full shadow-glow" />}
            </button>
          )
        })}

        <div className={`ml-auto hidden md:flex items-center gap-3 pr-2 pb-2 text-[10px] font-mono ${t.textFaint}`}>
          <span>
            LEAD: <span className={t.textMuted}>{agentName || activeCase.leadInvestigator}</span>
          </span>
          <span>
            OPENED: <span className={t.textMuted}>{activeCase.createdAt}</span>
          </span>
          <span
            className={`px-1.5 py-0.5 rounded border uppercase ${
              activeCase.status === 'Active'
                ? 'border-signal-jade/40 text-signal-jade bg-signal-jade/10'
                : 'border-slate-500/40 text-slate-400 bg-slate-500/10'
            }`}
          >
            {activeCase.status}
          </span>
        </div>
      </div>

      {SCRUBBER_TABS.has(activeTab) && <TemporalScrubber />}

      {/* Main content */}
      <main className="flex-1 min-h-0 relative">
        {activeTab === 'case-briefing' && <CaseBriefing />}
        {activeTab === 'map' && <CrimeMap />}
        {activeTab === 'graph' && <GraphViewTab />}
        {activeTab === 'suspects' && <SuspectDirectory />}
        {activeTab === 'evidence' && <EvidenceLocker />}
        {activeTab === 'timeline' && <Timeline />}
        {activeTab === 'insights' && <AIInsights />}
      </main>

      <EntityDrawer />
      <CommandPalette />
    </div>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('crimelens_session_active') === 'true')
  const [showIntro, setShowIntro] = useState(false)
  return (
    <CaseProvider>
      {!isAuthenticated ? <LoginScreen onAuthenticated={() => { sessionStorage.setItem('crimelens_session_active', 'true'); setIsAuthenticated(true); setShowIntro(true) }} /> : showIntro ? <WelcomeIntro onComplete={() => setShowIntro(false)} /> : <AppShell onLogout={() => { sessionStorage.removeItem('crimelens_session_active'); setIsAuthenticated(false) }} />}
    </CaseProvider>
  )
}
