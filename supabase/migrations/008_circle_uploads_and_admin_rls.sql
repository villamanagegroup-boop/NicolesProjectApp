-- ============================================================
-- 008 — Admin write access + attachment columns
-- Fixes "new row violates row-level security policy" when admins
-- create cohorts, schedule calls, post coach notes, etc.
-- Adds photo + file attachment columns across community + chat tables.
-- Run after 007_admin_circle_features.sql.
-- ============================================================

-- ─── Admin write policies ─────────────────────────────────────
-- Each table already has member-scoped read/write; this adds an
-- "admins can do anything" override using the is_circle_admin() helper.

drop policy if exists cohorts_admin_all on public.circle_cohorts;
create policy cohorts_admin_all on public.circle_cohorts
  for all using (public.is_circle_admin(auth.uid()));

drop policy if exists members_admin_all on public.circle_members;
create policy members_admin_all on public.circle_members
  for all using (public.is_circle_admin(auth.uid()));

drop policy if exists weekly_content_admin_all on public.circle_weekly_content;
create policy weekly_content_admin_all on public.circle_weekly_content
  for all using (public.is_circle_admin(auth.uid()));

drop policy if exists live_calls_admin_all on public.circle_live_calls;
create policy live_calls_admin_all on public.circle_live_calls
  for all using (public.is_circle_admin(auth.uid()));

drop policy if exists posts_admin_all on public.circle_posts;
create policy posts_admin_all on public.circle_posts
  for all using (public.is_circle_admin(auth.uid()));

drop policy if exists partner_messages_admin_all on public.circle_partner_messages;
create policy partner_messages_admin_all on public.circle_partner_messages
  for all using (public.is_circle_admin(auth.uid()));

drop policy if exists progress_admin_all on public.circle_member_progress;
create policy progress_admin_all on public.circle_member_progress
  for all using (public.is_circle_admin(auth.uid()));

drop policy if exists reactions_admin_all on public.circle_reactions;
create policy reactions_admin_all on public.circle_reactions
  for all using (public.is_circle_admin(auth.uid()));

-- ─── Attachment columns ───────────────────────────────────────
-- Audio + video already exist on circle_posts. We're adding image
-- and arbitrary-file slots, plus the same set on partner + coach
-- messages so chats can carry the same media types.

alter table public.circle_posts
  add column if not exists image_url text,
  add column if not exists file_url  text,
  add column if not exists file_name text;

alter table public.circle_partner_messages
  add column if not exists image_url text,
  add column if not exists video_url text,
  add column if not exists file_url  text,
  add column if not exists file_name text;

alter table public.circle_coach_messages
  add column if not exists image_url text,
  add column if not exists file_url  text,
  add column if not exists file_name text;
