-- ============================================================
-- SUPPORT MESSAGES — bug reports and help requests submitted
-- from the user-portal "Report a bug" button. Admins see them
-- in a triage queue; users only see their own.
-- ============================================================

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  page_path text,
  user_agent text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index if not exists idx_support_messages_status on public.support_messages (status, created_at desc);
create index if not exists idx_support_messages_user   on public.support_messages (user_id, created_at desc);

alter table public.support_messages enable row level security;

-- Users can read their own reports; admins can read everyone's.
drop policy if exists support_messages_select on public.support_messages;
create policy support_messages_select on public.support_messages
  for select using (auth.uid() = user_id or public.is_circle_admin(auth.uid()));

-- Anyone signed in can submit a report on their own behalf.
drop policy if exists support_messages_insert on public.support_messages;
create policy support_messages_insert on public.support_messages
  for insert with check (auth.uid() = user_id);

-- Admins resolve / update / delete; users cannot edit submitted reports.
drop policy if exists support_messages_admin_update on public.support_messages;
create policy support_messages_admin_update on public.support_messages
  for update using (public.is_circle_admin(auth.uid()))
  with check (public.is_circle_admin(auth.uid()));

drop policy if exists support_messages_admin_delete on public.support_messages;
create policy support_messages_admin_delete on public.support_messages
  for delete using (public.is_circle_admin(auth.uid()));
