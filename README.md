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
pnpm verify:release
pnpm typecheck
pnpm build
pnpm test:db # requires the Supabase CLI and a local Supabase stack
```

## Exercise Catalog

The offline Exercise Catalog is generated from the reviewed, pinned wger snapshot in `data/wger/`. Run `pnpm catalog:import` after reviewing a new snapshot. The importer excludes records with incomplete or contradictory rights metadata and writes `data/wger/latest-import-report.json`, including additions, removals, licensing changes, and duplicate mappings.

## Private Member setup

The browser only reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`). Never use a service-role key in Vite, GitHub Actions, or the deployed browser bundle.

1. Create a Supabase project and apply the migration with `supabase db push`.
2. In Supabase Auth, disable public signups and create the one pre-authorized Member account through the dashboard. Then authorize that exact Auth user in the SQL editor:

   ```sql
   insert into private.authorized_members (member_id)
   select id from auth.users where email = 'member@example.com';
   ```
3. Add the project URL, publishable key, and Web Push public key as GitHub repository variables named `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `VAPID_PUBLIC_KEY`.
4. Run `supabase test db` to execute the cross-Member RLS test, then deploy `main`.

Supabase persists and silently refreshes the Member session. The app stores Workout state locally first and synchronizes the authenticated, pre-authorized Member's snapshot through the RLS-protected `member_state` table when online.

## Cloudflare Pages

Production deploys from `main` to the `barely-fit` Cloudflare Pages project through `.github/workflows/release.yml`. Configure `CLOUDFLARE_ACCOUNT_ID` and a Pages-edit `CLOUDFLARE_API_TOKEN` as GitHub Actions secrets. Pull requests run unit, browser, public-bundle/secret, and database-policy gates without deploying.

See the [solo private-beta operations runbook](docs/private-beta-operations.md) for iPhone installation, restore, failure-state drills, and troubleshooting.

## Project documentation

- [Private-beta scope](docs/product-scope.md)
- [Domain language](CONTEXT.md)
- [Architecture decisions](docs/adr/)
- [Technology research](docs/research/)
- [ChatGPT design prompt](docs/chatgpt-design-prompt.md)
- [Implemented design handoff](DESIGN-HANDOFF.md)
- [Implementation tickets](https://github.com/angeli-arino/barely-fit/issues)

## Production stack

- Supabase Free for Postgres, authentication, Row Level Security, and future server-side integrations
- Cloudflare Free for static PWA hosting
- IndexedDB with an explicit outbox for offline-first workout logging
- A curated, locally available wger Exercise Catalog snapshot

See the ADRs and research notes for the trade-offs behind these choices.
