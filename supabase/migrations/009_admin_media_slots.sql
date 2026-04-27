-- ============================================================
-- ADMIN MEDIA SLOTS — admin-curated media in fixed positions
-- across the three programs (cards / work / circle).
--
-- One row per (program, slot_key) pair. The user portals look up
-- by slot_key and render whatever's there; admins write through
-- /admin/content. RLS keeps writes admin-only.
-- ============================================================

create table if not exists public.admin_media_slots (
  id uuid primary key default gen_random_uuid(),
  slot_key text unique not null,
  program text not null check (program in ('cards', 'work', 'circle')),
  media_type text not null check (media_type in ('video', 'audio', 'image')),
  media_url text not null,
  title text,
  caption text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_admin_media_slots_program on public.admin_media_slots (program);

alter table public.admin_media_slots enable row level security;

-- Anyone signed in can read slot media — that's the point: members see it.
drop policy if exists media_slots_read on public.admin_media_slots;
create policy media_slots_read on public.admin_media_slots
  for select using (auth.uid() is not null);

-- Only admins can write. is_circle_admin() lives in 006_admin_tables.sql.
drop policy if exists media_slots_admin_insert on public.admin_media_slots;
create policy media_slots_admin_insert on public.admin_media_slots
  for insert with check (public.is_circle_admin(auth.uid()));

drop policy if exists media_slots_admin_update on public.admin_media_slots;
create policy media_slots_admin_update on public.admin_media_slots
  for update using (public.is_circle_admin(auth.uid()))
  with check (public.is_circle_admin(auth.uid()));

drop policy if exists media_slots_admin_delete on public.admin_media_slots;
create policy media_slots_admin_delete on public.admin_media_slots
  for delete using (public.is_circle_admin(auth.uid()));
