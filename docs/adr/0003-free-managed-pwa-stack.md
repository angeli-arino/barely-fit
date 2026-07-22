# Use Supabase, Cloudflare, and explicit offline storage

Use Supabase Free for Postgres, authentication, Row Level Security, and the private GPT Action; Cloudflare Free for public static PWA hosting; and IndexedDB with an explicit outbox for offline-first workout logging. This hybrid preserves relational clarity and database-enforced Member isolation at zero cost within free quotas, while accepting application-owned synchronization and Supabase's possible low-activity pause; see [the primary-source comparison](../research/free-managed-pwa-stack.md).
