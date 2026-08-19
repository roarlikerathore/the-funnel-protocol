import { funnel } from '@/funnel.config'
import Footer from '@/components/Footer'

/**
 * Generic templates built from config. They cover the ordinary cases and satisfy
 * what payment providers ask for.
 *
 * They are NOT legal advice, and the config's `disclaimer` field is where any
 * regulator-specific wording belongs. If the user teaches anything touching
 * money, health or law, they should have this reviewed locally.
 */
const docs = (f: typeof funnel) => ({
  terms: {
    title: 'Terms and Conditions',
    body: [
      ['Who we are', `This site is operated by ${f.legal.entity || f.brand.name}, registered at ${f.legal.address}. Contact us at ${f.brand.supportEmail}.`],
      ['What you are registering for', `${f.event.name} is an online educational event delivered over ${f.event.days} session${f.event.days > 1 ? 's' : ''} on ${f.event.platform}. Registration reserves you a seat. It does not transfer ownership of any material shown.`],
      ['Your account and conduct', 'You agree to give accurate details when registering, and not to record, redistribute or resell any part of the sessions without written permission.'],
      ['Payment', f.offer.upsell ? `Paid upgrades are charged at the price shown at checkout. Access is granted after payment clears.` : 'This event is free to attend. No payment is taken.'],
      ['Changes', 'We may change the schedule, format or content. If the date moves, registrants are notified by email at the address they registered with.'],
      ['Limitation of liability', 'The content is educational. We are not liable for any loss arising from decisions you take after attending. Nothing here creates a professional relationship or an advisory duty.'],
      ['Governing law', `These terms are governed by the laws of ${f.legal.jurisdiction}, and disputes fall under the exclusive jurisdiction of its courts.`],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      ['What we collect', 'Your name, email address and phone number when you register, plus the two answers you give about your situation. We also record which pages you visit and where you arrived from.'],
      ['Why we collect it', 'To deliver the event you registered for, to send you reminders and related messages, and to understand which parts of the site work.'],
      ['Sharing', 'We share data with the services that run this funnel: our email provider, our database host, our webinar platform, and our advertising platforms for measurement. We do not sell your data.'],
      ['Advertising', f.tracking.metaPixelId ? 'We use the Meta Pixel to measure advertising. It may set cookies and match your activity to an advertising profile. Your browser and ad platform settings control this.' : 'We do not run advertising pixels on this site.'],
      ['Your rights', `You can ask to see, correct or delete your data at any time by writing to ${f.brand.supportEmail}. Every email carries a one-click unsubscribe link.`],
      ['Retention', 'We keep registration data while it is useful for running and improving these events, and delete it on request.'],
      ['Contact', `Questions about this policy: ${f.brand.supportEmail}.`],
    ],
  },
  refund: {
    title: 'Refund Policy',
    body: [
      ['Free registration', 'Attending the live event costs nothing, so there is nothing to refund.'],
      ['Paid upgrades', f.offer.upsell || f.offer.downsell ? f.legal.refundPolicy || 'Contact us and we will deal with it fairly.' : 'No paid products are sold through this funnel.'],
      ['How to ask', `Email ${f.brand.supportEmail} from the address you purchased with, and tell us what you bought.`],
      ['Timing', 'Approved refunds are returned to the original payment method. Your bank decides how long that takes, usually five to ten working days.'],
    ],
  },
  disclaimer: {
    title: 'Disclaimer',
    body: [
      ['Educational content only', 'Everything presented is for education. It is general information, not advice tailored to your circumstances.'],
      ['No guaranteed outcome', 'Nothing here promises a result. Any example, figure or story describes one person and is not a prediction of what you will achieve.'],
      ['Your decisions are yours', 'You are responsible for what you do with this material. Take professional advice suited to your own situation before acting.'],
      ...(f.legal.disclaimer ? [['Required notice', f.legal.disclaimer] as [string, string]] : []),
    ] as [string, string][],
  },
})

export default function Legal({ doc }: { doc: 'terms' | 'privacy' | 'refund' | 'disclaimer' }) {
  const d = docs(funnel)[doc]
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <article className="mx-auto max-w-2xl px-4 py-16">
        <a href="/" className="mb-8 inline-block text-sm text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]">&larr; Back</a>
        <h1 className="mb-2 text-3xl font-bold">{d.title}</h1>
        <p className="mb-10 text-sm text-[hsl(var(--muted))]">
          Last updated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        {d.body.map(([heading, text]) => (
          <section key={heading} className="mb-8">
            <h2 className="mb-2 text-lg font-bold">{heading}</h2>
            <p className="leading-relaxed text-[hsl(var(--muted))]">{text}</p>
          </section>
        ))}
      </article>
      <Footer />
    </div>
  )
}
