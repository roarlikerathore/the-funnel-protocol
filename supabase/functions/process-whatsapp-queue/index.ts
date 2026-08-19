// Cron worker: sends every queued WhatsApp message whose moment has arrived.
//
// Mirrors the email worker deliberately. Same table shape, same retry policy, same
// idempotency, so anyone who understands one understands both.
//
// THE RULE THAT BREAKS BUILDS IF IGNORED: WhatsApp does not let a business start a
// conversation with free text. Anything outside a 24 hour window after the person's
// own last message must be a template Meta approved in advance. Rows whose template
// is not yet approved are SKIPPED, never failed, so a pending approval never fills
// the queue with errors.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BATCH = 25
const MAX_ATTEMPTS = 5

const WA_TOKEN = Deno.env.get('WHATSAPP_TOKEN') || ''
const WA_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || ''
const BSP_ENDPOINT = Deno.env.get('WHATSAPP_BSP_ENDPOINT') || ''
const BSP_KEY = Deno.env.get('WHATSAPP_BSP_KEY') || ''

interface SendResult { ok: boolean; id: string | null; error?: unknown }

/** Meta's own Cloud API. */
const viaCloudApi = async (to: string, templateName: string, params: string[]): Promise<SendResult> => {
  if (!WA_TOKEN || !WA_PHONE_ID) return { ok: false, id: null, error: 'WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set' }
  const res = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: params.length
          ? [{ type: 'body', parameters: params.map((t) => ({ type: 'text', text: t })) }]
          : undefined,
      },
    }),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, id: data?.messages?.[0]?.id ?? null, error: res.ok ? undefined : data }
}

/** Any reseller (AiSensy, Interakt, Wati and similar) behind one endpoint plus a key. */
const viaBsp = async (to: string, templateName: string, params: string[], body: string): Promise<SendResult> => {
  if (!BSP_ENDPOINT) return { ok: false, id: null, error: 'WHATSAPP_BSP_ENDPOINT not set' }
  const res = await fetch(BSP_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(BSP_KEY ? { Authorization: `Bearer ${BSP_KEY}` } : {}) },
    body: JSON.stringify({ to, template: templateName, params, body }),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, id: data?.id ?? data?.messageId ?? null, error: res.ok ? undefined : data }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const sb = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data: rows } = await sb.from('site_settings').select('setting_key, setting_value')
  const s: Record<string, string> = {}
  ;(rows || []).forEach((r: any) => { s[r.setting_key] = r.setting_value })

  if (s.whatsapp_enabled !== 'true') {
    return new Response(JSON.stringify({ skipped: 'whatsapp disabled' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const provider = (s.whatsapp_provider || 'none').toLowerCase()
  if (provider === 'none') {
    return new Response(JSON.stringify({ skipped: 'no provider configured' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: due, error } = await sb
    .from('whatsapp_queue')
    .select('id, template_key, to_phone, to_name, body_snapshot, attempts, metadata')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .lt('attempts', MAX_ATTEMPTS)
    .order('scheduled_at', { ascending: true })
    .limit(BATCH)

  if (error) {
    return new Response(JSON.stringify({ error }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const results: unknown[] = []
  for (const row of due || []) {
    try {
      const { data: tpl } = await sb.from('whatsapp_templates')
        .select('approval_status, provider_template_name')
        .eq('template_key', row.template_key).maybeSingle()

      // Not approved yet is a wait, not a failure. Leave it pending and move on.
      if (!tpl || tpl.approval_status !== 'approved') {
        results.push({ id: row.id, skipped: 'template not approved' })
        continue
      }

      const name = tpl.provider_template_name || row.template_key
      const params: string[] = row.metadata?.params ?? [row.to_name || '']
      const res = provider === 'cloud_api'
        ? await viaCloudApi(row.to_phone, name, params)
        : await viaBsp(row.to_phone, name, params, row.body_snapshot || '')

      const attempts = (row.attempts || 0) + 1
      await sb.from('whatsapp_queue').update({
        status: res.ok ? 'sent' : attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
        attempts,
        provider_id: res.id,
        last_error: res.ok ? null : JSON.stringify(res.error).slice(0, 800),
        sent_at: res.ok ? new Date().toISOString() : null,
      }).eq('id', row.id)

      await sb.from('whatsapp_logs').insert({
        queue_id: row.id, to_phone: row.to_phone, template_key: row.template_key,
        status: res.ok ? 'sent' : 'failed', provider_id: res.id,
        error: res.ok ? null : JSON.stringify(res.error).slice(0, 800),
      })

      results.push({ id: row.id, ok: res.ok })
    } catch (e) {
      const attempts = (row.attempts || 0) + 1
      await sb.from('whatsapp_queue').update({
        status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
        attempts, last_error: String(e).slice(0, 800),
      }).eq('id', row.id)
      results.push({ id: row.id, ok: false, error: String(e) })
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
