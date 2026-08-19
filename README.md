# The Funnel Protocol

A complete webinar / event / seminar funnel, rebuilt for any niche in about 15 minutes,
by someone who has never written a line of code.

It is a funnel proven on live traffic, with every niche-specific word pulled out into a
single config file. You answer questions, Claude writes the config, the funnel appears.

## Why it is built this way

Lovable charges credits per prompt. Building a funnel this size inside Lovable costs
hundreds of credits and a week of arguing with it. So Lovable does almost nothing here:

| Step | Who does it | Cost |
|---|---|---|
| Create the empty project + backend | Lovable | **1-2 credits** |
| Build all 15 pages, 10 functions, 16 tables, 9 emails | Claude Code, via GitHub | 0 credits |
| Host it and serve the domain | Lovable | 0 credits |

Lovable is a host with a database attached. GitHub is where the work happens.
Claude edits GitHub, Lovable notices and redeploys itself. That is the whole trick.

## How to run it

Open **`RUN-THIS.md`**. It contains two prompts, one for each app. Nothing else
is required of you.

1. Paste 1 → Lovable. Creates an empty project with a database.
2. Click GitHub. Copy the URL.
3. Paste 2 → Claude Code. It interviews you and builds everything.
4. Paste the SQL file Claude gives you back into Lovable. Done.

The longer walkthrough, with what each screen should look like, is in `tutorial/`.

Full walkthrough: `tutorial/tutorial.html`
How the repos stay separate: `REPO-MODEL.md`

## What you end up with

- Landing page, registration popup with a 3-step qualifier, upsell, downsell,
  3 thank-you pages, 3 replay pages, closed page, legal pages, admin control room
- 9 personalised emails that adapt to who registered and what they bought
- WhatsApp reminders on the same schedule, provider-agnostic
- AI reminder calls before you go live, off unless you switch them on
- Meta Pixel with advanced matching, scroll depth and click tracking
- Countdown timers, affiliate and referral tracking
- A webhook seam for your own back office, built and left disconnected
- Your own copy, your own colours, your own offer

## What you still have to bring

Nobody can generate these for you. The brief asks for them:

- A domain
- A Zoom (or similar) webinar link
- A Meta Pixel ID
- A Resend account for email (free tier is enough to start)
- Your payment links
- Your actual offer and your actual story
