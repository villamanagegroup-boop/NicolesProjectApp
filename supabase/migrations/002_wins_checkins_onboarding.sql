-- Clarity Portal — Migration 002
-- Adds wins, daily_check_ins, onboarding_assessments, quiz_leads
-- Widens users.selected_path to allow 'C'; adds admin, avatar, onboarding_complete fields

-- ============================================================
-- USERS: widen path + new fields
-- ============================================================

alter table public.users
  drop constraint if exists users_selected_path_check;

alter table public.users
  add constraint users_selected_path_check
  check (selected_path in ('A', 'B', 'C'));

alter table public.users add column if not exists is_admin boolean default false;
alter table public.users add column if not exists avatar_url text;
alter table public.users add column if not exists onboarding_complete boolean default false;

-- ============================================================
-- WINS
-- ============================================================

create table if not exists public.wins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  category text not null check (category in ('boundary', 'choice', 'moment', 'growth')),
  title text not null,
  description text,
  created_at timestamptz default now()
);

create index if not exists wins_user_id_idx on public.wins(user_id, created_at desc);

alter table public.wins enable row level security;

create policy "Users can manage own wins"
  on public.wins for all using (auth.uid() = user_id);

-- ============================================================
-- DAILY CHECK-INS
-- ============================================================

create table if not exists public.daily_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  check_in_date date not null default current_date,
  mood text not null check (mood in ('aligned', 'clear', 'drained', 'overwhelmed', 'disconnected')),
  created_at timestamptz default now(),
  unique (user_id, check_in_date)
);

create index if not exists check_ins_user_date_idx
  on public.daily_check_ins(user_id, check_in_date desc);

alter table public.daily_check_ins enable row level security;

create policy "Users can manage own check-ins"
  on public.daily_check_ins for all using (auth.uid() = user_id);

-- ============================================================
-- ONBOARDING ASSESSMENTS
-- ============================================================

create table if not exists public.onboarding_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null unique,
  archetype text check (archetype in ('door', 'throne', 'engine', 'push')),
  ennea text check (ennea in ('1','2','3','4','5','6','7','8','9')),
  attach text check (attach in ('secure', 'anxious', 'avoidant', 'disorganized')),
  acct_feel text,
  feedback text check (feedback in ('straight', 'context', 'written', 'example')),
  goal text,
  completed_at timestamptz default now()
);

alter table public.onboarding_assessments enable row level security;

create policy "Users can manage own assessment"
  on public.onboarding_assessments for all using (auth.uid() = user_id);

-- ============================================================
-- QUIZ LEADS (pre-signup funnel)
-- ============================================================

create table if not exists public.quiz_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  quiz_result text check (quiz_result in ('seeker', 'builder', 'healer', 'visionary')),
  answers_json jsonb,
  created_at timestamptz default now()
);

create index if not exists quiz_leads_email_idx on public.quiz_leads(email);

alter table public.quiz_leads enable row level security;

-- Anyone can insert a lead (pre-signup); nobody can read back except service role
create policy "Anyone can submit a quiz lead"
  on public.quiz_leads for insert with check (true);

-- ============================================================
-- AUTO-PROVISION PUBLIC.USERS ROW ON AUTH SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, signup_date)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
