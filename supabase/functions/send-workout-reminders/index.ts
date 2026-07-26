import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { notificationForWorkoutReminder, workoutReminderDeliveryResult } from '../_shared/workoutReminderDelivery.ts';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json' },
});

Deno.serve(async (request) => {
  const cronSecret = Deno.env.get('WORKOUT_REMINDER_CRON_SECRET');
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) return json({ error: 'Unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const subject = Deno.env.get('VAPID_SUBJECT');
  if (!supabaseUrl || !serviceRoleKey || !publicKey || !privateKey || !subject) return json({ error: 'Web Push is not configured' }, 503);

  webpush.setVapidDetails(subject, publicKey, privateKey);
  const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: jobs, error } = await client.rpc('claim_due_workout_reminder_jobs', { batch_size: 100 });
  if (error) return json({ error: error.message }, 500);

  let sent = 0;
  for (const job of jobs ?? []) {
    const { data: subscriptions, error: subscriptionError } = await client.from('push_subscriptions').select('id, subscription').eq('member_id', job.member_id);
    const deliveryStatusCodes: number[] = subscriptionError ? [503] : [];
    for (const record of subscriptions ?? []) {
      try {
        const response = await webpush.sendNotification(record.subscription, JSON.stringify(notificationForWorkoutReminder()));
        deliveryStatusCodes.push(response.statusCode);
      } catch (pushError) {
        const statusCode = typeof pushError === 'object' && pushError && 'statusCode' in pushError ? pushError.statusCode : undefined;
        deliveryStatusCodes.push(typeof statusCode === 'number' ? statusCode : 503);
      }
    }
    const delivery = workoutReminderDeliveryResult(deliveryStatusCodes);
    for (const index of delivery.expiredIndexes) {
      const record = subscriptions?.[index - (subscriptionError ? 1 : 0)];
      if (record) await client.from('push_subscriptions').delete().eq('id', record.id);
    }
    await client.from('workout_reminder_jobs').update({
      status: delivery.status,
      claimed_at: null,
      delivered_at: delivery.status === 'sent' ? new Date().toISOString() : null,
    }).eq('id', job.id).eq('status', 'processing');
    if (delivery.status === 'sent') sent += 1;
  }
  return json({ processed: jobs?.length ?? 0, sent });
});
