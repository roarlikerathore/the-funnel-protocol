# Step 1 — The Lovable seed prompt

**What this does:** creates an empty project with a database attached. Nothing else.

**What it costs:** 1-2 credits. It is deliberately tiny. Every extra sentence you add
here costs you credits and gets thrown away later, so do not add any.

---

## Before you paste

Go to **lovable.dev** → **New Project**. Name it whatever you like.

## Paste this, exactly as it is

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

## When it finishes

You should see a plain page with a heading and nothing else. **That is correct.**
It is meant to look broken. If it looks designed, Lovable ignored the instruction —
that costs you nothing to leave as is, Claude will overwrite it anyway.

## Then

Top right → **GitHub** → **Connect to GitHub** → authorise → **Create Repository**.

Copy the repository URL. You need it in step 4.

---

### If Lovable asks you to confirm enabling Cloud
Say yes. That is the database, and the funnel does not work without it.

### If you already have a Lovable project you want to reuse
Do not. Start a clean one. Claude will replace almost every file, and merging
that into an existing project is where things break.
