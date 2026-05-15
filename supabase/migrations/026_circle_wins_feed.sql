-- Clarity Portal — Migration 026
-- Wins feed + cohort community preview support.
--
-- Adds the one new content column the wins composer needs:
--   • circle_weekly_content.wins_prompt — pre-populated copy that seeds the
--     "Add your win for this week" textarea in WeeklyWinsFeed.
--
-- Everything else the new UI needs (cohort posts, reactions, post comments)
-- is already covered by existing tables (circle_posts, circle_reactions,
-- circle_post_comments). Nicole's reply on a win is just an admin-authored
-- circle_post_comments row — no schema change needed.

alter table circle_weekly_content
  add column if not exists wins_prompt text;
