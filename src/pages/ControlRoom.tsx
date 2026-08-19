import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { funnel } from '@/funnel.config'

/**
 * The admin dashboard. Protected by a one time code emailed to the support
 * address rather than a password, because a password on a page this obscure is
 * a password that ends up written down.
 *
 * Lazily loaded so none of this reaches a visitor's browser.
 */
type Tab = 'leads' | 'emails' | 'settings'

export default function ControlRoom() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('cr_ok') === '1')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const [tab, setTab] = useState<Tab>('leads')

  const request = async () => {
    const { error } = await supabase.functions.invoke('control-room-otp', { body: { action: 'request' } })
    setErr(error ? 'Could not send the code.' : '')
    setSent(!error)
  }
  const verify = async () => {
    const { data, error } = await supabase.functions.invoke('control-room-otp', { body: { action: 'verify', code } })
    if (error || !data?.ok) return setErr('That code is wrong or has expired.')
    sessionStorage.setItem('cr_ok', '1'); setAuthed(true)
  }

  if (!authed) return (
    <div className="grid min-h-screen place-items-center bg-[hsl(var(--background))] px-4 text-[hsl(var(--foreground))]">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-bold">Control Room</h1>
        <p className="mb-6 text-sm text-[hsl(var(--muted))]">
          A one time code goes to {funnel.brand.supportEmail}.
        </p>
        {!sent ? (
          <button onClick={request} className="w-full rounded-lg bg-[hsl(var(--accent))] px-6 py-3
                                               font-semibold text-[hsl(var(--background))]">
            Email me a code
          </button>
        ) : (
          <>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6 digit code"
              inputMode="numeric" className="mb-3 w-full rounded-lg border border-[hsl(var(--border))]
                                             bg-[hsl(var(--card))] px-4 py-3 text-center tracking-[0.4em]" />
            <button onClick={verify} className="w-full rounded-lg bg-[hsl(var(--accent))] px-6 py-3
                                                font-semibold text-[hsl(var(--background))]">
              Enter
            </button>
          </>
        )}
        {err && <p className="mt-3 text-sm text-[hsl(var(--danger))]">{err}</p>}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="border-b border-[hsl(var(--border))] px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="font-bold">{funnel.brand.name} Control Room</h1>
          <button onClick={() => { sessionStorage.removeItem('cr_ok'); setAuthed(false) }}
                  className="text-sm text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]">
            Sign out
          </button>
        </div>
      </header>

      <nav className="border-b border-[hsl(var(--border))] px-4">
        <div className="mx-auto flex max-w-5xl gap-1">
          {(['leads', 'emails', 'settings'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-semibold capitalize border-b-2 transition ${
                tab === t ? 'border-[hsl(var(--accent))] text-[hsl(var(--accent))]'
                          : 'border-transparent text-[hsl(var(--muted))]'}`}>
              {t}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {tab === 'leads' && <Leads />}
        {tab === 'emails' && <Queue />}
        {tab === 'settings' && <Settings />}
      </main>
    </div>
  )
}

function Leads() {
  const [rows, setRows] = useState<any[]>([])
  useEffect(() => {
    supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(500)
      .then(({ data }) => setRows(data || []))
  }, [])
  return (
    <>
      <p className="mb-4 text-sm text-[hsl(var(--muted))]">
        {rows.length} registration{rows.length === 1 ? '' : 's'}
      </p>
      <div className="overflow-x-auto rounded-lg border border-[hsl(var(--border))]">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--card))]">
            <tr>{['Name', 'Email', 'Phone', 'Situation', 'Challenge', 'When'].map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs uppercase
                                     tracking-wider text-[hsl(var(--muted))]">{h}</th>))}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[hsl(var(--border))]">
                <td className="px-4 py-3">{r.first_name} {r.last_name}</td>
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3">{r.phone}</td>
                <td className="px-4 py-3 text-[hsl(var(--muted))]">{r.profile}</td>
                <td className="px-4 py-3 text-[hsl(var(--muted))]">{r.challenge}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[hsl(var(--muted))]">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Queue() {
  const [rows, setRows] = useState<any[]>([])
  useEffect(() => {
    supabase.from('email_queue').select('template_key,to_email,status,scheduled_at,last_error')
      .order('scheduled_at', { ascending: false }).limit(200)
      .then(({ data }) => setRows(data || []))
  }, [])
  const counts = rows.reduce<Record<string, number>>((a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {})
  return (
    <>
      <div className="mb-5 flex gap-4 text-sm">
        {Object.entries(counts).map(([k, v]) => (
          <span key={k} className="rounded-lg border border-[hsl(var(--border))] px-3 py-1.5">
            {k} <strong className="tabular-nums">{v}</strong>
          </span>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-[hsl(var(--border))]">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--card))]"><tr>
            {['Template', 'To', 'Status', 'Scheduled', 'Error'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider
                                     text-[hsl(var(--muted))]">{h}</th>))}
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-[hsl(var(--border))]">
                <td className="px-4 py-3">{r.template_key}</td>
                <td className="px-4 py-3">{r.to_email}</td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[hsl(var(--muted))]">
                  {new Date(r.scheduled_at).toLocaleString()}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-[hsl(var(--danger))]">{r.last_error}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Settings() {
  const [rows, setRows] = useState<any[]>([])
  const [saving, setSaving] = useState('')
  useEffect(() => {
    supabase.from('site_settings').select('*').order('setting_key').then(({ data }) => setRows(data || []))
  }, [])
  const save = async (k: string, v: string) => {
    setSaving(k)
    await supabase.from('site_settings').update({ setting_value: v }).eq('setting_key', k)
    setSaving('')
  }
  return (
    <>
      <p className="mb-4 text-sm text-[hsl(var(--muted))]">
        These are public values. API keys live in your hosting dashboard's secret store, never here.
      </p>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.setting_key} className="flex items-center gap-3 rounded-lg border
                                              border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3">
            <label className="w-56 flex-none truncate text-sm font-medium">{r.setting_key}</label>
            <input defaultValue={r.setting_value} onBlur={(e) => save(r.setting_key, e.target.value)}
              className="flex-1 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))]
                         px-3 py-2 text-sm" />
            {saving === r.setting_key && <span className="text-xs text-[hsl(var(--muted))]">saving…</span>}
          </div>
        ))}
      </div>
    </>
  )
}
