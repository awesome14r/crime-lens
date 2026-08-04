export function getCaseBriefing(caseFile, milestoneStatus) {
  const milestones = caseFile.milestones || []
  const completed = milestones.filter((m) => milestoneStatus ? milestoneStatus[m.id] : m.complete).length
  const priority = caseFile.suspects.filter((s) => s.status === 'At Large' && ['High', 'Critical'].includes(s.threatLevel))
  const keySuspects = (priority.length ? priority : [...caseFile.suspects].sort((a, b) => ['Critical','High','Medium','Low'].indexOf(a.threatLevel) - ['Critical','High','Medium','Low'].indexOf(b.threatLevel))).slice(0, 3)
  const recentActivity = [...caseFile.timeline].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  return { totalSuspects: caseFile.suspects.length, atLarge: caseFile.suspects.filter((s) => s.status === 'At Large').length, totalEvidence: caseFile.evidence.length, averageConfidence: Math.round(caseFile.evidence.reduce((sum, e) => sum + e.confidence, 0) / Math.max(1, caseFile.evidence.length)), totalLocations: caseFile.locations.length, progress: Math.round((completed / Math.max(1, milestones.length)) * 100), keySuspects, recentActivity }
}
