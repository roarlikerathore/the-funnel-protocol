# RUN THIS

Two ways in. Pick one, then never think about the other.

| | **A — Lovable + Claude** | **B — GitHub + Claude** | **C — Lovable only** |
|---|---|---|---|
| Best for | Never touched code | Want to own every piece | No Claude Code |
| Accounts | Lovable, GitHub | GitHub, Supabase, Vercel | Lovable, GitHub |
| Email | Lovable, built in | Bring your own | Lovable, built in |
| Claude Code | Required | Required | **Not needed** |
| Lovable credits | 1&ndash;2 | **zero** | ~5&ndash;10 |
| Time | ~15 min | ~20 min | ~20 min |

**Not sure?** Path A is the smoothest. **No Claude Code?** Path C.

All three end at the same funnel. The only difference is who does the typing.

---
---

# PATH A — with Lovable

## A1 — paste into Lovable

New project at **lovable.dev** → paste → wait 2 minutes.

```text
Set up a bare skeleton only. Do not design anything. Do not write any copy,
styling, images, or components beyond what is listed here. I will build the
real thing outside Lovable.

1. Enable Lovable Cloud so the project has a database and edge functions.

2. Create these routes, each rendering only an <h1> with its own name and
   nothing else:
   /  /vip  /ip  /thank-you  /thanks  /thanksalot  /preferences
   /terms  /privacy  /refund  /disclaimer  /closed
   /replay1  /replay2  /replay3  /control-room  /win

3. Leave index.css and tailwind.config.ts at their defaults.

Stop after that. Do not add features, do not improve anything, do not
suggest next steps.
```

Then: top right → **GitHub** → **Create Repository**. Copy the URL.

The page will look broken and unstyled. That is correct.

## A2 — paste into Claude Code

Put your repository URL on the `MY REPO` line. Change nothing else.

```text
Build my webinar funnel using The Funnel Protocol kit, Path A (Lovable).

MY REPO: https://github.com/PUT-YOURS-HERE/your-project

SETUP
1. Create ~/Documents/Funnels/ if needed. Clone my repo into it.
2. Clone the kit beside it:
   https://github.com/roarlikerathore/the-funnel-protocol
3. Read kit/blueprint/00-BUILD-ORDER.md in full before writing anything.
   It overrides your instincts about how to structure this.
4. Sanity check my repo: a Lovable skeleton, placeholder routes, a supabase
   folder. If it is something else, stop and tell me instead of guessing.

INTERVIEW
5. Work through kit/intake/funnel-brief.md with me. Five questions per message
   at most, plain language. If I say the brief is already filled in, read it
   and only ask about what is blank or contradictory.
6. Write src/funnel.config.ts from my answers, then STOP and show it to me.
   Build nothing until I have confirmed it.

BUILD
7. Follow the build order stage by stage. Commit in logical chunks. Push when
   a stage is finished and the build passes.
8. Generate SETUP.sql at my repo root: schema, seeds, cron, one file. Confirm
   no {{TOKEN}} survived into it.
9. Run the build. If it fails, fix it. Do not hand me a broken build.

HAND OVER
10. Give me SETUP.sql as a file and tell me where to paste it.
11. Give me STILL-NEEDED.md: every placeholder still in the funnel.
12. Give me a numbered checklist of what to verify myself, in order, with what
    a correct result looks like for each.

RULES, these matter more than speed
- Lovable only hosts. Never tell me to run a prompt there to build something.
  Every change is a file in GitHub.
- Never invent numbers, testimonials, results or credentials. No real answer
  from me means an obvious placeholder plus a line in STILL-NEEDED.md.
- Never write an API key into anything under src/.
- If a session title I give you gives away its own reveal, push back before
  building it. That kills attendance.
- Ask before anything that costs money or messages a real person.
- Finish every stage you can. Say plainly what you could not do and why.
```

## A3 — the one SQL paste

Claude hands you `SETUP.sql`. Lovable → backend → SQL editor → paste → **Run**.

Done.

---
---

# PATH B — GitHub only, no Lovable

Three free accounts, no credits, and you own every piece of it.

## B1 — make the accounts

Do these first. Five minutes, no card on any of them.

1. **github.com** — where the funnel lives
2. **supabase.com** — the database. New project, pick the region nearest your
   audience, and **save the database password it shows you once**
3. **vercel.com** — the hosting. Sign in *with GitHub*, which saves a step later

## B2 — copy the template

1. Open **github.com/roarlikerathore/the-funnel-protocol**
2. Green button → **Use this template** → **Create a new repository**
3. Name it, keep it **private**, create it
4. Copy your new repository's URL

That button makes a clean copy in your own account. It is not a fork: there is
no link back, and nothing you do can reach the original.

## B3 — paste into Claude Code

