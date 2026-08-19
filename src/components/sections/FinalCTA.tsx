import { funnel } from '@/funnel.config'
import Countdown from '@/components/Countdown'

export default function FinalCTA({ onRegister }: { onRegister: () => void }) {
  return (
    <section className="border-t border-[hsl(var(--border))] px-4 py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="mb-4 text-2xl md:text-4xl font-bold leading-tight text-balance">
          {funnel.promise.bigIdea}
        </h2>
        <p className="mb-8 text-[hsl(var(--muted))] text-lg">
          {funnel.event.days} nights. {Math.round(funnel.event.durationMinutes / 60)} hours each.
          {funnel.event.isFree ? ' Free.' : ''}
        </p>

        <div className="mb-8"><Countdown /></div>

        <button onClick={onRegister}
          className="w-full sm:w-auto rounded-xl bg-[hsl(var(--accent))] px-9 py-4 text-lg font-bold
                     text-[hsl(var(--background))] transition hover:opacity-90">
          Save my seat
        </button>
      </div>
    </section>
  )
}
