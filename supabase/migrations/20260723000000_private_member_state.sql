-- Member-owned application state is stored as one versioned snapshot while the
-- prototype evolves. It is the only browser-facing private-data table in this
-- slice. An Auth identity must also be explicitly pre-authorized as a Member.
create schema if not exists private;

create table if not exists private.authorized_members (
  member_id uuid primary key references auth.users(id) on delete cascade,
  authorized_at timestamptz not null default now()
);

revoke all on schema private from public;
revoke all on private.authorized_members from public, anon, authenticated;

create or replace function public.is_authorized_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.authorized_members
    where member_id = auth.uid()
  );
$$;

revoke all on function public.is_authorized_member() from public;
grant execute on function public.is_authorized_member() to authenticated;

create or replace function public.assert_authorized_member()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_authorized_member() then
    raise exception 'Member is not authorized' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.assert_authorized_member() from public;
grant execute on function public.assert_authorized_member() to authenticated;

create table if not exists public.member_state (
  member_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  constraint member_state_is_object check (jsonb_typeof(state) = 'object')
);

alter table public.member_state enable row level security;
alter table public.member_state force row level security;

drop policy if exists "Members manage only their own state" on public.member_state;
create policy "Members manage only their own state"
  on public.member_state
  for all
  to authenticated
  using (member_id = auth.uid() and public.is_authorized_member())
  with check (member_id = auth.uid() and public.is_authorized_member());

revoke all on public.member_state from anon;
grant select, insert, update, delete on public.member_state to authenticated;
