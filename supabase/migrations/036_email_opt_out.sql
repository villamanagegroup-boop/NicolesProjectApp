-- 036_email_opt_out.sql
-- Global email suppression for the email-control module.
--
-- Adds a master "stop all non-critical email to this user" flag, separate from
-- the per-category notification_prefs (022). It's set by:
--   * the one-click "unsubscribe from all" link / List-Unsubscribe header
--     (app/api/unsubscribe, kind = 'all'), and
--   * the admin "remove from all email" tool (app/api/admin/email-opt-out).
--
-- canEmailUser() (lib/email/guard.ts) reads this before every send, so honoring
-- it requires no further code once this column exists.

alter table public.users
  add column if not exists email_opt_out boolean not null default false;

alter table public.users
  add column if not exists email_opt_out_at timestamptz;

-- Fast lookups when filtering out opted-out users in bulk dispatch.
create index if not exists users_email_opt_out_idx
  on public.users (email_opt_out)
  where email_opt_out = true;
