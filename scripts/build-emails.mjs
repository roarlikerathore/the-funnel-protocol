/**
 * Generates the 9 email templates and the personalisation blocks as SQL.
 *
 * Takes the funnel config as JSON on stdin so there is no TypeScript import
 * machinery to go wrong:
 *
 *   cat funnel.config.json | node scripts/build-emails.mjs >> SETUP.sql
 *
 * ARCHITECTURE, and the reason this is a generator rather than 270 hand written emails:
 * each template is a shell plus four swappable blocks keyed to the two answers the
 * person gave at registration. 6 profiles x 5 challenges = 30 versions of every email
 * from one piece of writing. Writing them out by hand would be 270 emails, and every
 * later edit would be 270 edits.
 */

const cfg = JSON.parse(await new Promise((res) => {
  let d = ''; process.stdin.on('data', (c) => (d += c)); process.stdin.on('end', () => res(d))
}))

const esc = (s) => String(s).replace(/'/g, "''")
const F = "'Helvetica Neue',Helvetica,Arial,sans-serif"
const { brand, event, promise, audience, offer, theme } = cfg

const site = `https://${brand.domain}`
const accent = theme.accent
const ink = theme.mode === 'dark' ? '#F2F2F2' : '#1A1A1A'
const paper = theme.mode === 'dark' ? '#1F1F1F' : '#FFFFFF'
const outer = theme.mode === 'dark' ? '#141414' : '#F4F4F5'

const cta = (url, label) => `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto;"><tr>
<td align="center" bgcolor="${accent}" style="border-radius:8px;">
<a href="${url}" style="display:inline-block;padding:16px 34px;font-family:${F};font-weight:800;font-size:17px;color:${outer};text-decoration:none;text-transform:uppercase;letter-spacing:.5px;border-radius:8px;">${label}</a>
</td></tr></table>`

const shell = (inner) => `<div style="background:${outer};padding:24px 12px;">
<div style="max-width:600px;margin:0 auto;background:${paper};border-radius:12px;padding:28px 26px;font-family:${F};color:${ink};font-size:16px;line-height:1.7;">
${inner}
<p style="font-family:${F};font-size:11px;color:#8A8A8A;line-height:1.6;text-align:center;margin-top:34px;">
You are getting this because you registered for ${esc(event.name)}.<br>
<a href="{{PREFS_URL}}" style="color:#8A8A8A;">Email preferences</a> &middot; <a href="{{UNSUB_URL}}" style="color:#8A8A8A;">Unsubscribe</a><br>
${esc(cfg.legal.entity || brand.name)}${cfg.legal.address ? ' &middot; ' + esc(cfg.legal.address) : ''}
</p></div></div>`

const h = (t) => `<p style="font-size:22px;font-weight:800;line-height:1.25;margin:0 0 18px;">${t}</p>`
const p = (t) => `<p style="margin:0 0 16px;">${t}</p>`
const hi = (t) => `<p style="margin:0 0 16px;color:${accent};font-weight:700;">${t}</p>`
const rev = (t) => `<p style="margin:0 0 16px;font-size:18px;font-weight:800;"><u>${t}</u></p>`
const ps = (t) => `<p style="margin:22px 0 0;font-size:15px;font-style:italic;color:#8A8A8A;">${t}</p>`
const sign = () => `<p style="margin:22px 0 0;">${esc(brand.host)}</p>`
const owns = (items) => `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;background:${outer};border:1px solid ${accent};border-radius:10px;"><tr><td style="padding:20px 22px;">
<p style="margin:0 0 12px;font-family:${F};font-size:13px;font-weight:800;letter-spacing:1px;color:${accent};">UNLOCKED IN YOUR ACCOUNT</p>
${items.map((i) => `<p style="margin:0 0 9px;font-size:15px;color:${ink};"><span style="color:${accent};font-weight:800;">&#10003;</span>&nbsp;&nbsp;${esc(i.name)}</p>`).join('')}
</td></tr></table>`

const J = event.joinUrl
const CAL = cfg.links.calendar || J
const GRP = cfg.links.whatsappGroup

const twoThings = () => {
  const bits = []
  if (cfg.links.calendar) bits.push(`<a href="${CAL}" style="color:${accent};">Put the ${event.days} nights in your calendar</a>. Block it like a meeting you cannot move.`)
  if (GRP) bits.push(`<a href="${GRP}" style="color:${accent};">Join the group</a>. Reminders and links go there first.`)
  return bits.length ? p(`<strong>Do these now, they take 60 seconds:</strong><br>${bits.map((b, i) => `&nbsp;&nbsp;${i + 1}. ${b}`).join('<br>')}`) : ''
}

/* ---- the 9 templates ---------------------------------------------------- */
const emails = [
  { key: 'confirm_free', name: 'A1a Confirmation, no purchase', framework: 'story',
    anchor: 'signup', offset: 0, sort: 1, variant_group: 'confirm', variant_match: 'none',
    subject: `{{first_name}}, your seat is locked. Here is what happens next.`,
    preheader: 'Everything you need, in one email. Save this one.',
    html: shell(
      h('YOU ARE IN, {{first_name}}.') +
      p(`Your seat for ${esc(event.name)} is confirmed. Save this email, everything you need is in it.`) +
      hi('{{EVENT_RANGE}} at {{EVENT_TIME}}. {{EVENT_DURATION}} each night.') +
      p('Night one is the one that changes how you see everything after it. Miss it and the rest will not land the same way.') +
      p('{{PROFILE_MIRROR}}') + p('{{PROOF}}') +
      rev('That is exactly why this room exists.') +
      cta(J, 'Save My Joining Link') + twoThings() + p('{{CTA_LINE}}') +
      (offer.upsell ? p(`<strong>One more thing.</strong> There is no replay unless you hold ${esc(offer.upsell.name)}. If your week is the kind that falls apart, that is what protects you. <a href="${site}/vip" style="color:${accent};">See what it includes</a>.`) : '') +
      sign() + ps('P.S. Reply with one word so I know you are real: <strong>IN</strong>. I read every reply.')) },

  { key: 'confirm_upsell', name: 'A1b Confirmation, upsell buyer', framework: 'story',
    anchor: 'signup', offset: 0, sort: 1, variant_group: 'confirm', variant_match: 'upsell',
    subject: `{{first_name}}, you are in, and you are upgraded.`,
    preheader: 'Your seat and everything you just unlocked.',
    html: shell(
      h('YOU ARE IN, {{first_name}}. FRONT ROW.') +
      p(`Your seat for ${esc(event.name)} is confirmed, and you took ${esc(offer.upsell?.name || 'the upgrade')}.`) +
      hi('{{EVENT_RANGE}} at {{EVENT_TIME}}. {{EVENT_DURATION}} each night.') +
      (offer.upsell ? owns(offer.upsell.items) : '') +
      p(`Your material is here: <a href="{{VIP_ACCESS_URL}}" style="color:${accent};">open your access</a>.`) +
      p('{{PROFILE_MIRROR}}') + p('{{PROOF}}') +
      rev('You bought the front row. Now use it.') +
      cta(J, 'Save My Joining Link') + twoThings() + p('{{CTA_LINE}}') + sign() +
      ps('P.S. Replays are a safety net, not a plan. The people who get the most out of this are in the room live.')) },

  { key: 'confirm_downsell', name: 'A1c Confirmation, downsell buyer', framework: 'story',
    anchor: 'signup', offset: 0, sort: 1, variant_group: 'confirm', variant_match: 'downsell',
    subject: `{{first_name}}, your seat and your access are locked.`,
    preheader: 'Everything you need, plus what you just added.',
    html: shell(
      h('YOU ARE IN, {{first_name}}.') +
      p(`Your seat for ${esc(event.name)} is confirmed, and you picked up ${esc(offer.downsell?.name || 'the add on')}.`) +
      hi('{{EVENT_RANGE}} at {{EVENT_TIME}}. {{EVENT_DURATION}} each night.') +
      (offer.downsell ? owns(offer.downsell.items) : '') +
      p(`Your access is here: <a href="{{IP_ACCESS_URL}}" style="color:${accent};">open it</a>.`) +
      p('{{PROFILE_MIRROR}}') + p('{{PROOF}}') +
      rev('Replays are your safety net. Being in the room is the plan.') +
      cta(J, 'Save My Joining Link') + twoThings() + p('{{CTA_LINE}}') + sign() +
      ps('P.S. Whatever else moves this week, keep night one.')) },

  { key: 'reminder_2h', name: 'A2 Two hours to go', framework: 'hso',
    anchor: 'event_start', offset: -120, sort: 2,
    subject: '{{first_name}}, 2 hours. One belief is about to break.',
    preheader: 'The thing you were taught is the thing keeping you stuck.',
    html: shell(
      h('TWO HOURS, {{first_name}}.') +
      p(`Tonight at {{EVENT_TIME}}, we go live.`) +
      p('{{PAIN_TWIST}}') +
      rev('That is not a discipline problem. That is a structure problem.') +
      p('{{PROOF}}') +
      p('Most people will spend another year working on the wrong thing. Tonight is about the thing sitting underneath all of it.') +
      p('{{CTA_LINE}}') + cta(J, 'Join Tonight') +
      p('Join by {{EVENT_DOORS}}. The first fifteen minutes set up everything after them.') +
      sign() + ps('P.S. There is no replay of night one. This is the only way in.')) },

  { key: 'doors_open', name: 'A3 Doors open', framework: 'story',
    anchor: 'event_start', offset: -15, sort: 3,
    subject: 'Doors are open, {{first_name}}. Walk in.',
    preheader: 'The room is filling up. Get a good seat.',
    html: shell(
      h('THE DOORS ARE OPEN.') +
      p('{{first_name}}, the room is live. People are walking in right now.') +
      p('Fifteen minutes until we start, {{EVENT_TIME}} sharp.') +
      p('The people who show up early get the most out of these. Settled, notebook out, phone face down, before the first word.') +
      p('{{PROOF}}') + rev('Be one of those tonight.') +
      cta(J, 'Walk Into The Room') + p('{{CTA_LINE}}') + sign() +
      ps('P.S. Notebook, not your phone. You will want to write tonight.')) },

  { key: 'we_are_live', name: 'A4 We are live', framework: 'story',
    anchor: 'event_start', offset: 0, sort: 4,
    subject: '🔴 We are LIVE, {{first_name}}',
    preheader: 'It has started. The room is open right now.',
    html: shell(
      h('WE ARE LIVE.') +
      p(`{{first_name}}, night one of ${esc(event.name)} has started.`) +
      p('{{PROFILE_MIRROR}}') + p('{{PROOF}}') +
      cta(J, 'Get In Now') + p('{{CTA_LINE}}') +
      rev('No replay. No second access. This is it.') + sign() +
      ps('P.S. Two minutes late is fine. Twenty is not. Come now.')) },

  { key: 'still_open', name: 'A5 Twenty minutes in', framework: 'hso',
    anchor: 'event_start', offset: 20, sort: 5,
    subject: '{{first_name}}, the room went quiet 20 minutes ago',
    preheader: 'You can still get in. The main part has not happened yet.',
    html: shell(
      h('THE ROOM WENT QUIET.') +
      p('Twenty minutes in, {{first_name}}.') +
      p('We just took apart the belief that keeps most people stuck for years, and you could feel the room go silent.') +
      p('That silence is what happens when something people were certain about stops being true in real time.') +
      rev('You have not missed the part that matters.') +
      p('{{PAIN_TWIST}}') +
      cta(J, 'Get In Before The Rest') + p('{{CTA_LINE}}') + sign() +
      ps('P.S. Walk in now and you will still catch the part everything else is built on.')) },

  { key: 'day_after_attended', name: 'A6 Follow up, attended', framework: 'hso',
    anchor: 'event_end', offset: 30, sort: 6, audience: 'attended',
    subject: '{{first_name}}, what you saw tonight cannot be unseen',
    preheader: 'You showed up. Here is what that means.',
    html: shell(
      h('YOU SHOWED UP.') +
      p('{{first_name}}, most people who registered did not. You did.') +
      p('Here is the thing about tonight. You cannot un-know it. That does not switch off.') +
      p('{{PAIN_TWIST}}') +
      rev('That was never a you problem. It was a structure problem, and now you know what the structure looks like.') +
      p('{{CTA_LINE}}') + sign() +
      ps('P.S. Reply and tell me the one line that hit hardest. It tells me what to go deeper on.')) },

  { key: 'day_after_missed', name: 'A6b Follow up, missed it', framework: 'story',
    anchor: 'event_end', offset: 30, sort: 7, audience: 'absent',
    subject: '{{first_name}}, you missed it. Here is your second door.',
    preheader: 'No lecture. Just the way back in.',
    html: shell(
      h('YOU WERE NOT IN THE ROOM.') +
      p('{{first_name}}, I am not going to lecture you. Life happens, and I have missed things that mattered too.') +
      p('But I want you to know what actually happened, because it was not a webinar.') +
      p('The room went quiet at one point. That happens when people realise the thing they have been blaming themselves for was never their fault.') +
      p('{{PROFILE_MIRROR}}') + p('{{PROOF}}') +
      rev('Take the seat next time.') +
      cta(J, 'Get Me In Next Time') + p('{{CTA_LINE}}') + sign() +
      ps('P.S. Reply with why you could not make it. If it is timing, I want to know.')) },
]

/* ---- output ------------------------------------------------------------- */
console.log(`\n-- ${emails.length} email templates, generated by scripts/build-emails.mjs`)
console.log(`-- Each renders 30 ways from the profile and challenge the lead picked.\n`)
console.log(`DELETE FROM public.email_templates WHERE template_key IN (${emails.map((e) => `'${e.key}'`).join(', ')});\n`)

for (const e of emails) {
  console.log(`INSERT INTO public.email_templates
  (sequence_id, template_key, name, subject, preheader, html, framework, audience,
   sort_order, enabled, schedule_anchor, offset_minutes, variant_group, variant_match)
SELECT id, '${e.key}', '${esc(e.name)}', '${esc(e.subject)}', '${esc(e.preheader)}',
'${esc(e.html)}',
'${e.framework}', '${e.audience || 'all'}', ${e.sort}, true, '${e.anchor}', ${e.offset},
${e.variant_group ? `'${e.variant_group}'` : 'NULL'}, ${e.variant_match ? `'${e.variant_match}'` : 'NULL'}
FROM public.email_sequences WHERE key = 'event_first';\n`)
}

/* Personalisation blocks. Claude writes the bodies during the interview; this
   emits the rows and guarantees a 'default' exists for every token, so an
   unmatched answer degrades to something sensible instead of an empty gap. */
const TOKENS = ['PROFILE_MIRROR', 'PAIN_TWIST', 'PROOF', 'CTA_LINE']
console.log(`-- Personalisation blocks. Bodies marked NEEDS-COPY must be written before launch.`)
console.log(`DELETE FROM public.email_blocks WHERE token IN (${TOKENS.map((t) => `'${t}'`).join(', ')});\n`)

const rows = []
for (const key of audience.profiles) {
  rows.push(['PROFILE_MIRROR', key, cfg.blocks?.PROFILE_MIRROR?.[key] || 'NEEDS-COPY'])
  rows.push(['CTA_LINE', key, cfg.blocks?.CTA_LINE?.[key] || 'NEEDS-COPY'])
}
for (const key of audience.challenges) {
  rows.push(['PAIN_TWIST', key, cfg.blocks?.PAIN_TWIST?.[key] || 'NEEDS-COPY'])
  rows.push(['PROOF', key, cfg.blocks?.PROOF?.[key] || 'NEEDS-COPY'])
}
for (const t of TOKENS) rows.push([t, 'default', cfg.blocks?.[t]?.default || 'NEEDS-COPY'])

console.log('INSERT INTO public.email_blocks (token, match_key, body) VALUES')
console.log(rows.map(([t, k, b]) => `  ('${t}', '${esc(k)}', '${esc(b)}')`).join(',\n'))
console.log("ON CONFLICT (token, match_key) DO UPDATE SET body = EXCLUDED.body;\n")

const missing = rows.filter((r) => r[2] === 'NEEDS-COPY').length
if (missing) console.error(`⚠️  ${missing} of ${rows.length} personalisation blocks still say NEEDS-COPY.`)
