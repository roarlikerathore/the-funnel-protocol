// Cron worker: picks pending emails from the custom email_queue table and sends via Resend
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { render, tagLinks, eventLabels, loadBlocks } from '../_shared/render.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
// SENDER: bulk mail goes from a subdomain, never the root domain. If a batch ever gets
// marked as spam the damage stays on the sending subdomain and the root domain keeps its
// clean reputation for the mailbox the user actually reads.
// Resolution order is secret -> site_settings.sender_email -> this default, so moving the
// sending domain again is a Control Room edit rather than a redeploy.
// The sending subdomain has no MX, so replies to it would bounce. Emails invite replies,
// so reply_to points at the real inbox.
const SENDER_EMAIL_ENV = Deno.env.get('SENDER_EMAIL') || ''
const REPLY_TO_ENV = Deno.env.get('REPLY_TO_EMAIL') || ''

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data: due, error } = await supabase
    .from('email_queue')
    .select('id, template_key, to_email, to_name, subject_snapshot, html_snapshot, attempts, variant_group, sequence_key, profile, challenge, metadata')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(25)

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const { data: settingRows } = await supabase.from('site_settings').select('setting_key, setting_value')
  const settings: Record<string, string> = {}
  ;(settingRows || []).forEach((r: any) => { settings[r.setting_key] = r.setting_value })
  const footer = settings.email_footer_html || ''
  const senderEmail = SENDER_EMAIL_ENV || settings.sender_email || ''
  const replyTo = REPLY_TO_ENV || settings.reply_to_email || ''

  // Loaded lazily: only a variant row needs them, and most batches have none.
  let blocks: Record<string, Record<string, string>> | null = null
  let labels: any = null

  /**
   * A variant row is a placeholder. Which email actually goes out depends on what the lead
   * bought AFTER registering, so the decision is made here, at the last possible moment,
   * rather than when the row was queued.
   */
  const resolveVariant = async (row: any): Promise<{ subject: string; html: string; key: string }> => {
    const fallback = { subject: row.subject_snapshot, html: row.html_snapshot, key: row.template_key }

    const { data: conv } = await supabase.from('conversions')
      .select('product').ilike('email', row.to_email)
      .order('created_at', { ascending: false }).limit(10)

    const bought = new Set((conv || []).map((c: any) => c.product))
    // VIP outranks Inner Players: someone who took the upsell never sees the downsell email.
    const match = bought.has('vip_990') ? 'vip_990' : bought.has('ip_299') ? 'ip_299' : 'none'
    if (match === 'none') return fallback

    const { data: tpl } = await supabase.from('email_templates')
      .select('template_key, subject, html, preheader, framework')
      .eq('variant_group', row.variant_group).eq('variant_match', match).eq('enabled', true).maybeSingle()
    if (!tpl) return fallback

    if (!blocks) { blocks = await loadBlocks(supabase); labels = eventLabels(settings) }
    const lead = { first_name: row.to_name || '', profile: row.profile, challenge: row.challenge, email: row.to_email }
    const campaign = row.metadata?.campaign || ''
    return {
      subject: render(tpl.subject, lead, blocks!, labels),
      html: tagLinks(render(tpl.html, lead, blocks!, labels), row.sequence_key || '', campaign, tpl.template_key, tpl.framework),
      key: tpl.template_key,
    }
  }

  const results: any[] = []
  for (const row of due || []) {
    try {
      let sendSubject = row.subject_snapshot
      let sendHtml = row.html_snapshot
      let sentKey = row.template_key
      if (row.variant_group) {
        const picked = await resolveVariant(row)
        sendSubject = picked.subject; sendHtml = picked.html; sentKey = picked.key
      }
      const finalHtml = `${sendHtml || ''}\n${footer}`
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `${settings.host_name || settings.brand_name} <${senderEmail}>`,
          reply_to: replyTo,
          to: [row.to_email],
          subject: sendSubject || '(no subject)',
          html: finalHtml,
        }),
      })
      const data = await res.json()
      const ok = res.ok && data?.id

      await supabase.from('email_queue').update({
        status: ok ? 'sent' : 'failed',
        attempts: (row.attempts || 0) + 1,
        last_error: ok ? null : JSON.stringify(data),
        provider_id: data?.id || null,
        sent_at: ok ? new Date().toISOString() : null,
        template_key: sentKey,
      }).eq('id', row.id)

      await supabase.from('email_logs').insert({
        queue_id: row.id,
        to_email: row.to_email,
        template_key: sentKey,
        subject: sendSubject,
        status: ok ? 'sent' : 'failed',
        provider_id: data?.id || null,
        error: ok ? null : JSON.stringify(data),
      })

      results.push({ id: row.id, ok })
    } catch (e) {
      await supabase.from('email_queue').update({
        status: 'failed', last_error: String(e), attempts: (row.attempts || 0) + 1,
      }).eq('id', row.id)
      results.push({ id: row.id, ok: false, error: String(e) })
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
