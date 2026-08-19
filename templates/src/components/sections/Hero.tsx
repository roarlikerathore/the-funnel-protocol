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

        <div className="mb-8"><Countdown /></div>

        <button onClick={onRegister}
          className="w-full sm:w-auto rounded-xl bg-[hsl(var(--accent))] px-9 py-4 text-lg font-bold
                     text-[hsl(var(--background))] transition hover:opacity-90">
          Save my free seat
        </button>

        <p className="mt-4 text-sm text-[hsl(var(--muted))]">
          {dateLabel()} · {timeLabel()} · on {funnel.event.platform}
        </p>
      </div>
    </section>
  )
}
