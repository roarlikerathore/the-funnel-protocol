import { funnel } from '@/funnel.config'
import Countdown from '@/components/Countdown'

/**
 * Why now. Seat counts are only shown when a real number is configured, because
 * a fake scarcity counter is the fastest way to lose the room's trust.
 */
export default function Urgency({ onRegister }: { onRegister: () => void }) {
  const u = funnel.sections.urgency
  if (!u) return null

  return (
    <section className="border-y border-[hsl(var(--border))] px-4 py-14">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="mb-4 text-2xl md:text-3xl font-bold text-balance">
          {u.line || 'Registration closes when the room fills'}
        </h2>

        {u.seatsTotal && (
          <p className="mb-6 text-[hsl(var(--muted))]">
            {u.seatsTotal.toLocaleString()} seats. When they are gone, they are gone.
          </p>
        )}

        <div className="mb-8"><Countdown /></div>

        <button onClick={onRegister}
          className="rounded-xl bg-[hsl(var(--accent))] px-8 py-4 font-bold
                     text-[hsl(var(--background))] transition hover:opacity-90">
          Take a seat now
        </button>
      </div>
    </section>
  )
}