```text
Build my webinar funnel using The Funnel Protocol kit, Path B (no Lovable).

MY REPO: https://github.com/PUT-YOURS-HERE/your-project

SETUP
1. Create ~/Documents/Funnels/ if needed. Clone my repo into it.
2. Read kit/blueprint/00-BUILD-ORDER.md in full before writing anything.
   My repo already contains the kit, so there is nothing else to clone.
3. Install dependencies and confirm the project builds before changing anything.
   If it does not build clean, fix that first and tell me what was wrong.

INTERVIEW
4. Work through kit/intake/funnel-brief.md with me. Five questions per message
   at most, plain language. If I say the brief is already filled in, read it
   and only ask about what is blank or contradictory.
5. Write src/funnel.config.ts from my answers, then STOP and show it to me.
   Build nothing until I have confirmed it.

CONNECT MY OWN BACKEND
6. Walk me through Supabase one screen at a time. Tell me exactly where to
   click and what to copy. I need to give you:
   - Project URL
   - anon public key
   These two are safe in the browser and belong in .env. Nothing else does.
7. Write .env from what I give you and confirm .env is in .gitignore.
   If it is not, add it before anything is committed.
8. Anything secret goes in Supabase's own secret store, never in .env and never
   in a file. Tell me where that screen is when we reach it.
9. I am not on Lovable, so its built-in email is unavailable to me. Walk me
   through Resend instead: sign up, verify a sending subdomain, create a key.
   Then set site_settings.email_provider to 'resend'.

BUILD
10. Follow the build order stage by stage. Commit in logical chunks and push.
11. Generate SETUP.sql at my repo root. Confirm no {{TOKEN}} survived into it.
12. Run the build. If it fails, fix it. Do not hand me a broken build.

DEPLOY
13. Walk me through Vercel: import my GitHub repo, framework Vite, and the two
    environment variables from step 6. Tell me exactly what to click.
14. After it deploys, give me my live URL and check the site actually loads.

HAND OVER
15. Give me SETUP.sql and tell me where to paste it in Supabase.
16. Give me STILL-NEEDED.md: every placeholder still in the funnel.
17. Give me a numbered checklist of what to verify myself, in order, with what
    a correct result looks like for each.

RULES, these matter more than speed
- Never invent numbers, testimonials, results or credentials. No real answer
  from me means an obvious placeholder plus a line in STILL-NEEDED.md.
- Only the Supabase URL and anon key may ever reach the browser. Every other
  key lives in Supabase secrets and is read only by edge functions.
- If a session title I give you gives away its own reveal, push back before
  building it. That kills attendance.
- Ask before anything that costs money or messages a real person.
- I am not technical. When you need something from a dashboard, tell me the
  screen, the button and what to copy. Never assume I know where it is.
- Finish every stage you can. Say plainly what you could not do and why.
```

## B4 — the one SQL paste

Claude hands you `SETUP.sql`. Supabase → **SQL Editor** → **New query** → paste
→ **Run**.

Done. Your funnel is live on your Vercel URL.

### Your own domain, free
Vercel → your project → Settings → **Domains** → add it, then copy the two DNS
records it gives you into wherever you bought the domain.

---
---

# PATH C — Lovable only, no Claude Code

The template already contains every page, every email and the whole database.
Nothing has to be *built* &mdash; it only has to be *filled in*. That is one file,
which is why this costs a handful of credits instead of hundreds.

## C1 — copy the template

1. Open **github.com/roarlikerathore/the-funnel-protocol**
2. Green button &rarr; **Use this template** &rarr; **Create a new repository**
3. Name it, keep it **private**, create it

## C2 — open it in Lovable

1. **lovable.dev** &rarr; **New Project** &rarr; **Import from GitHub**
2. Pick the repository you just made
3. When it asks, **enable Lovable Cloud**. That is your database.

It will look plain and say PLACEHOLDER everywhere. That is correct &mdash; you have
the machine, not yet the content.

## C3 — fill in your funnel

Fill in every line below, then paste the whole thing. Take your time: this is the
only step where you actually write anything, and everything else reads from it.

