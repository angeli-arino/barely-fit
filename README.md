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
```

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
