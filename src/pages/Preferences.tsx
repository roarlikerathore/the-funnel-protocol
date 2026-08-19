import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import Footer from '@/components/Footer'

/**
 * Unsubscribe and preferences. Legally required in most markets, and the link in
 * every email points here. It must work without a login: someone who wants out
 * should never have to remember a password to leave.
 */
export default function Preferences() {
  const params = new URLSearchParams(window.location.search)
  const email = (params.get('e') || '').toLowerCase()
  const wantsOut = params.get('unsub') === '1'

  const [prefs, setPrefs] = useState({ unsubscribed: false, event_emails: true, nurture_emails: true })
  const [state, setState] = useState<'loading' | 'ready' | 'saved' | 'error'>('loading')

  useEffect(() => {
    if (!email) return setState('error')
    supabase.from('email_preferences').select('*').eq('email', email).maybeSingle()
      .then(({ data }) => {
        const next = { ...prefs, ...(data || {}), ...(wantsOut ? { unsubscribed: true } : {}) }
        setPrefs(next)
        setState('ready')
        // Arriving via the unsubscribe link should take effect immediately, not
        // after the person finds and presses a second button.
        if (wantsOut) save(next)
      })
  }, [email])

  const save = async (next = prefs) => {
    const { error } = await supabase.from('email_preferences')
      .upsert({ email, ...next, updated_at: new Date().toISOString() }, { onConflict: 'email' })
    setState(error ? 'error' : 'saved')
  }

  if (!email || state === 'error') return (
    <Shell><p className="text-[hsl(var(--muted))]">
      We could not find that address. Use the link from one of our emails, or write to us.
    </p></Shell>
  )
  if (state === 'loading') return <Shell><p className="text-[hsl(var(--muted))]">Loading…</p></Shell>

  return (
    <Shell>
      <p className="mb-8 text-[hsl(var(--muted))]">{email}</p>

      <div className="space-y-3">
        {([
          ['unsubscribed', 'Unsubscribe from everything', 'You will stop hearing from us entirely.'],
          ['event_emails', 'Event emails', 'Joining links, reminders and follow ups.'],
          ['nurture_emails', 'Everything else', 'Occasional emails between events.'],
        ] as const).map(([key, label, help]) => (
          <label key={key} className="flex cursor-pointer gap-3 rounded-lg border
                                      border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <input type="checkbox" className="mt-1"
              checked={key === 'unsubscribed' ? prefs.unsubscribed : prefs[key] && !prefs.unsubscribed}
              disabled={key !== 'unsubscribed' && prefs.unsubscribed}
              onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })} />
            <span>
              <span className="block font-semibold">{label}</span>
              <span className="text-sm text-[hsl(var(--muted))]">{help}</span>
            </span>
          </label>
        ))}
      </div>

      <button onClick={() => save()}
        className="mt-6 w-full rounded-lg bg-[hsl(var(--accent))] px-6 py-3 font-semibold
                   text-[hsl(var(--background))] transition hover:opacity-90">
        Save preferences
      </button>

      {state === 'saved' && (
        <p className="mt-4 text-center text-[hsl(var(--success))]">
          Saved. {prefs.unsubscribed ? 'You will not hear from us again.' : ''}
        </p>
      )}
    </Shell>
  )
}

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
    <section className="flex-1 px-4 py-16">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-2xl font-bold">Email preferences</h1>
        {children}
      </div>
    </section>
    <Footer />
  </div>
)
