import { useEffect, useState } from 'react'
import { funnel } from '@/funnel.config'

/**
 * Follows the reader down the page. Appears only after they have scrolled past the
 * hero, because someone still reading the headline does not need a second copy of
 * the same button covering it.
 */
export default function StickyBar({ onRegister }: { onRegister: () => void }) {
  const [show, setShow] = useState(false)
  const [left, setLeft] = useState('')

  useEffect(() => {
    if (!funnel.sections.stickyBar) return
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.9)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!funnel.sections.stickyBar) return
    const target = new Date(`${funnel.event.startDate}T${funnel.event.startTime}:00`).getTime()
    const tick = () => {
      const ms = target - Date.now()
      if (ms <= 0) return setLeft('')
      const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5)
      const m = Math.floor((ms % 36e5) / 6e4), s = Math.floor((ms % 6e4) / 1000)
      setLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  if (!funnel.sections.stickyBar || !show) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[hsl(var(--border))]
                    bg-[hsl(var(--card))] px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{funnel.event.name}</p>
          {left && (
            <p className="text-xs tabular-nums text-[hsl(var(--muted))]">Starts in {left}</p>
          )}
        </div>
        <button onClick={onRegister}
          className="flex-none rounded-lg bg-[hsl(var(--accent))] px-5 py-2.5 text-sm font-bold
                     text-[hsl(var(--background))] transition hover:opacity-90">
          Save my seat
        </button>
      </div>
    </div>
  )
}
