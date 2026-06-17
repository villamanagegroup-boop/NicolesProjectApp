-- 037_digest_tracking.sql
-- Tracks when each user last received the daily "what's new" digest.
-- The daily-digest cron (app/api/cron/daily-digest) uses this as the
-- "new since" window start, and advances it after each run (sent or empty)
-- so a user never gets the same item twice.

alter table public.users
  add column if not exists last_digest_sent_at timestamptz;
