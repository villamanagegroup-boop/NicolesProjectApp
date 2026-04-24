-- Clarity Portal — Migration 005
-- Path A users can add Daily Cards as an add-on from Settings.
-- When they click "Add", we write the timestamp here; that date becomes
-- their Cards Day 1 (no Day-6 teaser gate applies from that point on).

alter table public.users
  add column if not exists cards_addon_started_at timestamptz;
