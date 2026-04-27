-- ============================================================
-- 011 — Admin user management
-- Admins can read and update any public.users row so they can
-- fix names, emails, avatars, plan flags from /admin/members/[id].
-- Adds the same admin override on journal_entries and wins so the
-- admin profile view's recent-activity section keeps working under
-- RLS without leaking via the user policy.
-- ============================================================

drop policy if exists users_admin_select on public.users;
create policy users_admin_select on public.users
  for select using (public.is_circle_admin(auth.uid()));

drop policy if exists users_admin_update on public.users;
create policy users_admin_update on public.users
  for update using (public.is_circle_admin(auth.uid()))
  with check (public.is_circle_admin(auth.uid()));

drop policy if exists journal_entries_admin_select on public.journal_entries;
create policy journal_entries_admin_select on public.journal_entries
  for select using (public.is_circle_admin(auth.uid()));

drop policy if exists wins_admin_select on public.wins;
create policy wins_admin_select on public.wins
  for select using (public.is_circle_admin(auth.uid()));

drop policy if exists check_ins_admin_select on public.daily_check_ins;
create policy check_ins_admin_select on public.daily_check_ins
  for select using (public.is_circle_admin(auth.uid()));
