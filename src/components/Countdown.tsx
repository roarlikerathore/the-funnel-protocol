/** Counts down to the event in the event's own timezone, not the visitor's. */
import { useEffect, useState } from 'react'
import { funnel } from '@/funnel.config'

const target = () => new Date(`${funnel.event.startDate}T${funnel.event.startTime}:00`).getTime()

export default function Countdown({ compact = false }: { compact?: boolean }) {
  const [left, setLeft] = useState(() => target() - Date.now())
  useEffect(() => {
    const t = setInterval(() => setLeft(target() - Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (left <= 0) return null
  const d = Math.floor(left / 864e5)
  const h = Math.floor((left % 864e5) / 36e5)
  const m = Math.floor((left % 36e5) / 6e4)
  const s = Math.floor((left % 6e4) / 1000)
  const units = [[d, 'days'], [h, 'hrs'], [m, 'min'], [s, 'sec']] as const

  return (
    <div className={`flex ${compact ? 'gap-2' : 'gap-3 md:gap-4'} justify-center`}>
      {units.map(([v, l]) => (
        <div key={l} className={`rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]
          ${compact ? 'px-2.5 py-1.5 min-w-[52px]' : 'px-4 py-3 min-w-[70px]'} text-center`}>
          <div className={`font-bold tabular-nums ${compact ? 'text-lg' : 'text-2xl md:text-3xl'}`}>
            {String(v).padStart(2, '0')}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted))]">{l}</div>
        </div>
      ))}
    </div>
  )
}
