import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force'
import { parseCaseDate, getCaseDateRange } from './date'

export const KIND_META = {
  suspect: { color: '#ff5470', label: 'Suspect' },
  incident: { color: '#f5a623', label: 'Incident' },
  location: { color: '#2fe6a7', label: 'Location' },
  evidence: { color: '#b98bff', label: 'Evidence' }
}

// Builds the shared node/edge model for a case: entity metadata, the
// d3-force-computed layout (x/y), and a "revealTimestamp" per node used by
// the temporal scrubber to decide what's visible at a given point in time.
export function buildGraphModel(activeCase) {
  const { min: caseStart } = getCaseDateRange(activeCase)
  const rawNodes = []

  activeCase.suspects.forEach((s) =>
    rawNodes.push({
      id: s.id,
      kind: 'suspect',
      label: s.name,
      sublabel: `"${s.alias}"`,
      threatLevel: s.threatLevel,
      revealTimestamp: caseStart
    })
  )
  activeCase.locations.forEach((l) => {
    const ts = parseCaseDate(l.datetime)?.getTime() ?? caseStart
    rawNodes.push({
      id: l.id,
      kind: l.type === 'incident' ? 'incident' : 'location',
      label: l.name,
      sublabel: l.type.replace('_', ' '),
      revealTimestamp: ts
    })
  })
  activeCase.evidence.forEach((e) => {
    const loc = activeCase.locations.find((l) => l.id === e.linkedLocationId)
    const ts = loc ? parseCaseDate(loc.datetime)?.getTime() ?? caseStart : caseStart
    rawNodes.push({
      id: e.id,
      kind: 'evidence',
      label: e.title,
      sublabel: e.type,
      revealTimestamp: ts
    })
  })

  const links = activeCase.relationships.map((r, i) => ({ ...r, id: `edge-${i}` }))

  // d3-force settles an organic initial layout; consumers (ReactFlow,
  // corkboard) take over drag/zoom interactions afterward.
  const sim = forceSimulation(rawNodes.map((n) => ({ ...n })))
    .force('link', forceLink(links.map((l) => ({ ...l }))).id((d) => d.id).distance(130).strength(0.6))
    .force('charge', forceManyBody().strength(-380))
    .force('center', forceCenter(360, 260))
    .force('collide', forceCollide(70))
    .stop()

  for (let i = 0; i < 260; i++) sim.tick()

  const positioned = sim.nodes()

  const nodes = rawNodes.map((n, i) => ({
    ...n,
    x: positioned[i].x,
    y: positioned[i].y
  }))

  const edges = links.map((l) => ({
    id: l.id,
    source: l.source,
    target: l.target,
    label: l.label
  }))

  return { nodes, edges }
}

// Undirected BFS shortest path between two node ids across the full
// entity graph (suspects, locations, evidence all count as hops).
export function findShortestPath(nodes, edges, startId, endId) {
  if (startId === endId) return { path: [startId], edgeLabels: [] }

  const adjacency = new Map()
  nodes.forEach((n) => adjacency.set(n.id, []))
  edges.forEach((e) => {
    if (!adjacency.has(e.source) || !adjacency.has(e.target)) return
    adjacency.get(e.source).push({ to: e.target, label: e.label })
    adjacency.get(e.target).push({ to: e.source, label: e.label })
  })

  const visited = new Set([startId])
  const queue = [{ id: startId, path: [startId], edgeLabels: [] }]

  while (queue.length) {
    const current = queue.shift()
    if (current.id === endId) return { path: current.path, edgeLabels: current.edgeLabels }

    const neighbors = adjacency.get(current.id) || []
    for (const { to, label } of neighbors) {
      if (visited.has(to)) continue
      visited.add(to)
      queue.push({ id: to, path: [...current.path, to], edgeLabels: [...current.edgeLabels, label] })
    }
  }
  return null
}
