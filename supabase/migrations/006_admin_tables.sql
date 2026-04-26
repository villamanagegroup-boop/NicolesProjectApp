-- ============================================================
-- THE CIRCLE — Admin Panel Schema (006)
-- Adapted to existing tables: circle_cohorts (not "cohorts"),
-- users (not "profiles"), receiver_id (not "recipient_id"),
-- circle_weekly_content (not "circle_content").
-- Run AFTER 003_circle_cohorts.sql and 005_cards_addon.sql.
-- ============================================================

-- 1. ADMIN ROLES — who can access /admin and what they can do
create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  role text not null default 'assistant'
    check (role in ('owner', 'assistant')),
  -- Granular permissions for assistants
  can_view_members          boolean default true,
  can_message_members       boolean default true,
  can_manage_pairs          boolean default false,
  can_view_financials       boolean default false,
  can_view_journal_entries  boolean default false,
  can_view_coaching_notes   boolean default false,
  can_manage_content        boolean default false,
  can_manage_cohorts        boolean default false,
  created_at timestamptz default now()
);

-- 2. COACHING NOTES — private per-member notes (admin-only visibility via RLS)
create table if not exists public.circle_coaching_notes (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.circle_members(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  note text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. ENGAGEMENT ALERTS — auto-generated when members go quiet
create table if not exists public.circle_engagement_alerts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.circle_members(id) on delete cascade,
  cohort_id uuid not null references public.circle_cohorts(id) on delete cascade,
  alert_level text not null check (alert_level in ('amber','orange','red')),
  reason text not null,
  days_inactive int not null,
  is_resolved boolean default false,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  snoozed_until timestamptz,
  created_at timestamptz default now()
);

-- 4. MESSAGE TEMPLATES — pre-written messages with token substitution
create table if not exists public.admin_message_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trigger_type text not null
    check (trigger_type in ('manual','enrollment','pairing','repair','at_risk','graduation','work_invite')),
  subject text,
  body text not null,
  channel text not null default 'both'
    check (channel in ('in_app','email','both')),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 5. SENT MESSAGES LOG — record of every admin message
create table if not exists public.admin_sent_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id),
  recipient_id uuid not null references public.circle_members(id) on delete cascade,
  template_id uuid references public.admin_message_templates(id),
  subject text,
  body text not null,
  channel text not null,
  sent_at timestamptz default now(),
  is_read boolean default false,
  read_at timestamptz
);

