-- Clarity Portal — Migration 014
-- Tracks whether the user has seen the first-login welcome modal.

alter table public.users
  add column if not exists has_seen_welcome boolean default false;
