import { useEffect, useState } from 'react'
import { funnel } from '@/funnel.config'
import { getStoredLead } from '@/lib/lead'
import { getSiteConfig } from '@/lib/settings'
import Footer from '@/components/Footer'

/**
 * Gated replay. The gate is a soft one on purpose: it keeps the page out of
 * search results and off social, which is all a replay window actually needs.
 * Anything genuinely paid belongs behind a real login, not this.
 */
export default function Replay({ day }: { day: number }) {
  const [url, setUrl] = useState<string | null>(null)
  const [open, setOpen] = useState<boolean | null>(null)
  const lead = getStoredLead()

  useEffect(() => {
    getSiteConfig().then((c) => {
      setOpen(c.toggles?.[`/replay${day}`] ?? false)
      setUrl(c.settings?.[`replay${day}_url`] || null)
    })
  }, [day])

  if (open === null) return <div className="min-h-screen bg-[hsl(var(--background))]" />

  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <section className="flex-1 px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-sm uppercase tracking-wider text-[hsl(var(--accent))]">
            Session {day}
          </p>
          <h1 className="mb-8 text-2xl md:text-3xl font-bold">
            {funnel.sessions.find((s) => s.day === day)?.title ?? `Session ${day}`}
          </h1>

          {!open || !url ? (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center">
              <p className="mb-2 font-semibold">This replay is not open</p>
              <p className="text-[hsl(var(--muted))]">
                Replays open for a limited window after each session. Watch your email.
              </p>
            </div>
          ) : !lead ? (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center">
              <p className="mb-4 text-[hsl(var(--muted))]">Replays are for registrants.</p>
              <a href="/" className="inline-block rounded-lg bg-[hsl(var(--accent))] px-6 py-3
                                     font-semibold text-[hsl(var(--background))]">
                Register to watch
              </a>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))]"
                 style={{ aspectRatio: '16 / 9' }}>
              <iframe src={url} title={`Session ${day} replay`} allowFullScreen
                      className="h-full w-full" style={{ border: 0 }} />
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}
