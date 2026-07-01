# Cloudflare Deployment (OpenNext)

Edu Track deploys to **Cloudflare Workers** via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare).

## Cloudflare Dashboard (Workers Builds / Git)

When **deploy command is required** and build is optional:

| Field | Value |
|-------|-------|
| **Build command** | *(leave empty)* |
| **Deploy command** | `npm run deploy` |
| **Non-production branch deploy command** | `npm run upload` |

If you prefer split build/deploy:

| Field | Value |
|-------|-------|
| **Build command** | `npm run build` |
| **Deploy command** | `opennextjs-cloudflare build && opennextjs-cloudflare deploy` |

`npm run deploy` runs the OpenNext build (which invokes `next build`) and then `wrangler deploy`.

## Required settings

1. **Compatibility flag**: `nodejs_compat` (set in [`wrangler.jsonc`](wrangler.jsonc))
2. **Compatibility date**: `2026-07-01` or later
3. **Environment variables** (Build + Runtime):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. **Supabase Auth** redirect: `https://<your-domain>/auth/callback`

## Local commands

```bash
npm run dev       # Next.js dev server (use this for UI work)
npm run preview   # Build + preview in workerd runtime
npm run deploy    # Build + deploy to Cloudflare
```

For local preview secrets, copy `.dev.vars.example` to `.dev.vars`.

Use `npm run preview` to test the Cloudflare worker locally — do not import `@opennextjs/cloudflare` in `next.config.mjs` during normal `npm run dev` (it breaks Tailwind CSS). If styles look broken, stop the dev server, delete the `.next` folder, and run `npm run dev` again.

## Migrated from next-on-pages

This project previously used deprecated `@cloudflare/next-on-pages`. OpenNext uses the **Node.js runtime** on Cloudflare Workers (`nodejs_compat`), which fixes Next.js CVE issues and removes deprecated transitive dependencies from the Vercel CLI chain.
