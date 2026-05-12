-- 022_notification_prefs.sql
-- Adds a JSONB column to track each user's notification preferences.
-- One JSONB lets us add new flags later without further migrations — every
-- key is treated as opt-in by default, with the app providing the defaults
-- when reading via the DEFAULT_NOTIFICATION_PREFS constant.
--
-- Backfills existing rows so the Settings page reads the right default
-- state for users created before this column existed.

alter table public.users
  add column if not exists notification_prefs jsonb not null default jsonb_build_object(
    'daily_reminder',   true,
    'weekly_digest',    true,
    'milestone_alerts', true
  );

-- Re-affirm defaults on any rows that were created with this column missing
-- and somehow ended up with NULL or an empty object.
update public.users
   set notification_prefs = jsonb_build_object(
     'daily_reminder',   true,
     'weekly_digest',    true,
     'milestone_alerts', true
   )
 where notification_prefs is null
    or notification_prefs = '{}'::jsonb;
