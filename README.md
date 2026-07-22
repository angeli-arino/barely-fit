# Barely Fit

Barely Fit is a private, offline-first workout tracking progressive web app designed for fast use on an iPhone while remaining useful on desktop for planning and progress review.

The repository includes the high-fidelity local-first prototype for the complete private-beta screen map. It supports the testable PWA journey from Today through completing a Set and running a Rest Timer, along with planning, Workout Templates, the Exercise Catalog, Workout History, Progress, and Settings.

## Run locally

Requirements: Node.js 22+ and pnpm 10+.

```bash
corepack enable
pnpm install
pnpm dev
```

Useful verification commands:

```bash
pnpm verify:static
pnpm typecheck
pnpm build
pnpm test:db # requires the Supabase CLI and a local Supabase stack
```

## Private Member setup

The browser only reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`). Never use a service-role key in Vite, GitHub Actions, or the deployed browser bundle.

1. Create a Supabase project and apply the migration with `supabase db push`.
2. In Supabase Auth, disable public signups and create the one pre-authorized Member account through the dashboard. Then authorize that exact Auth user in the SQL editor:

   ```sql
   insert into private.authorized_members (member_id)
   select id from auth.users where email = 'member@example.com';
   ```
3. Add the project URL and publishable key as GitHub repository variables named `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.
4. Run `supabase test db` to execute the cross-Member RLS test, then deploy `main`.

Supabase persists and silently refreshes the Member session. The app stores Workout state locally first and synchronizes the authenticated, pre-authorized Member's snapshot through the RLS-protected `member_state` table when online.

## GitHub Pages

The production site deploys from `main` to [angeli-arino.github.io/barely-fit](https://angeli-arino.github.io/barely-fit/) through `.github/workflows/deploy-pages.yml`. The build uses the `/barely-fit/` project base path and includes a `404.html` SPA fallback so direct links to application routes continue to work.

## Project documentation

- [Private-beta scope](docs/product-scope.md)
- [Domain language](CONTEXT.md)
- [Architecture decisions](docs/adr/)
- [Technology research](docs/research/)
- [ChatGPT design prompt](docs/chatgpt-design-prompt.md)
- [Implemented design handoff](DESIGN-HANDOFF.md)
- [Implementation tickets](https://github.com/angeli-arino/barely-fit/issues)

## Current frontier

[Issue #1 — Deploy a testable Barely Fit prototype](https://github.com/angeli-arino/barely-fit/issues/1) is the first unblocked implementation slice.

## Planned stack

- Supabase Free for Postgres, authentication, Row Level Security, and future server-side integrations
- Cloudflare Free for static PWA hosting
- IndexedDB with an explicit outbox for offline-first workout logging
- A curated, locally available wger Exercise Catalog snapshot

See the ADRs and research notes for the trade-offs behind these choices.
