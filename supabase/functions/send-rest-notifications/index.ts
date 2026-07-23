import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json' },
});

Deno.serve(async (request) => {
  const cronSecret = Deno.env.get('REST_NOTIFICATION_CRON_SECRET');
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) return json({ error: 'Unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const subject = Deno.env.get('VAPID_SUBJECT');
  if (!supabaseUrl || !serviceRoleKey || !publicKey || !privateKey || !subject) return json({ error: 'Web Push is not configured' }, 503);

  webpush.setVapidDetails(subject, publicKey, privateKey);
  const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: jobs, error } = await client.rpc('claim_due_rest_notification_jobs', { batch_size: 100 });
  if (error) return json({ error: error.message }, 500);

  let sent = 0;
  for (const job of jobs ?? []) {
    const { data: subscriptions, error: subscriptionError } = await client.from('push_subscriptions').select('id, subscription').eq('member_id', job.member_id);
    let delivered = false;
    let retryableFailure = Boolean(subscriptionError);
    for (const record of subscriptions ?? []) {
      try {
        await webpush.sendNotification(record.subscription, JSON.stringify({
          title: 'Rest complete',
          body: job.next_set_label ? `Next: ${job.next_set_label}` : 'Your next Set is ready.',
          tag: `rest-${job.id}`,
        }));
        delivered = true;
      } catch (pushError) {
        const statusCode = typeof pushError === 'object' && pushError && 'statusCode' in pushError ? pushError.statusCode : undefined;
        if (statusCode === 404 || statusCode === 410) await client.from('push_subscriptions').delete().eq('id', record.id);
        else retryableFailure = true;
      }
    }
    await client.from('rest_notification_jobs').update({
      status: delivered ? 'sent' : retryableFailure ? 'pending' : 'failed',
      claimed_at: null,
      delivered_at: delivered ? new Date().toISOString() : null,
    }).eq('id', job.id).eq('status', 'processing');
    if (delivered) sent += 1;
  }
  return json({ processed: jobs?.length ?? 0, sent });
});
