-- Synthetic, non-PII demo profiles. This file is safe to run repeatedly after
-- a local `supabase db reset` and intentionally restores an unlocked baseline.
insert into public.child_profiles (
  child_id,
  recurring_struggles,
  preferred_grounding_strategy,
  practiced_strategies,
  support_preference,
  last_next_time_plan,
  session_count,
  locked,
  locked_at,
  is_synthetic
)
values
  (
    'demo-sharing',
    array['sharing and taking turns'],
    'one slow belly breath',
    '{}'::text[],
    'two clear choices',
    null,
    0,
    false,
    null,
    true
  ),
  (
    'demo-mistakes',
    array['making mistakes', 'wanting to give up'],
    'shake hands out',
    '{}'::text[],
    'two clear choices',
    null,
    0,
    false,
    null,
    true
  ),
  (
    'demo-change',
    array['unexpected changes'],
    'name five things you can see',
    '{}'::text[],
    'two clear choices',
    null,
    0,
    false,
    null,
    true
  )
on conflict (child_id) do update
set recurring_struggles = excluded.recurring_struggles,
    preferred_grounding_strategy = excluded.preferred_grounding_strategy,
    practiced_strategies = excluded.practiced_strategies,
    support_preference = excluded.support_preference,
    last_next_time_plan = excluded.last_next_time_plan,
    session_count = excluded.session_count,
    locked = excluded.locked,
    locked_at = excluded.locked_at,
    is_synthetic = excluded.is_synthetic;

delete from public.child_profile_insights
where child_id in ('demo-sharing', 'demo-mistakes', 'demo-change');

delete from public.safety_handoffs
where child_id in ('demo-sharing', 'demo-mistakes', 'demo-change');
