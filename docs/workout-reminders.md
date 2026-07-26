# Workout Reminders Web Push deployment

Background Workout Reminders use standards-based Web Push. The browser client
stores a Member-owned push subscription and calculates upcoming workout jobs. A
scheduled Edge Function sends due notifications, allowing the Home Screen PWA
to alert the Member while the app is suspended or closed.

## Required configuration

1. Generate a VAPID key pair (if not already done for Rest Timers). Set `VITE_VAPID_PUBLIC_KEY` in the web build.
2. Set these Edge Function secrets:
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (a `mailto:` URL),
   and `WORKOUT_REMINDER_CRON_SECRET`.
3. Deploy `send-workout-reminders`.
4. Store the deployed function URL and matching bearer secret in Supabase Vault
   as `workout_reminder_function_url` and `workout_reminder_cron_secret`.
5. Schedule delivery after enabling the `pg_cron` and `pg_net` extensions:

```sql
select cron.schedule(
  'send-due-workout-reminders',
  '1 minute',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'workout_reminder_function_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'workout_reminder_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Notification permission is requested only after the Member taps the enable
control in Settings from the installed PWA. If permission is denied or later
revoked, Barely Fit cancels outstanding Workout Reminder jobs. The notification
uses generic content and does not include the Workout name.
