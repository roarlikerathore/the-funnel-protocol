# BUILD ORDER — read this before writing any file

You are building a webinar funnel inside the user's own repo. This file overrides
your instincts about project structure. Follow the order; each stage depends on
the one before it.

## The one architectural rule

**Every niche-specific word lives in `src/funnel.config.ts`. Nothing else.**

The original funnel this kit came from had its copy inline across 28 files. That is
why it took a week to build and could not be reused. Do not repeat that. A component
never contains the brand name, the host's name, a price, a date, or a piece of copy.
It reads them from config.

The test: changing the niche from trading to fitness should mean editing one file.
If you have to touch a component to change a word, you built it wrong.

```ts
// src/funnel.config.ts — the only file that knows what this funnel is about
export const funnel = {
  brand:    { name, host, domain, supportEmail, logo },
  event:    { name, days, startDate, startTime, timezone, duration, joinUrl },
  promise:  { headline, subheadline, bigIdea },
  audience: { forWhom: [], notForWhom: [], profiles: [], challenges: [] },
  sessions: [{ day, title, outcome }],
  proof:    { testimonials: [], stats: [] },
  offer:    { upsell: {...} | null, downsell: {...} | null },
  theme:    { primary, accent, mode, mood },
  links:    { whatsapp, calendar, replay, checkout },
  legal:    { entity, address, jurisdiction, refund, disclaimer },
}
```

## Stage 1 — Config and theme

1. Write `src/funnel.config.ts` from the brief. Every field typed, no `any`.
2. Derive CSS custom properties from `theme` into `src/index.css`.
3. Anything the user answered SKIP becomes an obvious placeholder AND a line in
   `STILL-NEEDED.md` at the repo root.

**Stop and show the user their config before continuing.** It is much cheaper to
correct a wrong headline here than after nine emails quote it.

## Stage 2 — Database

One file: `SETUP.sql` at the repo root. The user pastes it once.

Tables: `site_settings`, `page_toggles`, `page_views`, `funnel_events`,
`conversions`, `referrals`, `email_sequences`, `email_templates`, `email_blocks`,
`email_queue`, `email_logs`, `email_preferences`, `email_link_clicks`,
`whatsapp_templates`, `whatsapp_queue`, `whatsapp_logs`,
`admin_secrets`, `admin_otp`, `call_logs`.

Rules that are not negotiable:
- `site_settings` is world-readable. **A key of any kind never goes in it.**
- `admin_secrets` and `admin_otp` get RLS enabled with **no policies at all**, so
  only service-role edge functions can read them.
- Everything else gets explicit RLS policies. Never leave a table with RLS off.
- Seed `site_settings` from config so the Control Room opens already populated.

## Stage 3 — Pages

Build in this order, because later ones reuse earlier components:

| Route | Purpose |
|---|---|
| `/` | Landing. Hero, pain, stats, sessions, who it is for, who it is not for, proof, FAQ, final CTA |
| `/vip` | Upsell. Skip entirely if `offer.upsell` is null |
| `/ip` | Downsell. Skip if `offer.downsell` is null |
| `/thank-you` `/thanks` `/thanksalot` | Registered / bought downsell / bought upsell |
| `/replay1-3` | Gated replays |
| `/closed` | Registration closed |
| `/preferences` | Email preferences and unsubscribe. Legally required |
| `/terms` `/privacy` `/refund` `/disclaimer` | From `legal` |
| `/control-room` | Admin. OTP protected |

Registration is a **popup, not a page**, in three steps: qualifying gate →
profile + challenge dropdowns → contact details. The dropdowns come from
`audience.profiles` and `audience.challenges` and their values are what drive
email personalisation later, so they must match exactly.

## Stage 4 — Email engine

Nine templates. Each one is a shell plus swappable blocks, never nine hand-written
emails per audience segment.

| Key | When | Notes |
|---|---|---|
| `confirm_free` / `confirm_vip` / `confirm_ip` | signup + delay | One is chosen at SEND time from `conversions`, not at queue time |
| `reminder_2h` | start − 2h | |
| `doors_open_15` | start − 15m | |
| `we_are_live` | start | |
| `still_open_20` | start + 20m | |
| `same_day_thankyou` / `same_day_missed` | end + 30m | Attended vs absent |

Four blocks, keyed to what the person picked: `PROFILE_MIRROR`, `PAIN_TWIST`,
`PROOF`, `CTA_LINE`. With 6 profiles × 5 challenges that is 30 versions per email
from one template.

Two rules that matter more than the copy:

1. **Stage awareness.** Compute every send time at enqueue. If it has already
   passed, skip it — never back-fire. Someone registering two hours before the
   event must not receive "4 days to go".
2. **Provider is a setting, never a hardcoded API.** `site_settings.email_provider`
   selects between `lovable` (the default: no signup, no DNS, works the moment
   Cloud is enabled), `resend`, and `builtin`. On Lovable, do NOT send the user
   off to create a third-party email account before they can test a send.
3. **Never send from the root domain** once they do move to their own provider.
   Bulk mail goes from a subdomain (`mail.theirdomain.com`), reply-to points at
   their real inbox. Explain why: a spam complaint should not poison the domain
   their actual mail comes from.

## Stage 5 — WhatsApp

For most audiences outside the US this outperforms email, so build it even if the
user has no provider yet. The functionality ships; the connector is a setting.

Mirror the email engine rather than inventing a second architecture:

