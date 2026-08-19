// Cron worker: sends every queued email whose moment has arrived.
//
// It does not know or care which provider is in use. That decision lives in
// _shared/mailer.ts, driven by site_settings.email_provider, so switching from
// Lovable's transactional email to Resend is a settings change, not a deploy.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendMail } from '../_shared/mailer.ts'
import { render, tagLinks, eventLabels, loadBlocks } from '../_shared/render.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BATCH = 25
const MAX_ATTEMPTS = 5

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const sb = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data: due, error } = await sb
    .from('email_queue')
    .select('id, template_key, to_email, to_name, subject_snapshot, html_snapshot, attempts, variant_group, sequence_key, profile, challenge, metadata')
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

  const { data: settingRows } = await sb.from('site_settings').select('setting_key, setting_value')
  const settings: Record<string, string> = {}
  ;(settingRows || []).forEach((r: any) => { settings[r.setting_key] = r.setting_value })

  // Loaded only if a variant row turns up in this batch, which is usually not the case.
  let blocks: Record<string, Record<string, string>> | null = null
  let labels: any = null

  /**
   * A variant row is a placeholder. WHICH email goes out depends on what the person
   * bought AFTER registering, so the choice is made here, at the last possible
   * moment, rather than when the row was queued.
   */
  const resolveVariant = async (row: any) => {
    const fallback = { subject: row.subject_snapshot, html: row.html_snapshot, key: row.template_key }

    const { data: conv } = await sb.from('conversions')
      .select('product').ilike('email', row.to_email)
      .order('created_at', { ascending: false }).limit(10)

    const bought = new Set((conv || []).map((c: any) => c.product))
    // Upsell outranks downsell: someone who took the bigger offer never gets the smaller email.
    const match = bought.has('upsell') ? 'upsell' : bought.has('downsell') ? 'downsell' : 'none'
    if (match === 'none') return fallback

    const { data: tpl } = await sb.from('email_templates')
      .select('template_key, subject, html, framework')
      .eq('variant_group', row.variant_group).eq('variant_match', match)
      .eq('enabled', true).maybeSingle()
    if (!tpl) return fallback

    if (!blocks) { blocks = await loadBlocks(sb); labels = eventLabels(settings) }
    const lead = { first_name: row.to_name || '', profile: row.profile, challenge: row.challenge, email: row.to_email }
    const campaign = row.metadata?.campaign || ''
    return {
      subject: render(tpl.subject, lead, blocks!, labels),
      html: tagLinks(render(tpl.html, lead, blocks!, labels), row.sequence_key || '', campaign, tpl.template_key, tpl.framework),
      key: tpl.template_key,
    }
  }

  const results: unknown[] = []
  for (const row of due || []) {
    let subject = row.subject_snapshot
    let html = row.html_snapshot
    let key = row.template_key
    try {
      if (row.variant_group) {
        const picked = await resolveVariant(row)
        subject = picked.subject; html = picked.html; key = picked.key
      }

      const res = await sendMail({
        to: row.to_email,
        subject: subject || '(no subject)',
        html: html || '',
        purpose: 'transactional',
        label: key,
        // Same queue row must never send twice, however often the cron overlaps.
        idempotencyKey: row.id,
      })

      const attempts = (row.attempts || 0) + 1
      await sb.from('email_queue').update({
        // Keep it pending for another pass unless the retry budget is spent.
        status: res.ok ? 'sent' : attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
        attempts,
        template_key: key,
        provider_id: res.id,
        last_error: res.ok ? null : JSON.stringify(res.error).slice(0, 800),
        sent_at: res.ok ? new Date().toISOString() : null,
      }).eq('id', row.id)

      await sb.from('email_logs').insert({
        queue_id: row.id, to_email: row.to_email, template_key: key, subject,
        status: res.ok ? 'sent' : 'failed', provider_id: res.id,
        error: res.ok ? null : JSON.stringify(res.error).slice(0, 800),
      })

      results.push({ id: row.id, ok: res.ok, provider: res.provider })
    } catch (e) {
      const attempts = (row.attempts || 0) + 1
      await sb.from('email_queue').update({
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
