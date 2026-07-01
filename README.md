# Edu Track

AI-powered daily learning planner with gamification. Deployed on **Cloudflare Workers** via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare).

## Setup

1. Create a [Supabase](https://supabase.com) project
2. Run all SQL migrations in `supabase/migrations/` via the SQL Editor (in order: `001`, `002`, `003`)
3. Configure Auth redirect URLs:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://<your-workers-domain>/auth/callback`
4. Copy `.env.local.example` to `.env.local` and fill in your keys
5. Install and run locally:

```bash
npm install
npm run dev
```

If the UI looks unstyled: stop the dev server, delete the `.next` folder, then run `npm run dev` again.

## Cloudflare Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for full instructions.

| Field | Value |
|-------|-------|
| **Deploy command** | `npm run deploy` |
| **Non-production deploy** | `npm run upload` |

## Tech Stack

- Next.js 15 (App Router), React, TypeScript
- Tailwind CSS
- Supabase (Auth + Database)
- OpenAI API (daily task generation)
- Cloudflare Workers (`@opennextjs/cloudflare`)

## Features

- Email/password authentication
- AI-generated progressive daily tasks
- Streak tracking and XP system
- Evolving companion sprite and city-pop progress map
- Mobile-first dashboard
