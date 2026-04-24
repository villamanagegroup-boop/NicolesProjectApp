-- ============================================================
-- THE CIRCLE — SUPABASE MIGRATION (003)
-- Cohort-based coaching sub-app. All tables prefixed circle_*
-- so they don't collide with anything existing.
-- Run this in the Supabase SQL editor.
-- ============================================================

-- 1. COHORTS — one row per 90-day cohort run
CREATE TABLE IF NOT EXISTS circle_cohorts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  starts_at     DATE NOT NULL,
  ends_at       DATE NOT NULL,
  is_active     BOOLEAN DEFAULT false,
  max_members   INT DEFAULT 16,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. CIRCLE MEMBERS — links a user to a cohort; holds intake answers
CREATE TABLE IF NOT EXISTS circle_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cohort_id        UUID NOT NULL REFERENCES circle_cohorts(id) ON DELETE CASCADE,
  archetype        TEXT NOT NULL CHECK (archetype IN ('door','throne','engine','push')),
  enneagram_type   TEXT,
  attachment_style TEXT CHECK (attachment_style IN ('secure','anxious','avoidant','disorganized')),
  feedback_pref    TEXT CHECK (feedback_pref IN ('straight','context','written','example')),
  goal_90day       TEXT,
  partner_id       UUID REFERENCES circle_members(id),
  joined_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, cohort_id)
);

-- 3. WEEKLY CONTENT — 12 weeks × 5 tracks (universal + 4 archetypes)
CREATE TABLE IF NOT EXISTS circle_weekly_content (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id        UUID REFERENCES circle_cohorts(id) ON DELETE CASCADE,
  week_number      INT NOT NULL CHECK (week_number BETWEEN 1 AND 12),
  archetype        TEXT NOT NULL CHECK (archetype IN ('universal','door','throne','engine','push')),
  month_name       TEXT NOT NULL CHECK (month_name IN ('root','rebuild','rise')),
  week_title       TEXT NOT NULL,
  teaching         TEXT,
  journal_prompt   TEXT,
  weekly_action    TEXT,
  monday_prompt    TEXT,
  wednesday_prompt TEXT,
  friday_prompt    TEXT,
  video_url        TEXT,
  live_call_week   BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cohort_id, week_number, archetype)
);

-- 4. MEMBER PROGRESS — per-week completion flags + journal entry
CREATE TABLE IF NOT EXISTS circle_member_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id         UUID NOT NULL REFERENCES circle_members(id) ON DELETE CASCADE,
  week_number       INT NOT NULL,
  journal_completed BOOLEAN DEFAULT false,
  action_completed  BOOLEAN DEFAULT false,
  journal_entry     TEXT,
  completed_at      TIMESTAMPTZ,
  UNIQUE(member_id, week_number)
);

-- 5. COMMUNITY POSTS — wins, monday notes, partner check-ins, etc.
CREATE TABLE IF NOT EXISTS circle_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id   UUID NOT NULL REFERENCES circle_cohorts(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_type   TEXT NOT NULL CHECK (post_type IN ('wins','monday_prompt','partner_checkin','general','coach_note')),
  week_number INT,
  body        TEXT NOT NULL,
  audio_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 6. POST REACTIONS — emoji reactions on posts
CREATE TABLE IF NOT EXISTS circle_reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES circle_posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL DEFAULT '❤️',
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

-- 7. PARTNER MESSAGES — DMs between paired members
CREATE TABLE IF NOT EXISTS circle_partner_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cohort_id   UUID NOT NULL REFERENCES circle_cohorts(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  audio_url   TEXT,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 8. LIVE CALLS — Zoom + recording schedule
CREATE TABLE IF NOT EXISTS circle_live_calls (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id     UUID NOT NULL REFERENCES circle_cohorts(id) ON DELETE CASCADE,
  call_number   INT NOT NULL CHECK (call_number BETWEEN 1 AND 6),
  title         TEXT NOT NULL,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  zoom_url      TEXT,
  recording_url TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cohort_id, call_number)
);

-- ─────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────
ALTER TABLE circle_cohorts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_weekly_content   ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_member_progress  ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_posts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_reactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_partner_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_live_calls       ENABLE ROW LEVEL SECURITY;

-- Helper: returns the caller's cohort_id.
-- SECURITY DEFINER so it bypasses RLS on circle_members when evaluating
-- the policies that reference this function (otherwise circular).
CREATE OR REPLACE FUNCTION my_cohort_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cohort_id FROM circle_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Cohorts: any authenticated user can read active cohorts
CREATE POLICY "cohorts_read" ON circle_cohorts
  FOR SELECT USING (is_active = true);

-- Members: users see only their own cohort
CREATE POLICY "members_read_own_cohort" ON circle_members
  FOR SELECT USING (cohort_id = my_cohort_id());

CREATE POLICY "members_insert_self" ON circle_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Weekly content: members see their cohort's content
CREATE POLICY "content_read_own_cohort" ON circle_weekly_content
  FOR SELECT USING (cohort_id = my_cohort_id());

-- Progress: members manage only their own rows
CREATE POLICY "progress_own" ON circle_member_progress
  FOR ALL USING (
    member_id IN (SELECT id FROM circle_members WHERE user_id = auth.uid())
  );

-- Posts: members read + create in their cohort
CREATE POLICY "posts_read_own_cohort" ON circle_posts
  FOR SELECT USING (cohort_id = my_cohort_id());

CREATE POLICY "posts_insert_own_cohort" ON circle_posts
  FOR INSERT WITH CHECK (cohort_id = my_cohort_id() AND author_id = auth.uid());

-- Reactions: scoped to cohort posts
CREATE POLICY "reactions_read" ON circle_reactions
  FOR SELECT USING (
    post_id IN (SELECT id FROM circle_posts WHERE cohort_id = my_cohort_id())
  );

CREATE POLICY "reactions_insert" ON circle_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "reactions_delete_own" ON circle_reactions
  FOR DELETE USING (user_id = auth.uid());

-- Partner messages: sender or receiver reads
CREATE POLICY "messages_own" ON circle_partner_messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "messages_insert" ON circle_partner_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Live calls: members see their cohort's calls
CREATE POLICY "calls_read_own_cohort" ON circle_live_calls
  FOR SELECT USING (cohort_id = my_cohort_id());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_circle_members_user_id    ON circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_cohort_id  ON circle_members(cohort_id);
CREATE INDEX IF NOT EXISTS idx_circle_posts_cohort_week  ON circle_posts(cohort_id, week_number);
CREATE INDEX IF NOT EXISTS idx_circle_messages_receiver  ON circle_partner_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_circle_progress_member    ON circle_member_progress(member_id);
CREATE INDEX IF NOT EXISTS idx_circle_content_week       ON circle_weekly_content(cohort_id, week_number);
