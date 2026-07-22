# Barely Fit

Barely Fit is a private, offline-first workout tracking progressive web app designed for fast use on an iPhone while remaining useful on desktop for planning and progress review.

The project is currently in the planning and prototype phase. The first implementation milestone is a testable PWA journey from Today through completing a Set and running a Rest Timer.

## Project documentation

- [Private-beta scope](docs/product-scope.md)
- [Domain language](CONTEXT.md)
- [Architecture decisions](docs/adr/)
- [Technology research](docs/research/)
- [ChatGPT design prompt](docs/chatgpt-design-prompt.md)
- [Implementation tickets](https://github.com/angeli-arino/barely-fit/issues)

## Current frontier

[Issue #1 — Deploy a testable Barely Fit prototype](https://github.com/angeli-arino/barely-fit/issues/1) is the first unblocked implementation slice.

## Planned stack

- Supabase Free for Postgres, authentication, Row Level Security, and future server-side integrations
- Cloudflare Free for static PWA hosting
- IndexedDB with an explicit outbox for offline-first workout logging
- A curated, locally available wger Exercise Catalog snapshot

See the ADRs and research notes for the trade-offs behind these choices.
