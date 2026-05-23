# Launch Command Center ⚡

A Tier 1 launch readiness tracker built for Product Marketing Managers and Launch Program Managers who are done managing high-stakes launches in Google Sheets and slide decks.

## The problem

When you're running a Tier 1 B2B launch with major revenue implications, your status lives in three places at once: a tracking spreadsheet, a launch deck, and everyone's individual updates. Nothing talks to each other. Leadership asks where things stand and you spend an hour pulling it together.

Launch Command Center is the single source of truth. It tracks every function, surfaces blockers automatically, calculates revenue risk in real time, and generates a one-click exec summary you can paste directly into your leadership email.

## What it does

**Revenue Risk Engine**
Enter your launch date, target revenue month, and average sales cycle. The tool automatically calculates whether a launch slip puts your pipeline commitment at risk — and by exactly how many weeks and dollars.

**Cross-functional Workstream Tracking**
10 pre-built functions: Product, PMM, Sales Enablement, Demand Gen, Customer Success, Legal, Pricing, Comms/PR, RevOps, and Implementation. Function leads update their own workstream status and tasks. The PMM owns the full picture.

**Blocker Board**
Every blocked or at-risk task surfaces in one place, categorized by type: Decision Needed, Dependency, or Overdue.

**Exec Summary Generator**
One-click formatted leadership status update, ready to copy and paste into email or Slack.

**Dark and light mode**

## Documentation

📖 [Full usage guide →](USAGE.md) — how each role uses the tool, multi-user setup, and tips for running launch syncs

## Live Demo

👉 [See it in action](https://your-vercel-url.vercel.app/#demo) ← *(replace with your Vercel URL after deploying)*

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` for the app or `http://localhost:5173/#demo` for the animated demo.

## Deploy to Vercel

1. Fork this repo
2. Go to [vercel.com](https://vercel.com) and connect your GitHub account
3. Import this repo — no configuration needed
4. Deploy

Your app will be live at `https://your-project-name.vercel.app`

## Built with

- React 18 + Vite
- No backend, no database — data stored in localStorage
- IBM Plex Sans (Google Fonts)

---

Built by [Carol Grant](https://carolsgrant.com) · GTM Advisor & Founder of [Opolo](https://opolo.ai)
