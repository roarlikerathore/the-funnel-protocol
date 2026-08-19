# The Funnel Protocol

A complete webinar / event / seminar funnel, rebuilt for any niche in about 15 minutes,
by someone who has never written a line of code.

It is the Money Heist Protocol funnel with every niche-specific word pulled out into a
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

## The six steps

1. **Lovable** — paste `prompts/01-lovable-seed.md`. Wait 2 minutes.
2. **GitHub** — click Lovable's GitHub button. One click.
3. **Claude Code** — install it, sign in, connect the same GitHub account.
4. **Claude Code** — paste `prompts/02-claude-bootstrap.md`. It makes a folder and pulls the project down.
5. **Answer the questions.** Claude interviews you, or you fill `intake/funnel-brief.md` first.
6. **Paste one SQL file** into Lovable's database editor. Done.

Full walkthrough with screenshots: `tutorial/`

## What you end up with

- Landing page, registration popup with a 3-step qualifier, upsell, downsell,
  3 thank-you pages, 3 replay pages, closed page, legal pages, admin control room
- 9 personalised emails that adapt to who registered and what they bought
- Meta Pixel with advanced matching, scroll depth and click tracking
- AI reminder calls, countdown timers, affiliate/referral tracking
- Your own copy, your own colours, your own offer

## What you still have to bring

Nobody can generate these for you. The brief asks for them:

- A domain
- A Zoom (or similar) webinar link
- A Meta Pixel ID
- A Resend account for email (free tier is enough to start)
- Your payment links
- Your actual offer and your actual story
