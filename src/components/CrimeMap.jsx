import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import { Flame, MapPin, Layers } from 'lucide-react'
import { useCase } from '../context/CaseContext'
import { LOCATION_TYPE_META } from '../data/mockData'
import { parseCaseDate } from '../utils/date'
import { themeClasses } from '../theme'

function pinIcon(color, dimmed, pulsing) {
  // "animate-ping" is a Tailwind built-in utility; referencing the literal
  // class name here (even inside a template string) is enough for Tailwind's
  // JIT scanner to include it in the compiled stylesheet.
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:26px;height:26px;display:flex;align-items:center;justify-content:center;opacity:${dimmed ? 0.3 : 1}">
        ${pulsing ? `<span class="animate-ping" style="position:absolute;inset:0;border-radius:9999px;background:${color};opacity:0.35;"></span>` : ''}
        <span style="position:relative;width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid rgba(11,15,25,0.9);box-shadow:0 0 10px ${color}aa;"></span>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -10]
  })
}

function HeatLayer({ points, enabled }) {
  const map = useMap()
  useEffect(() => {
    if (!enabled) return
    const layer = L.heatLayer(points, {
      radius: 34,
      blur: 28,
      maxZoom: 15,
      gradient: { 0.2: '#3fd0ff', 0.5: '#f5a623', 0.8: '#ff5470' }
    }).addTo(map)
    return () => {
      map.removeLayer(layer)
    }
  }, [map, points, enabled])
  return null
}

function FlyToCase({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 })
  }, [map, center, zoom])
  return null
}

export default function CrimeMap() {
  const { activeCase, selectedEntity, selectEntity, searchMatches, theme, timeFilterEnabled, timeCursor } = useCase()
  const [heatmapOn, setHeatmapOn] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const t = themeClasses(theme)

  const visibleLocations = activeCase.locations.filter((l) => {
    if (typeFilter !== 'all' && l.type !== typeFilter) return false
    if (timeFilterEnabled) {
      const ts = parseCaseDate(l.datetime)?.getTime()
      if (ts !== undefined && ts !== null && ts > timeCursor) return false
    }
    return true
  })

  const heatPoints = useMemo(
    () => visibleLocations.map((l) => [l.lat, l.lng, 0.8]),
    [visibleLocations]
  )

  return (
    <div className="relative z-0 h-full w-full">
      <MapContainer
        center={activeCase.mapCenter}
        zoom={activeCase.mapZoom}
        className="h-full w-full"
        zoomControl={true}
        style={{ background: '#0b0f19' }}
      >
        <FlyToCase center={activeCase.mapCenter} zoom={activeCase.mapZoom} />
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <HeatLayer points={heatPoints} enabled={heatmapOn} />

        {visibleLocations.map((l) => {
          const meta = LOCATION_TYPE_META[l.type]
          const isSelected = selectedEntity?.type === 'location' && selectedEntity?.id === l.id
          const dimmed = searchMatches ? !searchMatches.has(l.id) : false
          return (
            <Marker
              key={l.id}
              position={[l.lat, l.lng]}
              icon={pinIcon(meta.color, dimmed, isSelected)}
              eventHandlers={{ click: () => selectEntity('location', l.id) }}
            >
              <Popup>
                <div className="font-sans text-xs min-w-[180px]">
                  <div className="font-semibold text-slate-100 mb-0.5">{l.name}</div>
                  <div style={{ color: meta.color }} className="uppercase tracking-wide text-[10px] font-mono mb-1">
                    {meta.label}
                  </div>
                  <div className="text-slate-400 mb-1">{l.address}</div>
                  <div className="text-slate-500 font-mono text-[10px]">{l.datetime}</div>
                  <button
                    onClick={() => selectEntity('location', l.id)}
                    className="mt-2 w-full text-center text-[11px] font-medium rounded bg-signal-cyan/15 text-signal-cyan border border-signal-cyan/30 py-1 hover:bg-signal-cyan/25"
                  >
                    Open Inspector
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Overlay controls */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2">
        <div className={`rounded border ${t.border} ${t.panelSolid} px-3 py-2 shadow-lg`}>
          <div className={`text-[10px] font-mono uppercase tracking-wider ${t.textFaint} mb-1.5 flex items-center gap-1.5`}>
            <MapPin className="h-3 w-3" /> Layer Filter
          </div>
          <div className="flex flex-col gap-1">
            {['all', 'incident', 'evidence_drop', 'sighting'].map((key) => (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                className={`text-left text-xs px-2 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  typeFilter === key ? 'bg-signal-cyan/15 text-signal-cyan' : `${t.textMuted} ${t.hoverPanel}`
                }`}
              >
                {key !== 'all' && (
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: LOCATION_TYPE_META[key].color }}
                  />
                )}
                {key === 'all' ? 'All Layers' : LOCATION_TYPE_META[key].label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setHeatmapOn((h) => !h)}
          className={`flex items-center gap-2 rounded border px-3 py-2 text-xs font-medium transition-colors shadow-lg ${
            heatmapOn
              ? 'border-signal-crimson/40 bg-signal-crimson/15 text-signal-crimson'
              : `${t.border} ${t.panelSolid} ${t.textMuted} ${t.hoverPanel}`
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          Heatmap {heatmapOn ? 'On' : 'Off'}
        </button>
      </div>

      <div className={`absolute bottom-3 left-3 z-[400] rounded border ${t.border} ${t.panelSolid} px-3 py-2 shadow-lg flex items-center gap-3 text-[10px] font-mono`}>
        <span className={`${t.textFaint} flex items-center gap-1.5`}>
          <Layers className="h-3 w-3" /> Legend
        </span>
        {Object.entries(LOCATION_TYPE_META).map(([key, meta]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
            <span className={t.textMuted}>{meta.label}</span>
          </span>
        ))}
        {timeFilterEnabled && (
          <span className="text-signal-cyan">
            {visibleLocations.length} / {activeCase.locations.length} shown
          </span>
        )}
      </div>
    </div>
  )
}
