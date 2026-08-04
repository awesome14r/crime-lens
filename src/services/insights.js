import { parseCaseDate } from '../utils/date'

const OVERLAP_WINDOW_MS = 90 * 60 * 1000 // 90 minutes

// ---------------------------------------------------------------------------
// Heuristic engine — pure JS, no network required. Runs instantly so the
// panel is never empty, and doubles as a fallback if live AI analysis
// isn't configured or fails.
// ---------------------------------------------------------------------------
export function generateHeuristicInsights(activeCase) {
  const insights = []
  const suspectIds = new Set(activeCase.suspects.map((s) => s.id))
  const locationById = new Map(activeCase.locations.map((l) => [l.id, l]))

  // Degree centrality — most-connected suspect
  const degree = {}
  activeCase.relationships.forEach((r) => {
    degree[r.source] = (degree[r.source] || 0) + 1
    degree[r.target] = (degree[r.target] || 0) + 1
  })
  const ranked = [...activeCase.suspects].sort((a, b) => (degree[b.id] || 0) - (degree[a.id] || 0))
  if (ranked.length && degree[ranked[0].id]) {
    const top = ranked[0]
    insights.push({
      id: 'centrality',
      severity: 'high',
      title: `${top.name} is the most connected entity in the graph`,
      description: `"${top.alias}" links to ${degree[top.id]} other node${degree[top.id] === 1 ? '' : 's'} — evidence, locations, and associates. Dense networks like this are usually worth prioritizing.`,
      relatedIds: [top.id]
    })
  }

  // Priority suspects: at large + high/critical threat
  const priority = activeCase.suspects.filter(
    (s) => s.status === 'At Large' && (s.threatLevel === 'Critical' || s.threatLevel === 'High')
  )
  if (priority.length) {
    insights.push({
      id: 'priority-suspects',
      severity: 'high',
      title: `${priority.length} high-priority suspect${priority.length === 1 ? '' : 's'} still at large`,
      description: priority.map((s) => `${s.name} ("${s.alias}", ${s.threatLevel})`).join('; ') + '.',
      relatedIds: priority.map((s) => s.id)
    })
  }

  // Strongest evidence
  const strongest = [...activeCase.evidence].sort((a, b) => b.confidence - a.confidence)[0]
  if (strongest) {
    insights.push({
      id: 'strongest-evidence',
      severity: 'info',
      title: `${strongest.title} is the strongest evidence on file`,
      description: `Logged at ${strongest.confidence}% confidence, chain-of-custody status "${strongest.chainOfCustody}".`,
      relatedIds: [strongest.id]
    })
  }

  // Weak evidence needing corroboration
  const weak = activeCase.evidence.filter((e) => e.confidence < 78)
  if (weak.length) {
    insights.push({
      id: 'weak-evidence',
      severity: 'medium',
      title: `${weak.length} evidence item${weak.length === 1 ? '' : 's'} below 78% confidence`,
      description: `${weak.map((e) => e.title).join(', ')} may need additional corroboration.`,
      relatedIds: weak.map((e) => e.id)
    })
  }

  // Overlapping activity windows between different suspects at different locations
  const suspectEvents = {}
  activeCase.relationships.forEach((r) => {
    const susId = suspectIds.has(r.source) ? r.source : suspectIds.has(r.target) ? r.target : null
    if (!susId) return
    const otherId = r.source === susId ? r.target : r.source
    const loc = locationById.get(otherId)
    if (!loc) return
    const ts = parseCaseDate(loc.datetime)?.getTime()
    if (ts == null) return
    if (!suspectEvents[susId]) suspectEvents[susId] = []
    suspectEvents[susId].push({ locationId: loc.id, locationName: loc.name, ts })
  })

  const suspectIdList = Object.keys(suspectEvents)
  let overlapsFound = 0
  outer: for (let i = 0; i < suspectIdList.length; i++) {
    for (let j = i + 1; j < suspectIdList.length; j++) {
      const a = activeCase.suspects.find((s) => s.id === suspectIdList[i])
      const b = activeCase.suspects.find((s) => s.id === suspectIdList[j])
      if (!a || !b) continue
      for (const ea of suspectEvents[suspectIdList[i]]) {
        for (const eb of suspectEvents[suspectIdList[j]]) {
          if (ea.locationId === eb.locationId) continue
          const gap = Math.abs(ea.ts - eb.ts)
          if (gap <= OVERLAP_WINDOW_MS) {
            const minutes = Math.round(gap / 60000)
            insights.push({
              id: `overlap-${a.id}-${b.id}`,
              severity: 'medium',
              title: `${a.name} and ${b.name} — overlapping activity window`,
              description: `${a.name} at ${ea.locationName} and ${b.name} at ${eb.locationName} were logged ${minutes} minute${minutes === 1 ? '' : 's'} apart — worth cross-checking against stated alibis.`,
              relatedIds: [a.id, b.id]
            })
            overlapsFound++
            if (overlapsFound >= 2) break outer
          }
        }
      }
    }
  }

  return insights
}

