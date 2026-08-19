# Step 4 — The Claude Code bootstrap prompt

**What this does:** pulls your project onto your computer, reads the blueprint,
interviews you, and builds the whole funnel.

**What it costs in Lovable credits:** zero. Everything happens on your machine
and in GitHub.

---

## Before you paste

You need three things ready:

1. **Claude Code installed** and signed in
2. **Your GitHub connected** — the same account Lovable pushed to
3. **Your repository URL** from step 2, looks like
   `https://github.com/yourname/your-project`

## Paste this into Claude Code

Replace the one line marked `>>>` with your repository URL. Change nothing else.

```text
You are setting up a webinar funnel for me using The Funnel Protocol kit.

>>> MY REPO: https://github.com/PUT-YOURS-HERE/your-project

Do this in order and tell me when each step is done.

1. Make a folder at ~/Documents/Funnels/<repo-name> and clone my repo into it.
   If ~/Documents/Funnels does not exist, create it.

2. Clone the kit next to it:
   https://github.com/roarlikerathore/the-funnel-protocol
   Read kit/blueprint/00-BUILD-ORDER.md before doing anything else. That file
   is the source of truth for the build and overrides your own instincts about
   how to structure this.

3. Check my repo is what you expect: a Lovable skeleton with placeholder routes
   and a supabase folder. If it looks like something else, stop and tell me
   rather than guessing.

4. Interview me using kit/intake/funnel-brief.md. Ask in small batches, not all
   at once, and never more than five questions in a message. If I say I have
   already filled the brief in, read my filled copy instead and only ask about
   what is blank or contradictory.

5. Build the funnel per the build order. Write everything into MY repo, commit
   in logical chunks, and push to GitHub when a stage is finished and building.

6. Generate SETUP.sql at the root of my repo and hand it to me as a file.

RULES, these matter more than being fast:
- Never tell me to run a prompt in Lovable to build something. Lovable only
  hosts. Every change is a file in GitHub.
- Never invent my numbers, testimonials, results, or credentials. If I have not
  given you a real one, use an obvious placeholder and add it to a list called
  STILL-NEEDED.md so I know what is fake.
- Never put an API key in any file that ships to the browser.
- Ask before anything that costs money or sends a real message to a real person.
- When you are unsure between two readings of what I said, ask. One question now
  is cheaper than rebuilding a page later.
```

## What happens next

Claude will ask you questions in small batches. Answer in plain language —
you do not need to be technical, and rough answers are fine. It will tell you
when something is missing.

Expect roughly:

| Stage | Time |
|---|---|
| Interview | 5-8 minutes |
| Build | 5-7 minutes, mostly unattended |
| The one SQL paste | 2 minutes |

---

### If Claude cannot find your repo
It is almost always the GitHub connection rather than the URL. Check Claude Code
has access to that account, then paste the prompt again.

### If you want to answer the questions in advance
Open `intake/funnel-brief.md`, fill it in, save it, and tell Claude
"I have filled in the brief, it is at <path>". It will read it instead of asking.
