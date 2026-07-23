create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rest_notification_jobs (
  id text primary key,
  member_id uuid not null references auth.users(id) on delete cascade,
  deadline_at timestamptz not null,
  next_set_label text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'cancelled', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  delivered_at timestamptz
);

alter table public.push_subscriptions enable row level security;
alter table public.push_subscriptions force row level security;
alter table public.rest_notification_jobs enable row level security;
alter table public.rest_notification_jobs force row level security;

create policy "Members manage their push subscriptions" on public.push_subscriptions
  for all to authenticated
  using (member_id = auth.uid() and public.is_authorized_member())
  with check (member_id = auth.uid() and public.is_authorized_member());

create policy "Members manage their Rest Timer jobs" on public.rest_notification_jobs
  for all to authenticated
  using (member_id = auth.uid() and public.is_authorized_member())
  with check (member_id = auth.uid() and public.is_authorized_member());

revoke all on public.push_subscriptions, public.rest_notification_jobs from anon;
grant select, insert, update, delete on public.push_subscriptions, public.rest_notification_jobs to authenticated;

create index if not exists rest_notification_jobs_due_idx
  on public.rest_notification_jobs (deadline_at)
  where status = 'pending';

create or replace function public.claim_due_rest_notification_jobs(batch_size integer default 100)
returns setof public.rest_notification_jobs
language sql
security definer
set search_path = ''
as $$
  update public.rest_notification_jobs
  set status = 'processing', claimed_at = now()
  where id in (
    select id from public.rest_notification_jobs
    where (status = 'pending' or (status = 'processing' and claimed_at < now() - interval '1 minute'))
      and deadline_at <= now()
    order by deadline_at
    for update skip locked
    limit greatest(1, least(batch_size, 100))
  )
  returning *;
$$;

revoke all on function public.claim_due_rest_notification_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_due_rest_notification_jobs(integer) to service_role;
