# Edu Track

AI-powered daily learning planner with gamification. Deployed on **Cloudflare Pages** using `@cloudflare/next-on-pages` with the Edge runtime.

## Setup

1. Create a [Supabase](https://supabase.com) project
2. Run the migration in `supabase/migrations/001_initial_schema.sql` via the SQL Editor
3. Configure Auth redirect URLs:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://<your-pages-domain>/auth/callback`
4. Copy `.env.local.example` to `.env.local` and fill in your keys
5. Install and run locally:

```bash
npm install
npm run dev
```

## Cloudflare Pages Deployment

### Build configuration (Git integration)

| Setting | Value |
|---------|-------|
| Framework preset | Next.js |
| Build command | `npx @cloudflare/next-on-pages` |
| Build output directory | `.vercel/output/static` |
| Node.js version | `20` or later |

In **Pages → Settings → Functions → Compatibility flags**, enable `nodejs_compat` for production and preview. Set compatibility date to `2026-07-01` or later.

Add environment variables in the Cloudflare dashboard (same keys as `.env.local`).

### CLI deploy

```bash
npm run pages:build   # next build + Cloudflare adapter
npm run preview       # local Pages preview (workerd runtime)
npm run deploy        # deploy to Cloudflare Pages
```

For local preview secrets, copy `.dev.vars.example` to `.dev.vars`.

> **Windows note:** `@cloudflare/next-on-pages` runs the Vercel build CLI internally and may fail on native Windows. Use WSL, or rely on Cloudflare Pages Git builds (Linux) with `npx @cloudflare/next-on-pages` as the build command. `npm run dev` and `npm run build` work normally on Windows.

## Edge Runtime

All server routes run on the Edge runtime (`export const runtime = "edge"`):

- `app/api/tasks/today`
- `app/api/tasks/complete`
- `app/api/gamification/stats`
- `app/auth/callback`
- `app/(marketing)/page` (auth redirect)

OpenAI calls use `fetch` directly (no Node.js SDK). Supabase uses `@supabase/ssr`, which is Edge-compatible.

## Tech Stack

- Next.js 15 (App Router), React, TypeScript
- Tailwind CSS
- Supabase (Auth + Database)
- OpenAI API (daily task generation)
- Cloudflare Pages (`@cloudflare/next-on-pages`)

## Features

- Email/password authentication
- AI-generated progressive daily tasks
- Streak tracking and XP system
- Evolving companion sprite and city-pop progress map
- Mobile-first dashboard
