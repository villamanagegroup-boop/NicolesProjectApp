-- Clarity Portal — Initial Schema
-- Run this in your Supabase SQL editor or via supabase db push

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- users (extends auth.users)
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  email text,
  quiz_result text check (quiz_result in ('seeker', 'builder', 'healer', 'visionary')),
  selected_path text check (selected_path in ('A', 'B')),
  signup_date timestamptz default now(),
  stripe_customer_id text,
  has_paid boolean default false,
  created_at timestamptz default now()
);

-- daily_cards
create table if not exists public.daily_cards (
  id uuid primary key default gen_random_uuid(),
  day_number int unique not null,
  theme text not null,
  title text not null,
  body_text text,
  affirmation text,
  journal_prompt text,
  image_url text,
  card_color text default '#1a2e20',
  emoji text,
  created_at timestamptz default now()
);

-- journal_entries
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  card_id uuid references public.daily_cards(id),
  day_number int,
  content text,
  created_at timestamptz default now()
);

-- program_modules
create table if not exists public.program_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  order_index int not null,
  created_at timestamptz default now()
);

-- program_lessons
create table if not exists public.program_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.program_modules(id) on delete cascade,
  title text not null,
  description text,
  video_url text,
  duration_minutes int,
  order_index int not null,
  created_at timestamptz default now()
);

-- lesson_progress
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  lesson_id uuid references public.program_lessons(id) on delete cascade,
  completed_at timestamptz default now(),
  unique(user_id, lesson_id)
);

-- daily_quotes
create table if not exists public.daily_quotes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  source text,
  active boolean default true
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users enable row level security;
alter table public.journal_entries enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.daily_cards enable row level security;
alter table public.daily_quotes enable row level security;
alter table public.program_modules enable row level security;
alter table public.program_lessons enable row level security;

-- Users: own row only
create policy "Users can view own profile"
  on public.users for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert with check (auth.uid() = id);

-- Journal entries: own rows only
create policy "Users can manage own journal entries"
  on public.journal_entries for all using (auth.uid() = user_id);

-- Lesson progress: own rows only
create policy "Users can manage own lesson progress"
  on public.lesson_progress for all using (auth.uid() = user_id);

-- Daily cards: all authenticated users can read
create policy "Authenticated users can read daily cards"
  on public.daily_cards for select using (auth.role() = 'authenticated');

-- Daily quotes: all authenticated users can read
create policy "Authenticated users can read daily quotes"
  on public.daily_quotes for select using (auth.role() = 'authenticated');

-- Program modules: authenticated users where has_paid = true OR selected_path = 'B'
create policy "Paid users can read program modules"
  on public.program_modules for select using (
    auth.role() = 'authenticated' AND (
      exists (
        select 1 from public.users
        where id = auth.uid()
        and (has_paid = true or selected_path = 'B')
      )
    )
  );

-- Program lessons: same as modules
create policy "Paid users can read program lessons"
  on public.program_lessons for select using (
    auth.role() = 'authenticated' AND (
      exists (
        select 1 from public.users
        where id = auth.uid()
        and (has_paid = true or selected_path = 'B')
      )
    )
  );
