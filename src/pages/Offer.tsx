/**
 * Serves BOTH the upsell (/vip) and the downsell (/ip) from one component, because
 * they differ only in which config block they read. Two files would drift.
 */
import { funnel } from '@/funnel.config'
import { trackPixel, restoreIdentity } from '@/lib/pixel'
import { useEffect } from 'react'
import Footer from '@/components/Footer'

export default function Offer({ kind }: { kind: 'upsell' | 'downsell' }) {
  const offer = kind === 'upsell' ? funnel.offer.upsell : funnel.offer.downsell
  const declineTo = kind === 'upsell' && funnel.offer.downsell ? '/ip' : '/thank-you'

  useEffect(() => {
    restoreIdentity()
    if (offer) trackPixel('ViewContent', { content_name: offer.name, value: offer.price, currency: offer.currency })
  }, [offer])

  // A missing offer means the user said SKIP in the brief. Send them on rather than 404.
  if (!offer) { window.location.replace('/thank-you'); return null }

  const total = offer.items.reduce((sum, i) => {
    const n = Number(String(i.worth).replace(/[^0-9.]/g, ''))
    return sum + (isFinite(n) ? n : 0)
  }, 0)

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="bg-[hsl(var(--accent))] px-4 py-3 text-center text-sm font-semibold
                      text-[hsl(var(--background))]">
        Your seat is confirmed. One thing before you go.
      </div>

      <section className="px-4 py-12 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mb-4 text-2xl md:text-4xl font-bold leading-tight text-balance">{offer.name}</h1>

          <div className="my-8 rounded-xl border border-[hsl(var(--accent)/0.35)]
                          bg-[hsl(var(--card))] p-6 md:p-8 text-left">
            <p className="mb-5 text-center text-xs font-semibold uppercase tracking-wider
                          text-[hsl(var(--muted))]">What you get</p>
            <ul className="space-y-3">
              {offer.items.map((i) => (
                <li key={i.name} className="flex items-start justify-between gap-4
                                            border-b border-[hsl(var(--border))] pb-3 last:border-0">
                  <span className="flex gap-2.5">
                    <span className="text-[hsl(var(--accent))]" aria-hidden="true">✓</span>{i.name}
                  </span>
                  <span className="flex-none text-sm text-[hsl(var(--muted))]">{i.worth}</span>
                </li>
              ))}
            </ul>

            {total > 0 && (
              <p className="mt-6 text-center text-[hsl(var(--muted))]">
                Total value <span className="line-through">{offer.currency} {total.toLocaleString()}</span>
              </p>
            )}
            <p className="mt-2 text-center text-3xl font-bold text-[hsl(var(--accent))]">
              {offer.currency} {offer.price.toLocaleString()}
            </p>
          </div>

          <a href={offer.checkoutUrl}
            onClick={() => trackPixel('InitiateCheckout',
              { content_name: offer.name, value: offer.price, currency: offer.currency })}
            className="block w-full rounded-xl bg-[hsl(var(--accent))] px-8 py-4 text-lg font-bold
                       text-[hsl(var(--background))] transition hover:opacity-90">
            Yes, add this for {offer.currency} {offer.price.toLocaleString()}
          </a>

          <a href={declineTo}
             className="mt-5 inline-block text-sm text-[hsl(var(--muted))] underline underline-offset-4
                        hover:text-[hsl(var(--foreground))] transition">
            No thanks, continue without it
          </a>
        </div>
      </section>
      <Footer />
    </div>
  )
}
