-- ============================================================
-- 012 — Server-side Seal-the-Leak reflections
-- The /program/today page used to keep reflections in localStorage,
-- which meant admins couldn't see them. Move them to a real table
-- so admin/members/[id] can render them alongside journal entries.
-- ============================================================

create table if not exists public.stl_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  route_id text not null,
  day_number int not null check (day_number between 1 and 7),
  item_index int not null check (item_index >= 0),
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, route_id, day_number, item_index)
);

create index if not exists idx_stl_reflections_user
  on public.stl_reflections (user_id, day_number);

alter table public.stl_reflections enable row level security;

drop policy if exists stl_reflections_self on public.stl_reflections;
create policy stl_reflections_self on public.stl_reflections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists stl_reflections_admin_select on public.stl_reflections;
create policy stl_reflections_admin_select on public.stl_reflections
  for select using (public.is_circle_admin(auth.uid()));
