import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react'
import { CASES } from '../data/mockData'
import { getCaseDateRange } from '../utils/date'

const CaseContext = createContext(null)

export function CaseProvider({ children }) {
  const [activeCaseId, setActiveCaseIdState] = useState('CASE-2026-889A')
  const [selectedEntity, setSelectedEntity] = useState(null) // { type: 'suspect'|'location'|'evidence', id }
  const [searchQuery, setSearchQuery] = useState('')
  const [theme, setTheme] = useState('dark')
  const [activeTab, setActiveTab] = useState('map')
  const [caseData, setCaseData] = useState(() => structuredClone(CASES))
  const [agentName, setAgentNameState] = useState(() => localStorage.getItem('crimelens_agent_name') || '')
  const [agentCodeName, setAgentCodeNameState] = useState(() => localStorage.getItem('crimelens_agent_code') || '')
  const [caseMilestoneStatus, setCaseMilestoneStatus] = useState(() => Object.fromEntries(Object.entries(CASES).map(([id, c]) => [id, Object.fromEntries(c.milestones.map((m) => [m.id, m.complete]))])))

  // Temporal scrubber: lets Map/Graph/Timeline replay the case chronologically
  const [timeFilterEnabled, setTimeFilterEnabled] = useState(false)
  const [timeCursor, setTimeCursor] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  const activeCase = caseData[activeCaseId]
  const setActiveCaseId = useCallback((id) => { if (id !== activeCaseId) { setActiveCaseIdState(id); setActiveTab('case-briefing') } }, [activeCaseId])

  const setAgentIdentity = useCallback((name) => {
    const cleaned = name.trim()
    const code = `${cleaned.slice(0, 2).toUpperCase() || 'AG'} RI DELTA`
    setAgentNameState(cleaned)
    setAgentCodeNameState(code)
    localStorage.setItem('crimelens_agent_name', cleaned)
    localStorage.setItem('crimelens_agent_code', code)
  }, [])
  const clearAgentIdentity = useCallback(() => { setAgentNameState(''); setAgentCodeNameState(''); localStorage.removeItem('crimelens_agent_name'); localStorage.removeItem('crimelens_agent_code') }, [])

  const updateActiveCase = useCallback((updater) => {
    setCaseData((current) => ({ ...current, [activeCaseId]: updater(current[activeCaseId]) }))
  }, [activeCaseId])

  const nextId = (items, prefix) => `${prefix}${Math.max(0, ...items.map((item) => Number(String(item.id).replace(/\D/g, '')) || 0)) + 1}`
  const addSuspect = useCallback((details) => updateActiveCase((c) => ({
    ...c,
    suspects: [...c.suspects, { ...details, id: nextId(c.suspects, 'S'), linkedEvidenceCount: 0 }]
  })), [updateActiveCase])
  const addEvidence = useCallback((details) => updateActiveCase((c) => ({
    ...c,
    evidence: [...c.evidence, { ...details, id: nextId(c.evidence, 'E'), tags: Array.isArray(details.tags) ? details.tags : [] }]
  })), [updateActiveCase])
  const addRelationship = useCallback((relationship) => updateActiveCase((c) => ({
    ...c,
    relationships: [...c.relationships, relationship]
  })), [updateActiveCase])
  const addCase = useCallback((newCase) => { setCaseData((current) => ({ ...current, [newCase.id]: newCase })); setCaseMilestoneStatus((current) => ({ ...current, [newCase.id]: Object.fromEntries(newCase.milestones.map((m) => [m.id, m.complete])) })); setActiveCaseIdState(newCase.id); setActiveTab('case-briefing') }, [])
  const toggleMilestone = useCallback((milestoneId) => setCaseMilestoneStatus((current) => ({ ...current, [activeCaseId]: { ...current[activeCaseId], [milestoneId]: !current[activeCaseId]?.[milestoneId] } })), [activeCaseId])

  const caseDateRange = useMemo(() => getCaseDateRange(activeCase), [activeCase])

  // Reset the scrubber whenever the active case changes so it always starts
  // pointed at "now" (full case, filter off) for the newly selected case.
  useEffect(() => {
    setTimeCursor(caseDateRange.max)
    setTimeFilterEnabled(false)
    setIsPlaying(false)
  }, [activeCaseId, caseDateRange.max])

  const selectEntity = useCallback((type, id) => {
    setSelectedEntity({ type, id })
  }, [])

  const clearEntity = useCallback(() => setSelectedEntity(null), [])

  // Compute a set of matching entity ids across suspects/locations/evidence for global search
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return null
    const q = searchQuery.trim().toLowerCase()
    const matches = new Set()

    activeCase.suspects.forEach((s) => {
      if (
        s.name.toLowerCase().includes(q) ||
        s.alias.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q) ||
        s.threatLevel.toLowerCase().includes(q)
      ) {
        matches.add(s.id)
      }
    })
    activeCase.locations.forEach((l) => {
      if (l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q)) {
        matches.add(l.id)
      }
    })
    activeCase.evidence.forEach((e) => {
      if (e.title.toLowerCase().includes(q) || e.type.toLowerCase().includes(q)) {
        matches.add(e.id)
      }
    })
    return matches
  }, [searchQuery, activeCase])

  const value = {
    activeCaseId,
    setActiveCaseId,
    activeCase,
    caseList: Object.values(caseData).map(({ id, title, status }) => ({ id, title, status })),
    agentName,
    agentCodeName,
    setAgentIdentity,
    clearAgentIdentity,
    addSuspect,
    addEvidence,
    addRelationship,
    addCase,
    caseData,
    caseMilestoneStatus: caseMilestoneStatus[activeCaseId] || {},
    toggleMilestone,
    selectedEntity,
    selectEntity,
    clearEntity,
    searchQuery,
    setSearchQuery,
    searchMatches,
    theme,
    setTheme,
    activeTab,
    setActiveTab,
    caseDateRange,
    timeFilterEnabled,
    setTimeFilterEnabled,
    timeCursor,
    setTimeCursor,
    isPlaying,
    setIsPlaying,
    commandPaletteOpen,
    setCommandPaletteOpen
  }

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>
}

export function useCase() {
  const ctx = useContext(CaseContext)
  if (!ctx) throw new Error('useCase must be used within CaseProvider')
  return ctx
}
