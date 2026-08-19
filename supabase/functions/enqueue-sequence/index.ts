// Enqueues a personalised email sequence for one lead.
//
// STAGE AWARENESS (the core rule): every template's send time is computed from its anchor
// and offset. Anything whose time has ALREADY PASSED at the moment of registration is
// skipped, never back-fired. Someone who registers 2 days before the event therefore never
// receives the "4 days to go" email. They join the sequence at the correct stage.
//
// Body: { email, first_name, last_name?, profile?, challenge?, sequence_key? }
// sequence_key defaults to event_first, or event_returning when the email already exists.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { render, tagLinks, eventLabels, loadBlocks } from '../_shared/render.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// Site URL comes from site_settings.site_url.

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

/** Grace window: a template due within the last 5 minutes still counts as sendable. */
const GRACE_MS = 5 * 60_000

interface Tpl {
  id: string; template_key: string; subject: string; html: string; preheader: string | null
  framework: string; schedule_anchor: string; offset_minutes: number
  absolute_send_at: string | null; enabled: boolean; audience: string
  variant_group: string | null; variant_match: string | null
}

const settings = async (sb: any): Promise<Record<string, string>> => {
  const { data } = await sb.from('site_settings').select('setting_key, setting_value')
  const m: Record<string, string> = {}
  ;(data || []).forEach((r: any) => { m[r.setting_key] = r.setting_value })
  return m
}

/** IST is +05:30; event date/time in site_settings are IST wall-clock. */
const istDate = (date: string, time: string) => new Date(`${date}T${(time || '20:00')}:00+05:30`)

const computeSendAt = (t: Tpl, now: Date, eventStart: Date, eventEnd: Date, deadline: Date): Date | null => {
  const off = (t.offset_minutes || 0) * 60_000
  switch (t.schedule_anchor) {
    case 'signup':      return new Date(now.getTime() + off)
    case 'event_start': return new Date(eventStart.getTime() + off)
    case 'event_end':   return new Date(eventEnd.getTime() + off)
    case 'deadline':    return new Date(deadline.getTime() + off)
    case 'absolute':    return t.absolute_send_at ? new Date(t.absolute_send_at) : null
    default:            return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const email = String(body.email || '').trim().toLowerCase()
    const firstName = String(body.first_name || '').trim()
    if (!email || !firstName) return json({ ok: false, reason: 'email and first_name required' }, 400)

    const sb = createClient(SUPABASE_URL, SERVICE_KEY)

    // Respect unsubscribes
    const { data: pref } = await sb.from('email_preferences').select('unsubscribed').eq('email', email).maybeSingle()
    if (pref?.unsubscribed) return json({ ok: true, skipped: 'unsubscribed' })

    const s = await settings(sb)
    const eventDate = s.event_date || ''
    const eventTime = s.event_time || '20:00'
    const eventStart = istDate(eventDate, eventTime)
    // A multi night event ends when the last night finishes.
    const eventEnd = new Date(eventStart.getTime() + 2 * 24 * 3600_000 + 2 * 3600_000)
    const deadline = istDate(s.replay3_deadline_date || eventDate, s.replay3_deadline_time || '23:59')
    const campaign = `mhp_${eventDate}`

    // First timer or returning?
    let seqKey = String(body.sequence_key || '')
    if (!seqKey) {
      const { count } = await sb.from('email_queue')
        .select('id', { count: 'exact', head: true })
        .eq('to_email', email)
        .in('sequence_key', ['event_first', 'event_returning'])
      seqKey = (count || 0) > 0 ? 'event_returning' : 'event_first'
    }

    const { data: seq } = await sb.from('email_sequences').select('id, enabled').eq('key', seqKey).maybeSingle()
    if (!seq || !seq.enabled) return json({ ok: false, reason: `sequence ${seqKey} missing or disabled` })

    const { data: tpls } = await sb.from('email_templates')
      .select('id, template_key, subject, html, preheader, framework, schedule_anchor, offset_minutes, absolute_send_at, enabled, audience, variant_group, variant_match')
      .eq('sequence_id', seq.id).order('sort_order')

    const blocks = await loadBlocks(sb)
    const labels = eventLabels(s)
    const lead = { first_name: firstName, profile: body.profile, challenge: body.challenge, email }
    const now = new Date()
    // How long to wait before the confirmation goes out. Long enough for the upsell and the
    // downsell to resolve, so we know which of the three variants this person should get.
    const confirmDelay = Math.max(0, Number(s.confirm_delay_minutes ?? 5) || 0)
    const queued: string[] = []
    const skippedPast: string[] = []

    for (const t of (tpls || []) as Tpl[]) {
      if (!t.enabled) continue
      // audience routing (attended / absent) is decided post-event by a separate pass
      if (t.audience && t.audience !== 'all') continue
      // Variant templates are alternatives, not separate emails. Queue ONE placeholder for the
      // group (the no purchase default) and let the worker swap in the right one at send time,
      // once the upsell and downsell have actually played out.
      if (t.variant_group && t.variant_match !== 'none') continue

      const sendAt = computeSendAt(t, now, eventStart, eventEnd, deadline)
      if (sendAt && t.variant_group) sendAt.setMinutes(sendAt.getMinutes() + confirmDelay - (t.offset_minutes || 0))
      if (!sendAt) continue

      // THE STAGE RULE: never back-fire an email whose moment has passed.
      if (sendAt.getTime() < now.getTime() - GRACE_MS) { skippedPast.push(t.template_key); continue }

      const subject = render(t.subject, lead, blocks, labels)
      const html = tagLinks(render(t.html, lead, blocks, labels), seqKey, campaign, t.template_key, t.framework)

      // Never double-queue the same template for the same person in the same campaign
      const { count: dupe } = await sb.from('email_queue')
        .select('id', { count: 'exact', head: true })
        .eq('to_email', email).eq('template_key', t.template_key).eq('status', 'pending')
      if ((dupe || 0) > 0) continue

      await sb.from('email_queue').insert({
        template_id: t.id,
        template_key: t.template_key,
        to_email: email,
        to_name: firstName,
        subject_snapshot: subject,
        html_snapshot: html,
        scheduled_at: sendAt.toISOString(),
        status: 'pending',
        sequence_key: seqKey,
        profile: body.profile || null,
        challenge: body.challenge || null,
        variant_group: t.variant_group,
        metadata: { campaign, framework: t.framework, preheader: render(t.preheader || '', lead, blocks, labels) },
      })
      queued.push(t.template_key)
    }

    return json({ ok: true, sequence: seqKey, queued, confirm_delay_minutes: confirmDelay, skipped_past_stage: skippedPast })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
