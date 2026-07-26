# Solo private-beta operations

Barely Fit production uses Cloudflare Pages for the public PWA shell, Supabase Free for authentication and Member-owned state, and IndexedDB as the local-first store. Only the Supabase URL, publishable key, and VAPID public key belong in the browser build.

## Install on iPhone

1. Open the production HTTPS address in Safari and sign in as the pre-authorized Member.
2. Choose **Share → Add to Home Screen → Add**, then launch Barely Fit from its Home Screen icon.
3. Complete one Set, close the PWA, reopen it, and confirm the Active Workout is recovered before relying on it during training.

Desktop browsers may use the same responsive site. The Home Screen installation is the target for background notification and offline smoke tests.

## Release and privacy checklist

Before production, disable public signup in Supabase Auth, authorize only the intended Member, apply every migration, and run `pnpm test`, `pnpm test:browser`, `pnpm test:db`, and `pnpm verify:release`. Inspect the Cloudflare deployment, sign in, traverse Today, Workout Schedule, Workout History, Progress, and Settings, then repeat the offline recovery smoke test on the target iPhone.

The release workflow deploys `dist` to the `barely-fit` Cloudflare Pages project only after unit, browser, release, and database-policy gates pass. Configure `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub Actions secrets; configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `VAPID_PUBLIC_KEY` as repository variables.

## Failure-state drills

- **Notification permission:** Install the PWA, enable background alerts in Settings, accept the operating-system prompt, and verify the allowed state. Foreground sound and vibration remain independently configurable.
- **Permission denied:** Deny the prompt and confirm Workout Reminders remain off and the workout flow continues without repeated permission prompts. Re-enable permission in iOS Settings before retrying.
- **Offline:** Start an Active Workout online, switch to airplane mode, complete a Set, close and reopen the PWA, and confirm “Recovered workout” and “Saved locally.” Restore connectivity and wait for the Saved/synchronized state before signing out or clearing site data.
- **Backend pause:** A quiet Supabase Free project can pause. Keep logging locally, open the Supabase dashboard, select the paused project, choose **Resume project**, then reopen Barely Fit and wait for synchronization. Do not create artificial keep-alive traffic.
- **Recoverable sync failure:** If the status says “Sync retry needed,” preserve the installed PWA and its site data, verify connectivity and Supabase status, resume the backend if needed, and reopen the app. Local edits remain queued; do not clear browser data until Saved appears.

## Restore and backup

For a paused project, use **Resume project** in Supabase Studio and verify authentication plus a new write. Free projects should also be exported regularly with `supabase db dump` to encrypted off-site storage. To restore elsewhere, create a new Supabase project, restore the dump, reapply environment variables, recreate the authorized Member mapping, keep public signup disabled, and rerun database-policy and browser smoke tests before redirecting production.

## Troubleshooting

- A blank or stale installed app: confirm Cloudflare is serving `index.html`, `manifest.webmanifest`, `sw.js`, and hashed assets from the same HTTPS origin; fully close and reopen the PWA after deployment.
- Sign-in rejected: confirm the Member exists, is listed in `private.authorized_members`, and the production URL/key point to that Supabase project.
- Changes remain local: do not uninstall. Check network access, Supabase project state, RLS migrations, and the sync indicator.
- Notifications unavailable: use the installed Home Screen PWA, configure the VAPID public key, and inspect the push subscription and notification delivery jobs.

## Deferred features

Additional Members, GPT recommendations, Fitbod Import, exports/backups in the UI, Apple Health, external calendars, videos, GPS, and HIIT programming are outside this beta. Any mention is informational only; none is an interactive production promise.
