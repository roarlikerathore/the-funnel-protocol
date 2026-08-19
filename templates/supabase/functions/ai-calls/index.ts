// Bolna.ai reminder calling.
//
//   { action: "get_config" }                 -> settings + MASKED key (never returns the key)
//   { action: "save_config", ... }           -> stores key in admin_secrets (service role only)
//   { action: "queue_lead", email, phone, first_name }
//        -> queues one registrant. If the calling window has already opened and the event has
//           not started, they are queued for immediate dialling instead of being missed.
//   { action: "run_queue" }                  -> cron: dials everyone due
//   { action: "sync_calls" }                 -> pulls status/outcome back from Bolna
//
// The API key lives in admin_secrets, which has RLS on and no policies, so the browser's
// anon key cannot read it. site_settings is world readable and must never hold a secret.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BOLNA_BASE = 'https://api.bolna.dev'

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const sb = () => createClient(SUPABASE_URL, SERVICE_KEY)

const getSettings = async (client: any): Promise<Record<string, string>> => {
  const { data } = await client.from('site_settings').select('setting_key, setting_value')
  const m: Record<string, string> = {}
  ;(data || []).forEach((r: any) => { m[r.setting_key] = r.setting_value })
  return m
}

const setSetting = (client: any, key: string, value: string) =>
  client.from('site_settings').upsert(
    { setting_key: key, setting_value: value, updated_at: new Date().toISOString() },
    { onConflict: 'setting_key' },
  )

const getSecret = async (client: any, key: string): Promise<string> => {
  const { data } = await client.from('admin_secrets').select('value').eq('key', key).maybeSingle()
  return data?.value || ''
}

const eventStartIST = (s: Record<string, string>) =>
  new Date(`${s.mhp_event_date || '2026-05-01'}T${s.mhp_event_time || '20:00'}:00+05:30`)

