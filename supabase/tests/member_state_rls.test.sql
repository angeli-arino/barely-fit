begin;

select plan(6);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'member-one@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'member-two@example.test', '', now(), now(), now());

insert into private.authorized_members (member_id)
values ('11111111-1111-1111-1111-111111111111');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select lives_ok(
  $$insert into public.member_state (member_id, state) values ('11111111-1111-1111-1111-111111111111', '{"workouts": []}')$$,
  'a Member can create their own state'
);
select is(
  (select count(*)::integer from public.member_state),
  1,
  'a Member can read their own state'
);
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select throws_ok(
  $$insert into public.member_state (member_id, state) values ('22222222-2222-2222-2222-222222222222', '{"workouts": []}')$$,
  '42501',
  null,
  'an unapproved identity cannot create its own Member state'
);
select throws_ok(
  $$select public.assert_authorized_member()$$,
  '42501',
  'Member is not authorized',
  'an unapproved identity fails the client authorization check'
);
select is(
  (select count(*)::integer from public.member_state),
  0,
  'a Member cannot read another Member state'
);
select is(
  (with attempted_update as (
    update public.member_state
    set state = '{"workouts": ["stolen"]}'
    where member_id = '11111111-1111-1111-1111-111111111111'
    returning 1
  ) select count(*)::integer from attempted_update),
  0,
  'a Member cannot update another Member state'
);

select * from finish();
rollback;
