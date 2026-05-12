-- 023_admin_messages.sql
-- Nicole-to-user broadcast system: one source of truth for the three
-- delivery channels (inbox / banner / pinned) plus a read-state table so
-- users can mark items as read or dismiss banners.
--
-- The existing circle_coach_messages table stays as-is for 1:1 DMs — the
-- new /inbox page merges that thread with broadcast messages addressed to
-- the user via audience filters, giving Nicole one composition surface
-- and the user one place to read everything.

-- ============================================================
-- 1. ADMIN_MESSAGES — one row per broadcast
-- ============================================================
create table if not exists public.admin_messages (
  id uuid primary key default gen_random_uuid(),

  -- Where the message renders. Pinned messages also need pinned_program_day.
  channel text not null check (channel in ('inbox', 'banner', 'pinned')),

  -- Display
  title text,
  body  text not null,

  -- Audience targeting. The user is in the audience when:
  --   (audience_user_ids is empty OR they're in the array)
  --   AND
  --   (audience_paths is empty OR their selected_path is in the array)
  -- Empty arrays mean "no filter" → all signed-in users.
  audience_paths    text[] not null default array[]::text[],
  audience_user_ids uuid[] not null default array[]::uuid[],

  -- Pinned channel only — which Seal-the-Leak day (1–7) this attaches to.
  -- For inbox/banner channels this stays NULL.
  pinned_program_day int check (pinned_program_day between 1 and 7),

  -- Lifecycle
  expires_at  timestamptz,
  archived_at timestamptz,

  -- Whether Nicole also wants this sent as an email at compose time.
  -- The send path is fire-and-forget; this column is just provenance.
  email_paired boolean not null default false,

  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_messages_active
  on public.admin_messages(channel, created_at desc)
  where archived_at is null;

-- ============================================================
-- 2. USER_MESSAGE_READS — per-user read + dismiss state
-- ============================================================
create table if not exists public.user_message_reads (
  user_id    uuid not null references public.users(id) on delete cascade,
  message_id uuid not null references public.admin_messages(id) on delete cascade,
  read_at      timestamptz,
  dismissed_at timestamptz,   -- banner-only; persisted dismissal
  primary key (user_id, message_id)
);

-- ============================================================
-- 3. AUDIENCE-MATCHING HELPER (used in RLS + queries)
-- ============================================================
-- Returns true when auth.uid()'s user row satisfies the audience filter on
-- the given message. Marked SECURITY DEFINER so it can read public.users
-- without bumping into per-user RLS recursion.
create or replace function public.message_is_for_me(msg public.admin_messages)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- 1. Not expired
    (msg.expires_at is null or msg.expires_at > now())
    and msg.archived_at is null
    and
    -- 2. Specific-user list (empty = no override; non-empty = must be in it)
    (
      cardinality(msg.audience_user_ids) = 0
      or auth.uid() = any(msg.audience_user_ids)
    )
    and
    -- 3. Path filter (empty = all paths)
    (
      cardinality(msg.audience_paths) = 0
      or exists (
        select 1 from public.users u
        where u.id = auth.uid()
          and u.selected_path = any(msg.audience_paths)
      )
    );
$$;

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================
alter table public.admin_messages      enable row level security;
alter table public.user_message_reads  enable row level security;

-- Admin: full access to admin_messages
drop policy if exists admin_messages_admin on public.admin_messages;
create policy admin_messages_admin on public.admin_messages
  for all using (public.is_circle_admin(auth.uid()))
  with check (public.is_circle_admin(auth.uid()));

-- User: can read messages addressed to them
drop policy if exists admin_messages_user_read on public.admin_messages;
create policy admin_messages_user_read on public.admin_messages
  for select using (public.message_is_for_me(admin_messages.*));

-- user_message_reads: each user owns their own row
drop policy if exists user_message_reads_own on public.user_message_reads;
create policy user_message_reads_own on public.user_message_reads
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admin can read read-state too (for analytics — % opened, etc.)
drop policy if exists user_message_reads_admin_read on public.user_message_reads;
create policy user_message_reads_admin_read on public.user_message_reads
  for select using (public.is_circle_admin(auth.uid()));
