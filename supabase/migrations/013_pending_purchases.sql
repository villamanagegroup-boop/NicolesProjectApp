-- Clarity Portal — Migration 013
-- Stores Stripe purchases made before the user has an account.
-- On signup, the app claims any matching row by email and grants the path.

create table if not exists public.pending_purchases (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  path text not null check (path in ('A', 'B', 'C')),
  stripe_customer_id text,
  stripe_session_id text unique,
  price_id text,
  claimed_at timestamptz,
  created_at timestamptz default now()
);

-- Index so signup lookup is fast
create index if not exists pending_purchases_email_idx
  on public.pending_purchases (lower(email));

-- Service role only — no user-facing RLS needed
alter table public.pending_purchases enable row level security;
