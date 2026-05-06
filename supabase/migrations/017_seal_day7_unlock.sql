-- Clarity Portal — Migration 017
-- Adds the "30 days of Cards after Day 7" unlock model.
--
-- Why three columns:
--   cards_addon_expires_at   The hard cutoff when access flips to upgrade-prompt.
--                            NULL = never expires (legacy add-on grants stay open).
--   cards_addon_source       How the unlock got granted, so we can route alerts
--                            ('seal_day7' triggers the conversion email; 'manual'
--                            and 'stripe' bypass it).
--   seal_completed_at        First moment the user sealed Day 7 on their own
--                            archetype path. Drives admin alerts + analytics.
--
-- All three are nullable. Existing rows stay correct: anyone already on the
-- add-on remains unlimited because cards_addon_expires_at is NULL.

alter table public.users
  add column if not exists cards_addon_expires_at timestamptz,
  add column if not exists cards_addon_source     text
    check (cards_addon_source in ('seal_day7', 'stripe', 'manual') or cards_addon_source is null),
  add column if not exists seal_completed_at      timestamptz;

-- Index for the daily expiry sweep (cron).
create index if not exists users_cards_addon_expires_at_idx
  on public.users (cards_addon_expires_at)
  where cards_addon_expires_at is not null;
