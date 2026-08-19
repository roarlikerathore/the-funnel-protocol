/** All three post-registration states. `bought` decides what is delivered vs offered. */
import { useEffect } from 'react'
import { funnel } from '@/funnel.config'
import { trackOnce, trackCustom, restoreIdentity } from '@/lib/pixel'
import { getLeadFirstName } from '@/lib/lead'
import Footer from '@/components/Footer'

export default function ThankYou({ bought }: { bought: 'none' | 'upsell' | 'downsell' }) {
  const name = getLeadFirstName()
  const offer = bought === 'upsell' ? funnel.offer.upsell
              : bought === 'downsell' ? funnel.offer.downsell : null

  useEffect(() => {
    restoreIdentity()
    if (offer) {
      // Purchase fires only on the page the provider redirects to after payment,
      // and trackOnce guards against a refresh counting the sale twice.
      trackOnce(`purchase_${bought}`, 'Purchase',
        { content_name: offer.name, value: offer.price, currency: offer.currency, num_items: 1 })
    } else {
      trackCustom('RegisteredNoPurchase', { value: 0 })
    }
  }, [bought, offer])

  const steps = [
    funnel.links.calendar && { title: 'Put it in your calendar', body: 'Block the time now. Protect it.', cta: 'Add to calendar', href: funnel.links.calendar },
    funnel.links.whatsappGroup && { title: 'Join the group', body: 'Links and reminders land there first.', cta: 'Join the group', href: funnel.links.whatsappGroup },
  ].filter(Boolean) as { title: string; body: string; cta: string; href: string }[]

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="bg-[hsl(var(--success))] px-4 py-3 text-center text-sm font-semibold text-white">
        {offer ? 'Payment received. You are all set.' : 'You are registered.'}
      </div>

      <section className="px-4 py-12 md:py-16">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-4 text-center text-3xl md:text-4xl font-bold">
            {name ? `You are in, ${name}.` : 'You are in.'}
          </h1>
          <p className="mb-10 text-center text-lg text-[hsl(var(--muted))]">
            Your email with all the details lands in about {funnel.messaging.confirmDelayMinutes} minutes.
          </p>

          {offer && (
            <div className="mb-10 rounded-xl border border-[hsl(var(--accent)/0.35)]
                            bg-[hsl(var(--card))] p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--accent))]">
                Unlocked in your account
              </p>
              <ul className="space-y-2.5">
                {offer.items.map((i) => (
                  <li key={i.name} className="flex gap-2.5">
                    <span className="text-[hsl(var(--accent))]" aria-hidden="true">✓</span>{i.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-5">
            {steps.map((s, i) => (
              <div key={s.title} className="rounded-xl border border-[hsl(var(--border))]
                                            bg-[hsl(var(--card))] p-6">
                <h2 className="mb-2 font-bold">Step {i + 1} — {s.title}</h2>
                <p className="mb-4 text-[hsl(var(--muted))]">{s.body}</p>
                <a href={s.href} target="_blank" rel="noopener noreferrer"
                   className="inline-block rounded-lg bg-[hsl(var(--accent))] px-6 py-3 font-semibold
                              text-[hsl(var(--background))] transition hover:opacity-90">
                  {s.cta}
                </a>
              </div>
            ))}

            {bought === 'none' && funnel.offer.upsell && (
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
                <h2 className="mb-2 font-bold">Still thinking about {funnel.offer.upsell.name}?</h2>
                <p className="mb-4 text-[hsl(var(--muted))]">It is available until the event starts.</p>
                <a href="/vip" className="inline-block rounded-lg border border-[hsl(var(--accent))]
                                          px-6 py-3 font-semibold text-[hsl(var(--accent))] transition
                                          hover:bg-[hsl(var(--accent)/0.1)]">
                  Take another look
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
