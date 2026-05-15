-- Clarity Portal — Migration 025
-- Circle home redesign + 3-screen onboarding tour.
--
-- Adds the columns needed by the new /circle home page:
--   • circle_weekly_content.partner_prompt     — this week's partner prompt,
--     stored per-archetype so each track gets its own
--   • circle_weekly_content.monday_voice_note_url — URL to Nicole's Monday
--     voice note (used by the new "From Nicole this week" audio card)
--   • circle_member_progress.teaching_completed  — "I've read this" click
--   • circle_member_progress.voice_note_played   — set when audio hits 80%
--   • circle_member_progress.partner_checkin_sent_at — stamped after a
--     successful sendPartnerMessage so the Circle home shows "Check-in done"
--   • circle_members.onboarded_at — null = needs the 3-screen welcome tour
--
-- All defaults are additive — existing rows pick up false / null and the
-- new UI degrades cleanly until content is populated.

-- ─── circle_weekly_content ──────────────────────────────────────────────
alter table circle_weekly_content
  add column if not exists partner_prompt        text,
  add column if not exists monday_voice_note_url text;

-- ─── circle_member_progress ─────────────────────────────────────────────
alter table circle_member_progress
  add column if not exists teaching_completed      boolean     default false,
  add column if not exists voice_note_played       boolean     default false,
  add column if not exists partner_checkin_sent_at timestamptz;

-- ─── circle_members ─────────────────────────────────────────────────────
-- Stamped after the user finishes the 3-screen welcome tour at /circle/welcome.
-- Until set, /circle redirects new members to the tour.
alter table circle_members
  add column if not exists onboarded_at timestamptz;
