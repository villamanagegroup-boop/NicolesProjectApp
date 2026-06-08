-- 035_welcome_to_program_video.sql
-- "Welcome to the program" video — a single program-level (cohort-wide)
-- universal video, distinct from the per-week teaching video and the
-- per-archetype welcome video (migration 034).
--
-- It pops up once when a member first enters the program, then collapses to a
-- "Start here" button on the Circle home page that reopens it any time.

-- The video URL itself. One per cohort (set in admin → Content). NULL hides
-- the whole feature.
ALTER TABLE circle_cohorts
  ADD COLUMN IF NOT EXISTS welcome_video_url TEXT;

-- Per-member, one-time: when the welcome video popup was first dismissed.
-- NULL = never seen, so it still auto-pops and the card shows expanded.
ALTER TABLE circle_members
  ADD COLUMN IF NOT EXISTS welcome_video_seen_at TIMESTAMPTZ;