-- 6. ANNOUNCEMENTS — broadcast to whole cohort or filtered subset
create table if not exists public.admin_announcements (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.circle_cohorts(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  title text not null,
  body text not null,
  target_archetype text,   -- null = all archetypes
  target_status text,      -- null = all; 'at_risk' | 'quiet' | 'active'
  channel text not null default 'both',
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- 7. REPAIR REQUESTS — Day-30 re-pair requests through approval
create table if not exists public.circle_repair_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.circle_members(id) on delete cascade,
  cohort_id uuid not null references public.circle_cohorts(id) on delete cascade,
  original_partner_id uuid references public.circle_members(id),
  new_partner_id uuid references public.circle_members(id),
  status text not null default 'pending'
    check (status in ('pending','approved','denied')),
  reason text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- 8. TRANSFORMATION STORIES — submitted at end of 90 days, optional public sharing
create table if not exists public.circle_transformation_stories (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.circle_members(id) on delete cascade,
  cohort_id uuid not null references public.circle_cohorts(id) on delete cascade,
  body text not null,
  is_shared_publicly boolean default false,
  submitted_at timestamptz default now(),
  unique(member_id, cohort_id)
);

-- ============================================================
-- RLS — admin tables only readable by admins
-- ============================================================

alter table public.admin_roles                   enable row level security;
alter table public.circle_coaching_notes         enable row level security;
alter table public.circle_engagement_alerts      enable row level security;
alter table public.admin_message_templates       enable row level security;
alter table public.admin_sent_messages           enable row level security;
alter table public.admin_announcements           enable row level security;
alter table public.circle_repair_requests        enable row level security;
alter table public.circle_transformation_stories enable row level security;

-- Helper: is this user listed in admin_roles?
create or replace function public.is_circle_admin(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_roles where user_id = uid)
$$;

-- A user can read their own admin_roles row; admins can read all.
drop policy if exists admin_roles_self_or_admin on public.admin_roles;
create policy admin_roles_self_or_admin on public.admin_roles
  for select using (auth.uid() = user_id or public.is_circle_admin(auth.uid()));

drop policy if exists admin_roles_admin_write on public.admin_roles;
create policy admin_roles_admin_write on public.admin_roles
  for all using (public.is_circle_admin(auth.uid()));

drop policy if exists coaching_notes_admin on public.circle_coaching_notes;
create policy coaching_notes_admin on public.circle_coaching_notes
  for all using (public.is_circle_admin(auth.uid()));

drop policy if exists alerts_admin on public.circle_engagement_alerts;
create policy alerts_admin on public.circle_engagement_alerts
  for all using (public.is_circle_admin(auth.uid()));

drop policy if exists templates_admin on public.admin_message_templates;
create policy templates_admin on public.admin_message_templates
  for all using (public.is_circle_admin(auth.uid()));

drop policy if exists sent_messages_admin on public.admin_sent_messages;
create policy sent_messages_admin on public.admin_sent_messages
  for all using (public.is_circle_admin(auth.uid()));

drop policy if exists announcements_admin on public.admin_announcements;
create policy announcements_admin on public.admin_announcements
  for all using (public.is_circle_admin(auth.uid()));

-- Members can request a re-pair for themselves; admins see all
drop policy if exists repairreq_admin_or_own on public.circle_repair_requests;
create policy repairreq_admin_or_own on public.circle_repair_requests
  for all using (
    public.is_circle_admin(auth.uid()) or
    requester_id in (select id from public.circle_members where user_id = auth.uid())
  );

-- Members can submit/read their own story; admins see all
drop policy if exists transformation_admin_or_own on public.circle_transformation_stories;
create policy transformation_admin_or_own on public.circle_transformation_stories
  for all using (
    public.is_circle_admin(auth.uid()) or
    member_id in (select id from public.circle_members where user_id = auth.uid())
  );

-- ============================================================
-- FUNCTION: compute engagement alerts
-- Recomputes amber/orange/red based on activity recency.
-- Run daily via pg_cron or manually: select compute_engagement_alerts();
-- ============================================================

create or replace function public.compute_engagement_alerts()
returns void language plpgsql security definer set search_path = public as $$
declare
  r record;
  days_since int;
  lvl text;
begin
  -- Clear old unresolved alerts that aren't currently snoozed
  delete from public.circle_engagement_alerts
  where is_resolved = false
    and (snoozed_until is null or snoozed_until < now());

  -- For every member of every active cohort
  for r in
    select
      cm.id as member_id,
      cm.cohort_id,
      coalesce(
        greatest(
          (select max(completed_at) from public.circle_member_progress where member_id = cm.id),
          (select max(created_at) from public.circle_posts where author_id = cm.user_id),
          (select max(created_at) from public.circle_partner_messages where sender_id = cm.user_id)
        ),
        cm.joined_at
      ) as last_active
    from public.circle_members cm
    join public.circle_cohorts c on c.id = cm.cohort_id
    where c.is_active = true
  loop
    days_since := extract(day from now() - r.last_active)::int;

    if    days_since >= 10 then lvl := 'red';
    elsif days_since >= 7  then lvl := 'orange';
    elsif days_since >= 5  then lvl := 'amber';
    else continue;
    end if;

    insert into public.circle_engagement_alerts
      (member_id, cohort_id, alert_level, reason, days_inactive)
    values
      (r.member_id, r.cohort_id, lvl,
       'No activity in ' || days_since || ' days', days_since)
    on conflict do nothing;
  end loop;
end;
$$;

-- ============================================================
-- SEED: default message templates (only insert if empty)
-- ============================================================

insert into public.admin_message_templates (name, trigger_type, subject, body, channel)
select * from (values
(
  'Welcome to The Circle',
  'enrollment',
  E'You\'re in — welcome to The Circle 🌿',
  E'Hey {{member_name}},\n\nYou\'re officially in The Circle. I am so glad you\'re here.\n\nYour cohort starts {{cohort_start_date}}. Between now and then, here\'s what to do:\n\n1. Complete your intake if you haven\'t already — your accountability partner pairing depends on it\n2. Introduce yourself in the community feed when you\'re ready\n3. Come to our first live call ready to share your 90-day focus in one sentence\n\nI\'ll be with you every step of this. See you inside.\n\nWith you,\n[Your name]',
  'both'
),
(
  'Partner introduction',
  'pairing',
  'Meet your accountability partner',
  E'Hey {{member_name}},\n\nYour accountability partner is {{partner_name}}.\n\nHere\'s what you should know about them:\n- Archetype: {{partner_archetype}}\n- 90-day focus: {{partner_goal}}\n\nReach out to them inside the app this week — say hello and share your 90-day focus with each other. Your Wednesday check-ins start Week 1.\n\nYou two were matched intentionally. Trust the pairing.\n\nWith you,\n[Your name]',
  'both'
),
(
  'Day 4 check-in',
  'manual',
  'Checking in — how are you doing?',
  E'Hey {{member_name}},\n\nYou\'re four weeks in. I want to ask you something directly:\n\nHow are you actually doing?\n\nNot the performed version — the real one. What\'s shifted? What\'s still feeling stuck? What has surprised you?\n\nReply here or message me in the app. I read everything.\n\nWith you,\n[Your name]',
  'in_app'
),
(
  'At-risk check-in',
  'at_risk',
  E'I noticed you\'ve been quiet',
  E'Hey {{member_name}},\n\nI noticed you\'ve been quiet for a few days and I wanted to reach out — not to pressure you, but because I see you and I want to make sure you\'re okay.\n\nLife interrupts. That\'s not a reason to disappear from the program — it\'s exactly what the program is designed to help with.\n\nIf something came up, tell me. If you need a different kind of support right now, tell me that too. You don\'t have to manage this alone.\n\nI\'m here.\n\n[Your name]',
  'both'
),
(
  'Graduation',
  'graduation',
  E'You did it — 90 days 🌿',
  E'Hey {{member_name}},\n\n90 days ago you walked into The Circle with a pattern you were ready to change.\n\nToday you walk out as someone different. Not dramatically — but unmistakably.\n\nI watched you show up. I watched you do the hard days. I watched you prove something to yourself that no one can take back.\n\nThank you for trusting this process — and for trusting me.\n\nThe next step is in your inbox. Whatever you choose next, know that what you built here is yours.\n\nWith all the love,\n[Your name]',
  'both'
),
(
  'The Work invitation',
  'work_invite',
  E'The next level — when you\'re ready',
  E'Hey {{member_name}},\n\nThe 90 days cracked something open for you. I\'ve watched it happen.\n\nThe Work is where you walk all the way through it — not in a group, but with me, directly, one-on-one, over 90 days.\n\nThis isn\'t for everyone. It\'s for the woman who knows the pattern is real and is ready to shift it at the root — not just interrupt it.\n\nIf that\'s you, reply to this message and we\'ll set up a conversation. No application process. Just a real talk about where you are and where you want to go.\n\nI have one space right now.\n\n[Your name]',
  'both'
)
) as v(name, trigger_type, subject, body, channel)
where not exists (select 1 from public.admin_message_templates);
