import React, { useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, History, Radio } from 'lucide-react'
import { useCase } from '../context/CaseContext'
import { formatCaseDate } from '../utils/date'
import { themeClasses } from '../theme'

const PLAYBACK_MS = 9000 // total time to sweep from case start to end
const TICK_MS = 80

export default function TemporalScrubber() {
  const {
    caseDateRange,
    timeCursor,
    setTimeCursor,
    timeFilterEnabled,
    setTimeFilterEnabled,
    isPlaying,
    setIsPlaying,
    theme
  } = useCase()
  const t = themeClasses(theme)
  const intervalRef = useRef(null)

  const { min, max } = caseDateRange
  const cursor = timeCursor ?? max
  const span = Math.max(1, max - min)
  const progress = Math.min(1, Math.max(0, (cursor - min) / span))

  useEffect(() => {
    if (!isPlaying) {
      clearInterval(intervalRef.current)
      return
    }
    const step = span / (PLAYBACK_MS / TICK_MS)
    intervalRef.current = setInterval(() => {
      setTimeCursor((prev) => {
        const base = prev ?? min
        const next = base + step
        if (next >= max) {
          clearInterval(intervalRef.current)
          setIsPlaying(false)
          return max
        }
        return next
      })
    }, TICK_MS)
    return () => clearInterval(intervalRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, min, max, span])

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false)
      return
    }
    if (!timeFilterEnabled || cursor >= max) {
      setTimeCursor(min)
    }
    setTimeFilterEnabled(true)
    setIsPlaying(true)
  }

  const handleSlide = (e) => {
    setIsPlaying(false)
    setTimeFilterEnabled(true)
    setTimeCursor(Number(e.target.value))
  }

  const handleReset = () => {
    setIsPlaying(false)
    setTimeFilterEnabled(false)
    setTimeCursor(max)
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-1.5 border-b ${t.border} ${t.panelAlt} shrink-0`}>
      <button
        onClick={handlePlayToggle}
        className="flex items-center justify-center h-6 w-6 rounded-full bg-signal-cyan/15 border border-signal-cyan/40 text-signal-cyan hover:bg-signal-cyan/25 transition-colors shrink-0"
        aria-label={isPlaying ? 'Pause replay' : 'Play case replay'}
      >
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
      </button>

      <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono uppercase tracking-wider text-signal-cyan">
        <History className="h-3 w-3" />
        Replay
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={Math.max(1, span / 1000)}
        value={cursor}
        onChange={handleSlide}
        className="flex-1 accent-signal-cyan h-1 cursor-pointer"
      />

      <span className={`text-[10px] font-mono w-40 text-right shrink-0 ${timeFilterEnabled ? 'text-signal-cyan' : t.textFaint}`}>
        {formatCaseDate(cursor)}
      </span>

      {timeFilterEnabled ? (
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-1 rounded border border-signal-amber/40 bg-signal-amber/10 text-signal-amber hover:bg-signal-amber/20 transition-colors shrink-0"
        >
          <RotateCcw className="h-2.5 w-2.5" />
          Full Case
        </button>
      ) : (
        <span
          className={`flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-1 rounded border border-signal-jade/40 bg-signal-jade/10 text-signal-jade shrink-0`}
        >
          <Radio className="h-2.5 w-2.5" />
          Live / Full Case
        </span>
      )}
    </div>
  )
}