/** Normalise to E.164 using the configured default country code. */
const toE164 = (phone: string, cc: string) => {
  const digits = (phone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length > 10) return `+${digits}`
  return `${cc || '+91'}${digits}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const client = sb()
    const s = await getSettings(client)

    if (body.action === 'get_config') {
      const key = await getSecret(client, 'bolna_api_key')
      return json({
        ok: true,
        configured: !!key,
        api_key_masked: key ? `${'•'.repeat(Math.max(0, key.length - 4))}${key.slice(-4)}` : '',
        agent_id: s.bolna_agent_id || '',
        enabled: s.bolna_enabled === 'true',
        auto_call_new_leads: s.bolna_auto_call_new_leads !== 'false',
        lead_time_minutes: Number(s.bolna_lead_time_minutes || 30),
        number_pool_id: s.bolna_number_pool_id || '',
        default_country_code: s.bolna_default_country_code || '+91',
        event_start: eventStartIST(s).toISOString(),
      })
    }

    if (body.action === 'save_config') {
      if (typeof body.api_key === 'string' && body.api_key.trim() && !body.api_key.includes('•')) {
        await client.from('admin_secrets').upsert(
          { key: 'bolna_api_key', value: body.api_key.trim(), updated_at: new Date().toISOString() },
          { onConflict: 'key' },
        )
      }
      const pairs: [string, string][] = [
        ['bolna_agent_id', String(body.agent_id ?? s.bolna_agent_id ?? '')],
        ['bolna_enabled', String(body.enabled ?? (s.bolna_enabled === 'true'))],
        ['bolna_auto_call_new_leads', String(body.auto_call_new_leads ?? true)],
        ['bolna_lead_time_minutes', String(body.lead_time_minutes ?? 30)],
        ['bolna_number_pool_id', String(body.number_pool_id ?? '')],
        ['bolna_default_country_code', String(body.default_country_code ?? '+91')],
      ]
      await Promise.all(pairs.map(([k, v]) => setSetting(client, k, v)))
      return json({ ok: true })
    }

    if (body.action === 'queue_lead') {
      if (s.bolna_enabled !== 'true' || s.bolna_auto_call_new_leads === 'false') {
        return json({ ok: true, skipped: 'auto calling off' })
      }
      const start = eventStartIST(s)
      const now = new Date()
      if (now >= start) return json({ ok: true, skipped: 'event already started' })

      const lead = Number(s.bolna_lead_time_minutes || 30)
      const windowOpens = new Date(start.getTime() - lead * 60_000)
      // Registered after dialling began? Queue for right now, not for a time in the past.
      const scheduledAt = now > windowOpens ? now : windowOpens

      const phone = toE164(String(body.phone || ''), s.bolna_default_country_code || '+91')
      if (!phone) return json({ ok: false, reason: 'no phone' })

      const campaign = `mhp_${s.mhp_event_date}`
      const { error } = await client.from('call_logs').insert({
        email: String(body.email || '').toLowerCase() || null,
        phone,
        first_name: body.first_name || null,
        purpose: 'reminder',
        status: 'queued',
        scheduled_at: scheduledAt.toISOString(),
        campaign,
      })
      // Unique index means a duplicate is a no-op, not an error worth surfacing
      if (error && !`${error.message}`.includes('duplicate')) {
        return json({ ok: false, reason: error.message })
      }
      return json({ ok: true, scheduled_at: scheduledAt.toISOString() })
    }

    if (body.action === 'run_queue') {
      const apiKey = await getSecret(client, 'bolna_api_key')
      const agentId = s.bolna_agent_id || ''
      if (s.bolna_enabled !== 'true') return json({ ok: true, skipped: 'calling disabled' })
      if (!apiKey || !agentId) return json({ ok: false, reason: 'bolna api key or agent id missing' })

      const start = eventStartIST(s)
      if (new Date() >= start) return json({ ok: true, skipped: 'event started, no more reminder calls' })

      const { data: due } = await client.from('call_logs')
        .select('id, phone, first_name, email')
        .eq('status', 'queued')
        .lte('scheduled_at', new Date().toISOString())
        .limit(100)

      const results: any[] = []
      for (const row of due || []) {
        try {
          const res = await fetch(`${BOLNA_BASE}/call`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agent_id: agentId,
              recipient_phone_number: row.phone,
              ...(s.bolna_number_pool_id ? { from_phone_number_pool_id: s.bolna_number_pool_id } : {}),
              user_data: { first_name: row.first_name || 'there', variables: { first_name: row.first_name || 'there' } },
            }),
          })
          const data = await res.json().catch(() => ({}))
          await client.from('call_logs').update({
            status: res.ok ? 'dialled' : 'failed',
            provider_id: data?.call_id || data?.execution_id || null,
            error: res.ok ? null : JSON.stringify(data),
          }).eq('id', row.id)
          results.push({ id: row.id, ok: res.ok })
        } catch (e) {
          await client.from('call_logs').update({ status: 'failed', error: String(e) }).eq('id', row.id)
          results.push({ id: row.id, ok: false })
        }
      }
      return json({ ok: true, dialled: results.length, results })
    }

    if (body.action === 'sync_calls') {
      const apiKey = await getSecret(client, 'bolna_api_key')
      if (!apiKey) return json({ ok: false, reason: 'bolna api key missing' })

      const { data: pending } = await client.from('call_logs')
        .select('id, provider_id').eq('status', 'dialled').not('provider_id', 'is', null).limit(100)

      let updated = 0
      for (const row of pending || []) {
        const res = await fetch(`${BOLNA_BASE}/executions/${row.provider_id}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        if (!res.ok) continue
        const d = await res.json().catch(() => ({}))
        const st = String(d?.status || '').toLowerCase()
        const mapped = st.includes('complet') ? 'answered'
          : st.includes('busy') || st.includes('no-answer') || st.includes('noanswer') ? 'no_answer'
          : st.includes('fail') || st.includes('error') ? 'failed'
          : 'dialled'
        if (mapped === 'dialled') continue
        await client.from('call_logs').update({
          status: mapped,
          duration_seconds: d?.conversation_duration ?? d?.duration ?? null,
          transcript: d?.transcript ? String(d.transcript).slice(0, 5000) : null,
        }).eq('id', row.id)
        updated++
      }
      return json({ ok: true, updated })
    }

    return json({ ok: false, reason: 'unknown action' }, 400)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
