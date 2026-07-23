# Rest Timer Web Push deployment

Background Rest Timer alerts use standards-based Web Push. The browser client
stores a Member-owned push subscription and deadline job in Supabase. A
scheduled Edge Function sends due notifications, allowing the Home Screen PWA
to alert the Member while the app is suspended or closed.

## Required configuration

1. Generate a VAPID key pair. Set `VITE_VAPID_PUBLIC_KEY` in the web build.
2. Set these Edge Function secrets:
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (a `mailto:` URL),
   and `REST_NOTIFICATION_CRON_SECRET`.
3. Deploy `send-rest-notifications`.
4. Store the deployed function URL and matching bearer secret in Supabase Vault
   as `rest_notification_function_url` and `rest_notification_cron_secret`.
5. Schedule delivery after enabling the `pg_cron` and `pg_net` extensions:

```sql
select cron.schedule(
  'send-due-rest-notifications',
  '5 seconds',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'rest_notification_function_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'rest_notification_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Notification permission is requested only after the Member taps the enable
button from the installed PWA. Foreground completion continues to use an
in-app message, sound, and vibration without requiring push permission.
