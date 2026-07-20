-- Supabase migration history version: 20260720165928.
-- Add neutral, bounded practice summaries without changing the three public
-- MCP tool contracts. Raw conversation transcripts are never stored.

alter table public.child_profiles
  add column practiced_strategies text[] not null default '{}'::text[],
  add column support_preference text,
  add column last_next_time_plan text;

alter table public.child_profiles
  add constraint child_profiles_practiced_strategy_cap
    check (
      cardinality(practiced_strategies) <= 5
      and char_length(array_to_string(practiced_strategies, '')) <= 400
    ),
  add constraint child_profiles_support_preference_length
    check (
      support_preference is null
      or char_length(btrim(support_preference)) between 1 and 80
    ),
  add constraint child_profiles_next_time_plan_length
    check (
      last_next_time_plan is null
      or char_length(btrim(last_next_time_plan)) between 1 and 180
    );

alter table public.child_profile_insights
  add column practiced_strategies text[] not null default '{}'::text[],
  add column support_preference text,
  add column next_time_plan text;

alter table public.child_profile_insights
  add constraint child_profile_insights_practiced_strategy_cap
    check (
      cardinality(practiced_strategies) <= 5
      and char_length(array_to_string(practiced_strategies, '')) <= 400
    ),
  add constraint child_profile_insights_support_preference_length
    check (
      support_preference is null
      or char_length(btrim(support_preference)) between 1 and 80
    ),
  add constraint child_profile_insights_next_time_plan_length
    check (
      next_time_plan is null
      or char_length(btrim(next_time_plan)) between 1 and 180
    );

update public.child_profiles
set support_preference = 'two clear choices'
where is_synthetic and support_preference is null;

revoke all on function public.update_child_profile_atomic(text, text, text, text)
  from public, anon, authenticated;
drop function public.update_child_profile_atomic(text, text, text, text);

create function public.update_child_profile_atomic(
  p_child_id text,
  p_insight text,
  p_recurring_struggle text default null,
  p_preferred_grounding_strategy text default null,
  p_practiced_strategies text[] default '{}'::text[],
  p_support_preference text default null,
  p_next_time_plan text default null
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
  v_practiced text[];
  v_practice text;
  v_support text;
  v_plan text;
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

  v_support := nullif(btrim(p_support_preference), '');
  v_plan := nullif(btrim(p_next_time_plan), '');
  v_practiced := v_profile.practiced_strategies;

  foreach v_practice in array coalesce(p_practiced_strategies, '{}'::text[])
  loop
    v_practice := nullif(btrim(v_practice), '');
    if v_practice is not null and not (v_practice = any(v_practiced)) then
      v_practiced := array_append(v_practiced, v_practice);
    end if;
  end loop;

  if cardinality(v_practiced) > 5 then
    v_practiced := v_practiced[
      cardinality(v_practiced) - 4:cardinality(v_practiced)
    ];
  end if;

  insert into public.child_profile_insights (
    child_id,
    insight,
    practiced_strategies,
    support_preference,
    next_time_plan
  )
  values (
    p_child_id,
    btrim(p_insight),
    coalesce(p_practiced_strategies, '{}'::text[]),
    v_support,
    v_plan
  );

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
      practiced_strategies = v_practiced,
      support_preference = coalesce(v_support, support_preference),
      last_next_time_plan = coalesce(v_plan, last_next_time_plan),
      session_count = session_count + 1
  where child_id = p_child_id
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.update_child_profile_atomic(
  text,
  text,
  text,
  text,
  text[],
  text,
  text
) from public, anon, authenticated;
grant execute on function public.update_child_profile_atomic(
  text,
  text,
  text,
  text,
  text[],
  text,
  text
) to service_role;
