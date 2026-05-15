-- Clarity Portal — Migration 028
-- Daily prompts on the per-week teaching page (Mon journal · Wed partner · Fri wins).
--
-- Each prompt unlocks on its day and stays available until the cohort week
-- ends. Once a successor prompt unlocks, the prior one collapses to a single
-- line above the active card. Completion timestamps drive the UI state.
--
-- - Monday  : private journal-style response (program-specific text).
-- - Wednesday: shared with the partner — we reuse the existing
--              circle_member_progress.partner_checkin_sent_at as the
--              completion marker, no new column needed.
-- - Friday  : kept private OR shared to the cohort wins composer.
--              The text lives in friday_win (migration 027).

alter table circle_member_progress add column if not exists monday_response text;
alter table circle_member_progress add column if not exists monday_completed_at timestamptz;
alter table circle_member_progress add column if not exists friday_completed_at timestamptz;
