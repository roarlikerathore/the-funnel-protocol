# How the repos work, and why yours cannot be touched

The short version: **the kit is not your funnel.** It is a de-branded engine derived
from your funnel. Nobody who uses the kit is anywhere near your live project.

## Three separate things

| Repo | Who owns it | Visibility | Contains |
|---|---|---|---|
| `niche-page-studio` | You | **Private** | Your live MHP funnel. Your copy, your Supabase, your leads |
| `the-funnel-protocol` | You | **Public template** | The engine with every MHP word stripped out |
| `their-funnel` | Each buyer | Theirs | A fresh copy they made from the template |

Your live funnel is not in that chain anywhere. The kit is built *from* it the way a
cake recipe is built from a cake: you can hand out the recipe forever and nobody gets
a bite of the original.

## Why a buyer can never reach your repo

**They are not given access.** `niche-page-studio` stays private. Nothing in the kit
links to it, names it, or holds a credential for it.

**GitHub's "Use this template" is a one-way door.** It creates a brand new repo in
*their* account with no shared history and no connection back. It is not a fork —
there is no "contribute upstream" path, no pull request route, nothing pointing home.

**Public means readable, never writable.** Even on the public kit repo, a stranger can
read and copy. Only you can change it. That is how every public repo on GitHub works.

**Their database is theirs.** Lovable creates a fresh backend inside their own account
when they run step 1. Your Supabase project is never mentioned in any file they receive.

## What you must strip before publishing the kit

The kit is derived from your funnel, so this matters. Before the template repo goes
public, verify none of these survived the port:

- [ ] Supabase project URL and anon key (`xsorglkimdvgrrjtghpx`)
- [ ] Your domains: `moneyheistprotocol.live`, `bullish.army`, `thebullisharmy.com`
- [ ] Your Meta Pixel ID
- [ ] Your Zoom webinar ID and join links
- [ ] Your payment links
- [ ] Your Bolna agent ID
- [ ] Control Room path (`/control-room-1997` becomes `/control-room`)
- [ ] Your copy, your name, your testimonials, your numbers
- [ ] `.env` files of any kind

Every one of these becomes a config field the buyer fills with their own.

**A scan runs before publish and again in CI.** If any of these strings appear in the
template repo, the build fails. This is not a checklist anyone has to remember.

## Setting it up, once

1. Push the kit to a **new public repo**, `the-funnel-protocol`.
2. Settings → General → tick **Template repository**.
3. Buyers land on it and press **Use this template**.

Step 2 is what turns the green button from "Fork" into "Use this template". Without it
they can still fork, which works but visibly ties their repo to yours in the UI, and
that is the thing you said you did not want.

## If you would rather they never see the kit repo either

There is a tighter version: ship the kit as a zip they download, and Claude Code reads
it from their disk instead of cloning. Slightly more friction for them, one less public
surface for you.

The trade: with a public template repo you can push an improvement and everyone's next
build gets it. With a zip, every buyer is frozen at the version they downloaded.
