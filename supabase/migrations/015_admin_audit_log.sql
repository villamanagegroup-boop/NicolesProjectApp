-- ============================================================
-- 015 — admin_audit_log
-- Tracks who did what across the admin portal.
-- Pure scaffolding — read it whenever you need to investigate a change.
-- The app writes to this table opportunistically; if it's missing,
-- the helper soft-fails and admin actions still complete.
-- ============================================================

create table if not exists public.admin_audit_log (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references public.users(id) on delete set null,
  actor_email   text,
  action        text not null,           -- e.g. 'user.update', 'purchase.claim', 'cohort.create'
  resource_type text,                    -- e.g. 'user', 'purchase', 'cohort'
  resource_id   text,
  changes       jsonb,                   -- before/after diff or input payload
  created_at    timestamptz default now()
);

create index if not exists admin_audit_log_actor_idx
  on public.admin_audit_log(actor_id, created_at desc);
create index if not exists admin_audit_log_resource_idx
  on public.admin_audit_log(resource_type, resource_id);
create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log(created_at desc);

-- RLS — only admins can read, anyone authenticated can insert their own row
alter table public.admin_audit_log enable row level security;

create policy "Admins can read audit log"
  on public.admin_audit_log for select
  using (exists (
    select 1 from public.admin_roles where user_id = auth.uid()
  ));

create policy "Authenticated can write own audit row"
  on public.admin_audit_log for insert
  with check (auth.uid() = actor_id);
