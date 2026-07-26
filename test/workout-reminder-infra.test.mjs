import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('background Workout Reminders have jobs, Web Push, and a scheduler runbook', () => {
  const migration = fs.readFileSync('supabase/migrations/20260724000001_workout_reminders.sql', 'utf8');
  const worker = fs.readFileSync('supabase/functions/send-workout-reminders/index.ts', 'utf8');
  const serviceWorker = fs.readFileSync('public/sw.js', 'utf8');
  const runbook = fs.readFileSync('docs/workout-reminders.md', 'utf8');

  for (const rule of ['enable row level security', 'member_id = auth.uid()', 'public.is_authorized_member()', 'for update skip locked', 'grant execute on function public.claim_due_workout_reminder_jobs(integer) to service_role']) {
    assert.ok(migration.includes(rule), `migration is missing ${rule}`);
  }
  for (const rule of ['WORKOUT_REMINDER_CRON_SECRET', 'VAPID_PRIVATE_KEY', 'webpush.sendNotification', "rpc('claim_due_workout_reminder_jobs'", ".eq('status', 'processing')", "from('push_subscriptions').delete()"]) {
    assert.ok(worker.includes(rule), `delivery worker is missing ${rule}`);
  }
  assert.ok(worker.includes('notificationForWorkoutReminder()'));
  assert.ok(!worker.includes('job.workout_name'), 'notification content must not expose the Workout name');
  assert.ok(serviceWorker.includes("addEventListener('push'"));
  assert.ok(serviceWorker.includes("addEventListener('fetch'"));
  assert.ok(runbook.includes("cron.schedule"));
});
