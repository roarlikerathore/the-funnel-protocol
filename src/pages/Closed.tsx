import { funnel } from '@/funnel.config'
import Footer from '@/components/Footer'

/** Shown once registration closes, so late traffic converts to the next round. */
export default function Closed() {
  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <section className="flex flex-1 items-center px-4 py-20">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="mb-4 text-3xl md:text-4xl font-bold">Registration is closed</h1>
          <p className="mb-8 text-lg text-[hsl(var(--muted))]">
            {funnel.event.name} has started and the room is full. Leave your email and
            you will hear about the next one before it opens publicly.
          </p>
          <a href="/" className="inline-block rounded-xl bg-[hsl(var(--accent))] px-8 py-4
                                 font-bold text-[hsl(var(--background))] transition hover:opacity-90">
            Tell me about the next one
          </a>
        </div>
      </section>
      <Footer />
    </div>
  )
}
