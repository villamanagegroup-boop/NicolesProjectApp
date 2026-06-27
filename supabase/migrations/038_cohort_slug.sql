-- 038_cohort_slug.sql
-- Adds an optional short "slug" to circle_cohorts so admins can hand out
-- deliberate enrollment links (e.g. /circle/intake?cohort=summer-2026) when
-- multiple cohorts run at once. When no slug is supplied, enrollment falls
-- back to the default rule in lib/circle.ts pickEnrollmentCohort():
-- "newest active cohort wins" (ordered by starts_at desc).
--
-- slug is nullable; Postgres UNIQUE permits multiple NULLs, so cohorts
-- without a slug coexist fine and only explicitly-set slugs must be unique.

alter table public.circle_cohorts
  add column if not exists slug text;

-- Enforce uniqueness only across non-null slugs.
create unique index if not exists circle_cohorts_slug_key
  on public.circle_cohorts (slug)
  where slug is not null;
