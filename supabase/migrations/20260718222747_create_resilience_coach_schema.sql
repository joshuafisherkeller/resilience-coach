-- Resilience Coach stores synthetic demo profiles only.
-- All access is server-side through the service_role; there are intentionally
-- no anon or authenticated RLS policies.

create table public.child_profiles (
  child_id text primary key,
  recurring_struggles text[] not null default '{}'::text[],
  preferred_grounding_strategy text,
  session_count integer not null default 0,
  locked boolean not null default false,
  locked_at timestamptz,
  is_synthetic boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint child_profiles_child_id_format
    check (child_id ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  constraint child_profiles_struggle_cap
    check (cardinality(recurring_struggles) <= 5),
  constraint child_profiles_strategy_length
    check (
      preferred_grounding_strategy is null
      or (
        char_length(btrim(preferred_grounding_strategy)) between 1 and 120
      )
    ),
  constraint child_profiles_session_count_nonnegative
    check (session_count >= 0),
  constraint child_profiles_lock_timestamp_consistent
    check (
      (locked and locked_at is not null)
      or (not locked and locked_at is null)
    ),
  constraint child_profiles_synthetic_only
    check (is_synthetic)
);

create table public.child_profile_insights (
  id bigint generated always as identity primary key,
  child_id text not null
    references public.child_profiles(child_id) on delete cascade,
  insight text not null,
  created_at timestamptz not null default now(),
  constraint child_profile_insights_length
    check (char_length(btrim(insight)) between 1 and 300)
);

create index child_profile_insights_child_created_idx
  on public.child_profile_insights (child_id, created_at desc, id desc);

create table public.safety_handoffs (
  id bigint generated always as identity primary key,
  child_id text not null
    references public.child_profiles(child_id) on delete cascade,
  requested_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  notification_mode text not null default 'simulated_log',
  notification_status text not null default 'logged',
  created_at timestamptz not null default now(),
  constraint safety_handoffs_notification_mode
    check (notification_mode = 'simulated_log'),
  constraint safety_handoffs_notification_status
    check (notification_status = 'logged')
);

create index safety_handoffs_child_recorded_idx
  on public.safety_handoffs (child_id, recorded_at desc, id desc);

create function public.set_resilience_coach_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger child_profiles_set_updated_at
before update on public.child_profiles
for each row
execute function public.set_resilience_coach_updated_at();

-- This RPC keeps profile updates, the five-insight cap, and the session count
-- in one database transaction. Parsing an insight stays in the MCP server.
create function public.update_child_profile_atomic(
  p_child_id text,
  p_insight text,
  p_recurring_struggle text default null,
  p_preferred_grounding_strategy text default null
)
returns public.child_profiles
language plpgsql
set search_path = ''
as $$
declare
  v_profile public.child_profiles%rowtype;
  v_struggles text[];
  v_struggle text;
  v_strategy text;
begin
  select *
  into v_profile
  from public.child_profiles
  where child_id = p_child_id
  for update;

  if not found then
    raise exception 'unknown_child_id';
  end if;

  if v_profile.locked then
    raise exception 'child_profile_locked';
  end if;

  insert into public.child_profile_insights (child_id, insight)
  values (p_child_id, btrim(p_insight));

  delete from public.child_profile_insights
  where id in (
    select id
    from public.child_profile_insights
    where child_id = p_child_id
    order by created_at desc, id desc
    offset 5
  );

  v_struggles := v_profile.recurring_struggles;
  v_struggle := nullif(btrim(p_recurring_struggle), '');
  if v_struggle is not null and not (v_struggle = any(v_struggles)) then
    v_struggles := array_append(v_struggles, v_struggle);
    if cardinality(v_struggles) > 5 then
      v_struggles := v_struggles[
        cardinality(v_struggles) - 4:cardinality(v_struggles)
      ];
    end if;
  end if;

  v_strategy := nullif(btrim(p_preferred_grounding_strategy), '');

  update public.child_profiles
  set recurring_struggles = v_struggles,
      preferred_grounding_strategy = coalesce(
        v_strategy,
        preferred_grounding_strategy
      ),
      session_count = session_count + 1
  where child_id = p_child_id
  returning * into v_profile;

  return v_profile;
end;
$$;

-- The safety log and widget lock are written atomically so the handoff can
-- never record an alert without also disabling further child input.
create function public.trigger_safety_handoff_atomic(
  p_child_id text,
  p_requested_at timestamptz
)
returns public.safety_handoffs
language plpgsql
set search_path = ''
as $$
declare
  v_handoff public.safety_handoffs%rowtype;
begin
  if not exists (
    select 1 from public.child_profiles where child_id = p_child_id
  ) then
    raise exception 'unknown_child_id';
  end if;

  update public.child_profiles
  set locked = true,
      locked_at = coalesce(locked_at, now())
  where child_id = p_child_id;

  insert into public.safety_handoffs (child_id, requested_at)
  values (p_child_id, p_requested_at)
  returning * into v_handoff;

  return v_handoff;
end;
$$;

alter table public.child_profiles enable row level security;
alter table public.child_profile_insights enable row level security;
alter table public.safety_handoffs enable row level security;

revoke all on table public.child_profiles from public, anon, authenticated;
revoke all on table public.child_profile_insights from public, anon, authenticated;
revoke all on table public.safety_handoffs from public, anon, authenticated;
revoke all on sequence public.child_profile_insights_id_seq
  from public, anon, authenticated;
revoke all on sequence public.safety_handoffs_id_seq
  from public, anon, authenticated;

grant select, insert, update, delete on table public.child_profiles
  to service_role;
grant select, insert, update, delete on table public.child_profile_insights
  to service_role;
grant select, insert, update, delete on table public.safety_handoffs
  to service_role;
grant usage, select on sequence public.child_profile_insights_id_seq
  to service_role;
grant usage, select on sequence public.safety_handoffs_id_seq
  to service_role;

revoke all on function public.set_resilience_coach_updated_at()
  from public, anon, authenticated;
revoke all on function public.update_child_profile_atomic(text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.trigger_safety_handoff_atomic(text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.update_child_profile_atomic(text, text, text, text)
  to service_role;
grant execute on function public.trigger_safety_handoff_atomic(text, timestamptz)
  to service_role;

insert into public.child_profiles (
  child_id,
  recurring_struggles,
  preferred_grounding_strategy
)
values
  (
    'demo-sharing',
    array['sharing and taking turns'],
    'one slow belly breath'
  ),
  (
    'demo-mistakes',
    array['making mistakes', 'wanting to give up'],
    'shake hands out'
  ),
  (
    'demo-change',
    array['unexpected changes'],
    'name five things you can see'
  );
