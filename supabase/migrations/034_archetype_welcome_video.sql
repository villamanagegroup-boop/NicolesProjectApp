-- 034_archetype_welcome_video.sql
-- Archetype-specific "welcome to the next phase" video.
--
-- The archetype video itself reuses the existing per-archetype
-- circle_weekly_content.video_url column (the "personal" track row). This
-- migration adds:
--   1. a per-week/per-archetype admin toggle to auto-popup that video at the
--      start of the week, and
--   2. a per-member stamp so the popup only fires once — after that the member
--      can still reopen the video from the smaller on-page player all week.

-- Admin toggle: when true, the archetype track's video_url is shown as a
-- welcome popup the first time the member opens the *current* week. Lives on
-- the archetype track row (door/throne/engine/push); ignored on 'universal'.
ALTER TABLE circle_weekly_content
  ADD COLUMN IF NOT EXISTS archetype_video_popup BOOLEAN NOT NULL DEFAULT false;

-- Per-member, per-week: when the member dismissed the archetype welcome popup.
-- NULL = not yet seen, so it is still eligible to auto-popup.
ALTER TABLE circle_member_progress
  ADD COLUMN IF NOT EXISTS archetype_video_seen_at TIMESTAMPTZ;
