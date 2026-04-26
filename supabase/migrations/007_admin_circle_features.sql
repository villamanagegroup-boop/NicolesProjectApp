-- ============================================================
-- 007 — Admin Circle features
-- Adds: coach 1:1 messaging, video on community posts,
-- admin RLS override for partner messages, Storage bucket.
-- Run after 006_admin_tables.sql.
-- ============================================================

-- 1. Video on community posts
alter table public.circle_posts
  add column if not exists video_url text;

-- 2. Coach 1:1 messages between an admin (the coach) and a single member.
--    A "thread" is keyed by user_id (the member). Either party can post.
create table if not exists public.circle_coach_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,  -- whose thread
  sender_id   uuid not null references auth.users(id),                       -- coach OR member
  body        text not null,
  audio_url   text,
  video_url   text,
  read_at     timestamptz,
  created_at  timestamptz default now()
);

create index if not exists idx_circle_coach_messages_user
  on public.circle_coach_messages(user_id, created_at desc);

alter table public.circle_coach_messages enable row level security;

-- Member sees + writes only their own thread; admin sees + writes all threads.
drop policy if exists coach_messages_member_or_admin on public.circle_coach_messages;
create policy coach_messages_member_or_admin on public.circle_coach_messages
  for all using (
    user_id = auth.uid() or public.is_circle_admin(auth.uid())
  )
  with check (
    -- Member can only insert into their own thread
    -- Admin can insert into any thread
    (user_id = auth.uid() and sender_id = auth.uid())
    or public.is_circle_admin(auth.uid())
  );

-- 3. Admins can read every partner message (members still scoped to their own).
--    The existing "messages_own" policy stays; this adds an OR-with admin.
drop policy if exists messages_admin_read on public.circle_partner_messages;
create policy messages_admin_read on public.circle_partner_messages
  for select using (public.is_circle_admin(auth.uid()));

-- 4. Storage bucket for community uploads (videos, voice notes).
--    The bucket is public-read so URLs work in <video>/<audio> tags;
--    writes are gated to authenticated users.
insert into storage.buckets (id, name, public)
values ('circle-uploads', 'circle-uploads', true)
on conflict (id) do nothing;

-- Storage RLS — anyone authenticated can upload to their own folder;
-- everyone (including anon) can read.
drop policy if exists "circle_uploads_read" on storage.objects;
create policy "circle_uploads_read" on storage.objects
  for select using (bucket_id = 'circle-uploads');

drop policy if exists "circle_uploads_write" on storage.objects;
create policy "circle_uploads_write" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'circle-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "circle_uploads_delete_own" on storage.objects;
create policy "circle_uploads_delete_own" on storage.objects
  for delete to authenticated using (
    bucket_id = 'circle-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
