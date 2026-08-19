# The Funnel Protocol

A complete webinar, event or seminar funnel that anyone can rebuild for their own
niche in about twenty minutes, without writing a line of code.

It is a funnel proven on live traffic, with every niche-specific word pulled out
into a single config file. You answer questions, the config gets written, the
funnel appears.

**Start here → [`RUN-THIS.md`](RUN-THIS.md)**

---

## Why it costs almost nothing to build

Lovable charges credits per prompt. Building a funnel this size *inside* Lovable
costs hundreds of credits and days of arguing with it.

Here, nothing gets built. Everything already exists — it only gets **filled in**,
and filling in means editing one file.

| | Path A | Path B | Path C |
|---|---|---|---|
| **Needs** | Lovable + Claude Code | GitHub + Supabase + Vercel + Claude Code | **Lovable only** |
| **Lovable credits** | 1&ndash;2 | zero | ~5&ndash;10 |
| **Time** | ~15 min | ~20 min | ~20 min |

No Claude Code? Take **Path C**. All three end at the same funnel.

---

## What you get

**17 pages** — landing, upsell, downsell, three thank-you states, three replays,
registration-closed, terms, privacy, refunds, disclaimer, email preferences, admin.

**17 landing sections**, each appearing only when you give it content:
hero · pain · stats · methods · sessions · before-and-after · who it is for ·
who it is not for · speaker · proof · bonuses · guarantee · FAQ · urgency · final CTA

**A 3-step registration popup** — qualify, then two questions about them, then
contact details. Those two answers drive every message they get afterwards.

**9 emails, 30 versions each.** Each person picked a situation and a struggle.
Every email answers the one *they* chose. Six situations × five struggles = 30
versions from one piece of writing, rather than 270 written by hand.

**Everything behind it** — 20 database tables, Meta Pixel with advanced matching
and scroll depth, WhatsApp reminders, AI reminder calls, webinar auto-registration,
countdown timers, referral tracking, and an admin Control Room with one-time-code
login.

---

## What is in this repo

### The app (this is your funnel)

| Path | What it is |
|---|---|
| `src/funnel.config.ts` | **The only file that knows your niche.** Everything reads from here |
| `src/theme.ts` | Two colours in, a full palette out |
| `src/App.tsx` | All 17 routes |
| `src/pages/` | 8 files serving those 17 routes |
| `src/components/sections/` | The 14 landing sections |
| `src/components/` | Registration popup, countdown, footer, banner, pixel tracker |
| `src/lib/` | Pixel, analytics, lead storage, settings cache, referrals |

### The database

| Path | What it is |
|---|---|
| `sql/01-schema.sql` | 20 tables, security rules, indexes. Same for everyone |
| `sql/02-seeds.sql.tpl` | Your settings. Filled in from your config |
| `sql/03-cron.sql.tpl` | The four scheduled jobs that actually send things |
| `supabase/seed-blocks.sql` | Where your email personalisation is written |
| `scripts/build-emails.mjs` | Generates the 9 emails from your config |

These are combined into a single `SETUP.sql` that you paste once.

### The backend

| Function | What it does |
|---|---|
| `enqueue-sequence` | Queues someone's emails when they register |
| `process-email-queue` | Sends what is due. Provider is a setting, not code |
| `process-whatsapp-queue` | Same, for WhatsApp |
| `ai-calls` | Reminder phone calls before you go live |
| `webinar-register` | Registers them on Zoom and returns their personal link |
| `email-track` | Click tracking |
| `control-room-otp` | Login code for the admin panel |

### The instructions

| Path | What it is |
|---|---|
| `RUN-THIS.md` | **All three paths. Start here** |
| `tutorial/cheat-sheet.html` | **Everything in one page.** Build, calls, traffic. Start here |
| `tutorial/quickstart.html` | Just part one, if you want it separate |
| `tutorial/part-two.html` | Just the calls, Zoom and own-domain part |
| `tutorial/path-c.html` | The same steps with the reasoning shown, plus troubleshooting |
| `kit/intake/funnel-brief.md` | Every question you will be asked |
| `kit/blueprint/00-BUILD-ORDER.md` | How it is built, for Claude Code |
| `kit/REPO-MODEL.md` | How your copy stays separate from everyone else's |

---

## The steps, short version

1. **Copy this repo.** Green **Use this template** button, top of this page.
   *(Not signed in to GitHub? The button will not appear. Sign in first.)*
2. **Open it in Lovable.** New Project → Import from GitHub → say yes to Cloud.
3. **Fill in your funnel.** One prompt, one file. Your brand, event, promise,
   audience, sessions, offer, colours.
4. **Write your email personalisation.** One prompt. This is what makes the
   emails speak to each person rather than to everyone.
5. **Build your database.** One prompt. Tables, settings, emails, scheduled jobs.
6. **Send yourself a test email.** Email works out of the box on Lovable —
   no extra account, no DNS.
7. **Add your pixel** if you are running ads. Optional.

Full version with every link and prompt: [`RUN-THIS.md`](RUN-THIS.md)

---

## What you have to bring

Nobody can generate these for you:

- A domain
- Your webinar joining link
- Your payment links, if you are selling an upgrade
- A Meta Pixel ID, if you are running ads
- **Your actual offer, your actual story, your actual results**

Anything you do not have becomes a visible `PLACEHOLDER` and a line in
`STILL-NEEDED.md`. Nothing is ever invented for you — a made-up testimonial is a
problem you cannot see and everyone else can.

---

## Three rules built into it

**Never fabricate.** No invented testimonials, results or numbers. Gaps stay
visibly empty until you fill them.

**Never spoil.** If a session's value is a reveal, no page or email gives it away.
A title like *"How X Works"* answers the question and removes the reason to show up.

**Never leak a key.** Anything secret lives in your host's secret store, readable
only by the backend. Nothing sensitive is ever in a file that reaches a browser.
