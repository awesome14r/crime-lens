// Case timestamps are stored as 'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM'.
// Safari/older engines don't reliably parse the space-separated form,
// so normalize to ISO ('T' separator) before handing off to Date.
export function parseCaseDate(value) {
  if (!value) return null
  // Date-only strings ('2026-03-04') parse as UTC midnight, while
  // 'date time' strings parse as local time — that mismatch can shift
  // date-only events a day earlier for negative-UTC timezones. Anchoring
  // date-only values to local noon keeps them aligned with same-day
  // datetime entries for the scrubber's relative ordering.
  const iso = value.includes(' ') ? value.replace(' ', 'T') : `${value}T12:00:00`
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatCaseDate(timestamp) {
  const d = new Date(timestamp)
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Earliest/latest moment across a case's timeline + location events,
// used to bound the temporal scrubber.
export function getCaseDateRange(activeCase) {
  const timestamps = []
  activeCase.timeline.forEach((e) => {
    const d = parseCaseDate(e.date)
    if (d) timestamps.push(d.getTime())
  })
  activeCase.locations.forEach((l) => {
    const d = parseCaseDate(l.datetime)
    if (d) timestamps.push(d.getTime())
  })
  if (!timestamps.length) {
    const now = Date.now()
    return { min: now, max: now }
  }
  return { min: Math.min(...timestamps), max: Math.max(...timestamps) }
}
