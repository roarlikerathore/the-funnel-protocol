# Build status

## The template builds and runs

`bun install && bun run build` passes. Entry bundle 9.8 kB gzipped; the Control
Room is lazily loaded so a visitor never downloads it.

## Three ways in, all landing at the same funnel

| Path | Needs | Lovable credits |
|---|---|---|
| A | Lovable + Claude Code | 1-2 |
| B | GitHub + Supabase + Vercel + Claude Code | zero |
| C | Lovable only, no Claude Code | ~5-10 |

Path C works because the template already contains every page and every email.
Nothing is built, only filled in, and filling in means editing one file.

## Shipping

| Area | State |
|---|---|
| `RUN-THIS.md` | All three paths, prompts ready to paste |
| `src/funnel.config.ts` | Typed schema, single source of niche truth |
| `src/theme.ts` | Two colours in, full palette out |
| Landing page | Hero, pain, stats, sessions, who for, proof, FAQ, final CTA, footer |
| Registration | 3 step popup, no Radix, no Reduce Motion bug |
| Offer pages | One component serves upsell and downsell |
| Thank you | One component serves all three post-registration states |
| Legal | Terms, privacy, refund, disclaimer, generated from config |
| Preferences | Unsubscribe without a login, as the law expects |
| Replay, Closed | Built |
| Control Room | OTP login, leads, email queue, settings |
| Database | 20 tables, RLS, seeds, cron, one paste |
| Email engine | 9 templates, 26 blocks, generator tested on a second niche |
| Tracking | Pixel with advanced matching, scroll depth, page views |
| Edge functions | enqueue-sequence, process-email-queue, email-track, ai-calls, control-room-otp |
| Leak scanner | Passing, and running in CI |

## Not done

- **WhatsApp worker.** Tables and blueprint exist; `process-whatsapp-queue` does not.
- **Attendance routing.** `day_after_attended` vs `day_after_missed` needs the
  webinar platform's attendee list to choose between them.
- **Back office webhook.** Blueprint stage 9, deliberately unbuilt.
- **A real end-to-end run.** Nobody has yet taken an empty Lovable project all the
  way to a live funnel with this. Until someone does, the 15 minute claim is a
  projection, not a measurement.