| Email | WhatsApp |
|---|---|
| `email_queue` | `whatsapp_queue` |
| `email_templates` | `whatsapp_templates` |
| `process-email-queue` | `process-whatsapp-queue` |
| `site_settings.email_provider` | `site_settings.whatsapp_provider` |

Provider is a **setting, never a hardcoded API**. Ship three adapters behind one
interface — `cloud_api` (Meta direct), `bsp` (AiSensy, Interakt, Wati and similar,
all of which take a token plus an endpoint), and `backoffice` (see stage 9). Adding
a fourth must never mean touching a page or a queue.

Messages, keyed to the same moments the emails use: confirmation, 2 hours before,
doors open, we are live, and a post-event follow-up.

> **The rule that breaks builds if you skip it.** WhatsApp does not let a business
> start a conversation with free text. Anything sent outside a 24 hour window after
> the user's own last message must be a **template approved in advance by Meta**,
> and approval takes hours to days. So: write the templates, submit them, and design
> the funnel to work if approval has not landed yet. Never let a WhatsApp failure
> block a registration or hold up an email.

Store consent. The registration form must carry an explicit WhatsApp opt-in, and
`whatsapp_opted_in` travels with the lead. Sending without it is illegal in several
of the markets this kit will be used in.

## Stage 6 — AI reminder calls

Optional, off by default, and worth it: a voice reminder shortly before the event
lifts attendance more than any email in the sequence.

One function, five actions: `get_config`, `save_config`, `queue_lead`, `run_queue`,
`sync_calls`. Calls land in `call_logs` with status, duration and provider id.

Settings: agent id, lead time in minutes (default **30**), country code, enabled,
auto-call new leads, number pool.

Two behaviours that are not obvious:

1. **Late registrants call immediately.** If someone registers after the calling
   window has already opened, they are queued for now, not for a moment that has
   passed. `scheduledAt = now > windowOpens ? now : windowOpens`.
2. **The API key is masked on read.** `get_config` returns the last four characters
   only. It lives in `admin_secrets`, never in `site_settings`, and the admin UI
   never receives the whole value.

> **Voice providers run content moderation, and it is stricter than you expect.**
> Scripts get rejected for words that are harmless in context: heist, steal, or
> anything reading as a financial guarantee ("without risking your own money"),
> and unverifiable superlatives ("the top 3%"). Write the call script in plain,
> literal language with none of the funnel's theatre. If the user's brand name
> itself trips it, the call says the event name instead. Warn them at the point
> they configure it, not after a rejection.

## Stage 7 — Tracking

Meta Pixel with advanced matching — hashed email, phone, name, external_id. This
is the single biggest lever on ad cost and it is free to do properly.

Standard events on real moments only: `Lead` on registration, `InitiateCheckout`
on payment click, `Purchase` on the post-payment page. Never fire `Purchase`
anywhere a refresh can repeat it — use a sessionStorage guard.

Also capture scroll depth (25/50/75/100), CTA clicks, video plays, time on page.

## Stage 8 — Edge functions

`enqueue-sequence`, `process-email-queue`, `process-whatsapp-queue`, `email-track`,
`control-room-otp`, `ai-calls`, plus the webinar registration one if their platform
has an API.

Scheduling, all in SETUP.sql so the user pastes once:

| Job | Every | Why |
|---|---|---|
| send due email | 1 min | "we are live" is worthless at minute 5 |
| send due WhatsApp | 1 min | same |
| dial the call queue | 2 min | the 30 minute window has to clear |
| pull call outcomes | 15 min | reporting only, no rush |

The confirmation message does not wait for a tick. Registration triggers it directly,
after a short delay set by `confirm_delay_minutes`, because the upsell and downsell
happen *after* the form and the message content depends on what they bought.

## Stage 9 — Back office hooks

The user's own dashboard, wherever their leads ultimately live. **Do not build an
integration.** Build the seam, leave it disconnected, and say so.

Every lead event already writes to `funnel_events`. Add one outbound webhook:

- `site_settings.backoffice_webhook_url` — empty by default, and empty means off
- Fires `lead.registered`, `lead.purchased`, `event.attended` as JSON
- Signed with a shared secret from `admin_secrets`
- Retries three times, then gives up quietly. **A dead back office must never break
  a registration.**

That is the whole stage. When the user is ready to connect something, the events are
already flowing and it is a URL in a settings field. Tell them this exists and that
it is deliberately switched off.

## Stage 10 — Hand off

1. `bun run build` must pass. Do not hand over a broken build.
2. Push everything. Lovable redeploys on its own.
3. Give the user `SETUP.sql` as a file, with the paste instructions.
4. Give them `STILL-NEEDED.md` — every placeholder still in the funnel.
5. Tell them what to verify themselves, in order, with what "correct" looks like.

---

## Rules that hold across every stage

**Never fabricate.** No invented testimonials, results, student counts, or
credentials. A placeholder the user can see is fine. A plausible lie is not, and
in most countries it is also illegal.

**Never spoiler.** If a session's value is a reveal, no page or email may give it
away. Push back if the user writes a title that does.

**Never put a secret in the browser.** Keys go in the hosting dashboard's secret
store, read only by edge functions. If you are about to write a key into a file
under `src/`, stop.

**Ask rather than assume.** When the brief is ambiguous in a way that changes the
build, one question now beats a rebuild later.

**Say what is not done.** If a stage is partly blocked, finish everything else and
state plainly what was left and why. Never report a funnel as complete while a
placeholder is still sitting in it.
