/**
 * The 3 step registration popup.
 *
 * Step 1 qualifies, step 2 captures the two answers that drive every later message,
 * step 3 takes contact details. Splitting it this way means the profile and challenge
 * are already known before the person has committed their email, so a drop-off after
 * step 2 still tells you who they were.
 *
 * Deliberately NOT built on Radix Dialog: its exit animation waits on `animationend`,
 * which never fires when the operating system has Reduce Motion enabled, and the
 * dialog gets stuck open. Plain state and a plain overlay have no such failure mode.
 */
import { useEffect, useRef, useState } from 'react'
import { funnel } from '@/funnel.config'
import { saveLead, getDeviceId } from '@/lib/lead'
import { trackPixel, identifyLead } from '@/lib/pixel'
import { supabase } from '@/integrations/supabase/client'

type Step = 'gate' | 'about' | 'contact'

export default function RegistrationDialog({
  open, onClose,
}: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<Step>('gate')
  const [profile, setProfile] = useState('')
  const [challenge, setChallenge] = useState('')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])

  useEffect(() => { if (open) trackPixel('ViewContent', { content_name: 'Registration form' }) }, [open])

  if (!open) return null

  // Picking an answer advances on its own. Asking someone to choose and THEN press
  // continue is a second decision for no information.
  const pickProfile = (v: string) => {
    setProfile(v)
    if (challenge) setTimeout(() => setStep('contact'), 220)
  }
  const pickChallenge = (v: string) => {
    setChallenge(v)
    if (profile) setTimeout(() => setStep('contact'), 220)
  }

  const complete = form.firstName.trim() && form.email.trim() && form.phone.trim()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!complete || submitting) return
    setSubmitting(true); setError('')
    const lead = {
      email: form.email.trim().toLowerCase(),
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      phone: form.phone.trim(),
      country_code: funnel.messaging.calls.countryCode,
      profile, challenge,
      visitor_id: getDeviceId(),
    }
    try {
      const { error: dbErr } = await supabase.from('leads').upsert(lead, { onConflict: 'email' })
      if (dbErr) throw dbErr

      saveLead({
        firstName: lead.first_name, lastName: lead.last_name,
        email: lead.email, whatsapp: lead.phone, profile, challenge,
      })
      identifyLead({ email: lead.email, phone: lead.phone, firstName: lead.first_name, lastName: lead.last_name })
      trackPixel('Lead', { content_name: funnel.event.name, status: 'registered' })

      // Fire and forget. A slow email queue must never hold up the redirect, and
      // the person has already been saved by this point.
      void supabase.functions.invoke('enqueue-sequence', { body: { ...lead } })

      window.location.href = funnel.offer.upsell ? '/vip' : '/thank-you'
    } catch (err) {
      setError('That did not save. Check your connection and try again.')
      setSubmitting(false)
    }
  }

  const Option = ({ v, on, sel }: { v: string; on: (s: string) => void; sel: string }) => (
    <button type="button" onClick={() => on(v)}
      className={`w-full text-left px-4 py-3 rounded-lg border transition text-[15px] leading-snug
        ${sel === v ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.1)]'
                    : 'border-[hsl(var(--border))] hover:border-[hsl(var(--accent)/0.5)]'}`}>
      {v}
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         role="dialog" aria-modal="true" aria-label={`Register for ${funnel.event.name}`}>
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div ref={panelRef} tabIndex={-1}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border
                   border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 md:p-8 shadow-2xl">

        <button type="button" onClick={onClose} aria-label="Close"
          className="absolute right-3 top-3 h-9 w-9 rounded-full text-xl leading-none
                     text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]">×</button>

        <div className="mb-5 flex gap-1.5" aria-hidden="true">
          {(['gate', 'about', 'contact'] as Step[]).map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${
              ['gate', 'about', 'contact'].indexOf(step) >= i
                ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--border))]'}`} />
          ))}
        </div>

        {step === 'gate' && (
          <>
            <h2 className="text-2xl font-bold mb-2">Before you take a seat</h2>
            <p className="text-[hsl(var(--muted))] mb-6 text-[15px]">
              {funnel.event.days} nights, {Math.round(funnel.event.durationMinutes / 60)} hours each.
              It only works if you actually turn up.
            </p>
            <div className="space-y-2.5">
              <button type="button" onClick={() => setStep('about')}
                className="w-full rounded-lg bg-[hsl(var(--accent))] px-5 py-3.5 font-semibold
                           text-[hsl(var(--background))] hover:opacity-90 transition">
                Yes, I can be there live
              </button>
              <button type="button" onClick={onClose}
                className="w-full rounded-lg border border-[hsl(var(--border))] px-5 py-3
                           text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition text-[15px]">
                Not this time
              </button>
            </div>
          </>
        )}

        {step === 'about' && (
          <>
            <h2 className="text-2xl font-bold mb-1">Tell me who I am talking to</h2>
            <p className="text-[hsl(var(--muted))] mb-5 text-[15px]">
              So the sessions and the emails speak to your situation, not a generic one.
            </p>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted))]">
              Which sounds most like you?
            </p>
            <div className="space-y-2 mb-6">
              {funnel.audience.profiles.map((v) => <Option key={v} v={v} on={pickProfile} sel={profile} />)}
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted))]">
              What is getting in your way right now?
            </p>
            <div className="space-y-2">
              {funnel.audience.challenges.map((v) => <Option key={v} v={v} on={pickChallenge} sel={challenge} />)}
            </div>
          </>
        )}

        {step === 'contact' && (
          <form onSubmit={submit}>
            <h2 className="text-2xl font-bold mb-1">Where should the link go?</h2>
            <p className="text-[hsl(var(--muted))] mb-5 text-[15px]">
              Joining details and reminders go to both.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <input required placeholder="First name" autoComplete="given-name" value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputCls} />
              <input placeholder="Last name" autoComplete="family-name" value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputCls} />
            </div>
            <input required type="email" placeholder="Email address" autoComplete="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} className={`${inputCls} mb-3`} />
            <input required type="tel" placeholder="Phone number" autoComplete="tel" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`${inputCls} mb-4`} />

            {error && <p className="mb-3 text-sm text-[hsl(var(--danger))]">{error}</p>}

            <button type="submit" disabled={!complete || submitting}
              className="w-full rounded-lg bg-[hsl(var(--accent))] px-5 py-3.5 font-semibold
                         text-[hsl(var(--background))] transition hover:opacity-90
                         disabled:opacity-40 disabled:cursor-not-allowed">
              {submitting ? 'Saving your seat…' : 'Save my seat'}
            </button>

            <p className="mt-3 text-center text-xs text-[hsl(var(--muted))]">
              We email you about this event only. Unsubscribe any time.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] ' +
  'px-4 py-3 text-[15px] outline-none focus:border-[hsl(var(--accent))]'
