create table if not exists public.workout_reminder_jobs (
  id text primary key,
  member_id uuid not null references auth.users(id) on delete cascade,
  deadline_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'cancelled', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  delivered_at timestamptz
);

alter table public.workout_reminder_jobs enable row level security;
alter table public.workout_reminder_jobs force row level security;

create policy "Members manage their Workout Reminder jobs" on public.workout_reminder_jobs
  for all to authenticated
  using (member_id = auth.uid() and public.is_authorized_member())
  with check (member_id = auth.uid() and public.is_authorized_member());

revoke all on public.workout_reminder_jobs from anon;
grant select, insert, update, delete on public.workout_reminder_jobs to authenticated;

create index if not exists workout_reminder_jobs_due_idx
  on public.workout_reminder_jobs (deadline_at)
  where status = 'pending';

create or replace function public.claim_due_workout_reminder_jobs(batch_size integer default 100)
returns setof public.workout_reminder_jobs
language sql
security definer
set search_path = ''
as $$
  update public.workout_reminder_jobs
  set status = 'processing', claimed_at = now()
  where id in (
    select id from public.workout_reminder_jobs
    where (status = 'pending' or (status = 'processing' and claimed_at < now() - interval '1 minute'))
      and deadline_at <= now()
    order by deadline_at
    for update skip locked
    limit greatest(1, least(batch_size, 100))
  )
  returning *;
$$;

revoke all on function public.claim_due_workout_reminder_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_due_workout_reminder_jobs(integer) to service_role;
