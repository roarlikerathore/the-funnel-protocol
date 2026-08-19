import { funnel } from '@/funnel.config'
import Countdown from '@/components/Countdown'

const dateLabel = () => {
  const d = new Date(`${funnel.event.startDate}T00:00:00`)
  const end = new Date(d); end.setDate(d.getDate() + funnel.event.days - 1)
  const f = (x: Date) => x.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
  return funnel.event.days > 1 ? `${f(d)} – ${f(end)}` : f(d)
}

const timeLabel = () => {
  const [h, m] = funnel.event.startTime.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = ((h + 11) % 12) + 1
  return m ? `${h12}:${String(m).padStart(2, '0')} ${ampm}` : `${h12} ${ampm}`
}

export default function Hero({ onRegister }: { onRegister: () => void }) {
  return (
    <section className="px-4 pt-14 pb-16 md:pt-20 md:pb-24">
      <div className="mx-auto max-w-3xl text-center">
        {funnel.event.isFree && (
          <p className="mb-5 inline-block rounded-full border border-[hsl(var(--accent)/0.4)]
                        bg-[hsl(var(--accent)/0.1)] px-4 py-1.5 text-xs font-semibold uppercase
                        tracking-wider text-[hsl(var(--accent))]">
            Free · {funnel.event.days} nights live
          </p>
        )}

        <h1 className="mb-5 text-3xl md:text-5xl font-bold leading-[1.1] text-balance">
          {funnel.promise.headline}
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-lg md:text-xl text-[hsl(var(--muted))] leading-relaxed">
          {funnel.promise.subheadline}
        </p>

        {/* Four facts, answered before they are asked. Removing the small
            unknowns is most of what stops someone registering. */}
        <div className="mx-auto mb-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Date', dateLabel()],
            ['Time', timeLabel()],
            ['Language', funnel.event.language || 'English'],
            ['Length', `${Math.round(funnel.event.durationMinutes / 60)} hrs`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[hsl(var(--border))]
                                        bg-[hsl(var(--card))] px-3 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider
                              text-[hsl(var(--muted))]">{label}</div>
              <div className="mt-0.5 font-bold leading-tight">{value}</div>
            </div>
          ))}
        </div>

        <div className="mb-8"><Countdown /></div>

        <button onClick={onRegister}
          className="w-full sm:w-auto rounded-xl bg-[hsl(var(--accent))] px-9 py-4 text-lg font-bold
                     text-[hsl(var(--background))] transition hover:opacity-90">
          Save my free seat
        </button>

        {funnel.sections.urgencyLine && (
          <p className="mt-4 text-sm font-semibold text-[hsl(var(--accent))]">
            {funnel.sections.urgencyLine}
          </p>
        )}
        <p className="mt-2 text-sm text-[hsl(var(--muted))]">
          Live on {funnel.event.platform}
        </p>
      </div>
    </section>
  )
}