```text
Open src/funnel.config.ts and replace the values in the `funnel` object with
mine, below. Change nothing else in the file, keep the types exactly as they
are, and do not touch any other file in the project.

BRAND
  name:            [your brand]
  host:            [how you sign an email, e.g. Priya]
  tagline:         [one line on what you teach]
  domain:          [yourdomain.com]
  supportEmail:    [your email]
  sendingSubdomain: mail.[yourdomain.com]

EVENT
  name:            [event name]
  days:            [3]
  startDate:       [2026-09-15]
  startTime:       [20:00]
  timezone:        [Asia/Kolkata]
  durationMinutes: [120]
  platform:        [Zoom]
  joinUrl:         [your join link]
  isFree:          [true]

PROMISE
  headline:    [the big claim, not a topic]
  subheadline: [one sentence under it]
  bigIdea:     [the one belief that has to change]

AUDIENCE
  forWhom:    [3 to 5 lines, one per type of person]
  notForWhom: [3 lines. Be specific, be willing to lose people]
  profiles:   [6 lines. Who they are in life]
  challenges: [5 lines. Their struggle, in their words, not yours]

SESSIONS  (one per day: title, then what they walk away with)
  1. [title] | [outcome]
  2. [title] | [outcome]
  3. [title] | [outcome]

PROOF
  credibility:  [2 to 3 sentences on why you are worth their evening]
  stats:        [label | value, one per line, or NONE]
  testimonials: [name | quote | result, one per line, or NONE]

OFFER  (write SKIP for either if you are not selling one)
  upsell:   [name] | [price] | [currency] | [checkout link]
    items:  [item | worth, one per line]
  downsell: [name] | [price] | [currency] | [checkout link]
    items:  [item | worth, one per line]

THEME
  primary: [#hex]
  accent:  [#hex]
  mode:    [dark or light]

LINKS
  whatsappGroup: [link or SKIP]
  calendar:      [link or SKIP]

TRACKING
  metaPixelId: [your pixel id or SKIP]

LEGAL
  entity:       [registered company name]
  address:      [registered address]
  jurisdiction: [city, country]
  refundPolicy: [one line]
  disclaimer:   [any disclaimer you are legally required to show]

Rules:
- Anything I marked SKIP or left blank stays as PLACEHOLDER. Do not invent it.
- When you are done, list every field still saying PLACEHOLDER so I can see
  exactly what is missing.
- Do not add features, do not redesign anything, do not touch other files.
```

## C4 — write your email personalisation

The emails adapt to whichever profile and challenge each person picked. This is
where you supply that writing. Skip it and the emails still send, but every
person gets the same generic version.

```text
Open supabase/seed-blocks.sql and fill in the block bodies below. Write them in
my voice, using the exact profile and challenge wording already in
src/funnel.config.ts. Do not change any other file.

For EACH of my 6 profiles, write PROFILE_MIRROR: two or three short lines that
describe that person's actual day back to them. No advice, no pitch. It should
read like I have watched them live.

For EACH of my 6 profiles, write CTA_LINE: one line telling that specific person
why turning up matters for them.

For EACH of my 5 challenges, write PAIN_TWIST: two or three lines naming the
struggle, then reframing it as a structural problem rather than a personal
failing.

For EACH of my 5 challenges, write PROOF: two or three lines of reasoning for
why that struggle happens. No statistics, no invented case studies, no client
results. Explanation only.

Rules:
- Plain sentences. Short lines. No exclamation marks, no hype words.
- Never invent a number, a client, or a result.
- Do not give away any session's reveal. If a session title is a question, the
  emails must not answer it.
```

## C5 — build your database

```text
Read src/funnel.config.ts, then:

1. Run scripts/build-emails.mjs to generate the email SQL.
2. Combine, in this order, into one file called SETUP.sql at the project root:
   sql/01-schema.sql, then sql/02-seeds.sql.tpl with every {{TOKEN}} replaced
   from funnel.config.ts, then the generated email SQL, then sql/03-cron.sql.tpl
   with the project URL and anon key filled in.
3. Confirm no {{TOKEN}} remains anywhere in SETUP.sql, and tell me if any does.
4. Then run SETUP.sql against my database.

Do not change any other file.
```

## C6 — check email is sending

Nothing to set up. Lovable sends your email itself, with a key it created when
you enabled Cloud. No third account, no DNS, no waiting.

```text
Send me one test email so I know the pipeline works.

1. Confirm site_settings.email_provider is set to 'lovable'.
2. Confirm the LOVABLE_API_KEY secret exists in this project.
3. Send a test email to [YOUR EMAIL] with the subject "Funnel test" using
   the shared mailer in supabase/functions/_shared/mailer.ts.
4. Tell me exactly what came back. If it failed, show me the error rather
   than describing it.

Change nothing else.
```

**Later, from your own domain.** Not needed to launch. Add your domain in
Lovable's email settings, or switch provider entirely by setting
`email_provider` to `resend` in the Control Room and adding a `RESEND_API_KEY`
secret. Nothing else in the funnel changes.

If you do move to your own domain, send from a **subdomain**
(`mail.yourdomain.com`), never the bare domain. A spam complaint then damages
the subdomain's reputation instead of the mailbox you actually read.

## C7 — check it

The same five checks at the bottom of this page. Run them in order.

---
---

# The five checks — all three paths

| | Do | Correct |
|---|---|---|
| 1 | Open `/` | Your copy and colours |
| 2 | Register with your own email | Three steps, then the upsell |
| 3 | Open the Control Room | Your test registration is listed |
| 4 | Wait five minutes | Confirmation email arrives |
| 5 | Meta Events Manager | A `Lead` event appears |

If email is the one that fails, check the scheduled jobs first:
`SELECT jobname FROM cron.job;` should return four. Without them everything
queues and nothing leaves. On Paths A and C there is no domain to verify, so
that is rarely the cause. On Path B it usually is.
