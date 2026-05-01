-- ============================================================
-- 016 — user_tags
-- Lightweight tagging for users so admins can group people
-- across paths (e.g. "VIP", "needs follow-up", "press contact",
-- "comp account", "beta tester"). Tags are admin-managed.
-- ============================================================

-- Tag definitions
create table if not exists public.user_tags (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  color       text not null default 'gold',  -- gold | green | red | blue | gray
  created_at  timestamptz default now(),
  unique (label)
);

-- Assignments (many-to-many)
create table if not exists public.user_tag_assignments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  tag_id       uuid not null references public.user_tags(id) on delete cascade,
  assigned_at  timestamptz default now(),
  assigned_by  uuid references public.users(id) on delete set null,
  unique (user_id, tag_id)
);

create index if not exists user_tag_assignments_user_idx
  on public.user_tag_assignments(user_id);
create index if not exists user_tag_assignments_tag_idx
  on public.user_tag_assignments(tag_id);

-- RLS
alter table public.user_tags enable row level security;
alter table public.user_tag_assignments enable row level security;

-- Admins can read + write tags
create policy "Admins can manage tags"
  on public.user_tags for all
  using (exists (select 1 from public.admin_roles where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_roles where user_id = auth.uid()));

create policy "Admins can manage tag assignments"
  on public.user_tag_assignments for all
  using (exists (select 1 from public.admin_roles where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_roles where user_id = auth.uid()));

-- Seed a couple of useful starters so the UI has something to show
insert into public.user_tags (label, color) values
  ('VIP', 'gold'),
  ('Comp account', 'green'),
  ('Press', 'blue'),
  ('Needs follow-up', 'red')
on conflict (label) do nothing;
