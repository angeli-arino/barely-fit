import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('background Rest Timer delivery has private jobs, Web Push, and a scheduler runbook', () => {
  const migration = fs.readFileSync('supabase/migrations/20260724000000_rest_timer_notifications.sql', 'utf8');
  const worker = fs.readFileSync('supabase/functions/send-rest-notifications/index.ts', 'utf8');
  const serviceWorker = fs.readFileSync('public/sw.js', 'utf8');
  const runbook = fs.readFileSync('docs/rest-timer-notifications.md', 'utf8');

  for (const rule of ['enable row level security', 'member_id = auth.uid()', 'public.is_authorized_member()', 'for update skip locked', 'grant execute on function public.claim_due_rest_notification_jobs(integer) to service_role']) {
    assert.ok(migration.includes(rule), `migration is missing ${rule}`);
  }
  for (const rule of ['REST_NOTIFICATION_CRON_SECRET', 'VAPID_PRIVATE_KEY', 'webpush.sendNotification', "rpc('claim_due_rest_notification_jobs'", ".eq('status', 'processing')"]) {
    assert.ok(worker.includes(rule), `delivery worker is missing ${rule}`);
  }
  assert.ok(serviceWorker.includes("addEventListener('push'"));
  assert.ok(serviceWorker.includes("addEventListener('fetch'"));
  assert.ok(runbook.includes("cron.schedule"));
});
