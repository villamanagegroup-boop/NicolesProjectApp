-- Clarity Portal — Migration 027
-- Private Friday wins on the per-week page.
--
-- Adds a private "friday_win" text field on a member's weekly progress so they
-- can capture their win for themselves before deciding whether to post it to
-- the cohort feed. The week page's teaching section gets a composer wired to
-- this field; the existing wins-composer (community post) remains the public
-- path.

alter table circle_member_progress
  add column if not exists friday_win text;
