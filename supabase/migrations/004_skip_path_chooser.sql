-- Clarity Portal — Migration 004
-- Adds a per-user preference: show the "Choose your path" welcome
-- screen on every sign-in, or skip it.

alter table public.users
  add column if not exists skip_path_chooser boolean default false;