// ---------------------------------------------------------------------------
// Live AI analysis — optional, calls the Anthropic Messages API directly
// from the browser using a key the user supplies themselves ("bring your
// own key" pattern). Requires the documented
// "anthropic-dangerous-direct-browser-access" header to bypass CORS.
// The key is only ever sent to api.anthropic.com and is never persisted
// anywhere except the browser's own localStorage, at the user's choice.
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are an investigative analysis assistant reviewing FICTIONAL mock crime-case data for a demo application. Respond with ONLY valid JSON (no markdown code fences, no preamble, no trailing commentary) matching exactly this shape:
{"summary": "2-3 sentence plain-English case summary", "insights": [{"title": "short headline", "description": "1-2 sentence explanation", "severity": "high" | "medium" | "info", "relatedIds": ["<ids from the provided data>"]}]}
Generate 3-6 insights. Every id in relatedIds must be an id that literally appears in the provided suspects/locations/evidence data. Prioritize: overlapping time windows between different suspects, the most-connected entities, unusually strong or weak evidence, and suspects who are still at large with high/critical threat levels. Remember this is entirely fictional demo data, not a real case.`

export async function generateAIInsights({ activeCase, apiKey, model }) {
  if (!apiKey) {
    throw new Error('No API key provided.')
  }

  const payload = {
    id: activeCase.id,
    title: activeCase.title,
    status: activeCase.status,
    leadInvestigator: activeCase.leadInvestigator,
    suspects: activeCase.suspects.map(({ id, name, alias, threatLevel, status, lastKnownLocation, notes }) => ({
      id,
      name,
      alias,
      threatLevel,
      status,
      lastKnownLocation,
      notes
    })),
    locations: activeCase.locations.map(({ id, name, type, datetime, description }) => ({
      id,
      name,
      type,
      datetime,
      description
    })),
    evidence: activeCase.evidence.map(({ id, title, type, confidence, chainOfCustody, linkedSuspectId, linkedLocationId }) => ({
      id,
      title,
      type,
      confidence,
      chainOfCustody,
      linkedSuspectId,
      linkedLocationId
    })),
    relationships: activeCase.relationships
  }

  let response
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-5',
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: JSON.stringify(payload) }]
      })
    })
  } catch (networkErr) {
    throw new Error('Network/CORS error reaching the Anthropic API. Check your connection and API key.')
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`
    try {
      const body = await response.json()
      if (body?.error?.message) message = body.error.message
    } catch {
      // ignore parse failure, use default message
    }
    throw new Error(message)
  }

  const data = await response.json()
  const text = (data.content || [])
    .map((block) => block.text || '')
    .join('\n')
    .trim()
  const cleaned = text.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim()

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('The model did not return valid JSON. Try again.')
  }

  if (!parsed || !Array.isArray(parsed.insights)) {
    throw new Error('Unexpected response shape from the model.')
  }

  return parsed
}
