-- ============================================================
-- THE CIRCLE — INTAKE ENHANCEMENTS (030)
-- ============================================================
-- Phase 1 foundation work. Adds the extended intake fields
-- captured by the upgraded onboarding/intake form, plus the
-- timestamps the 180-day letter job and graduation ceremony rely on.
--
-- Schema decision: intake fields already live on circle_members
-- (archetype, enneagram_type, attachment_style, feedback_pref,
-- goal_90day). To keep one source of truth and avoid splitting
-- intake state across two tables, the new fields are added to
-- circle_members directly.
--
-- Privacy note: life_changing_definition, program_fears, and
-- letter_to_self are admin-only. RLS lets the owning member read
-- them (so the form can prefill on return visits), but member-
-- facing API routes MUST strip these columns from any payload
-- that leaves the server for someone other than the owner. The
-- API-layer enforcement is intentional and not a substitute for
-- RLS — it's defense in depth for the "Nicole only" guarantee
-- around partner intros, cohort feeds, etc.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. New intake columns
-- ─────────────────────────────────────────────────────────────
ALTER TABLE circle_members
  ADD COLUMN IF NOT EXISTS pattern_nuance              text,
  ADD COLUMN IF NOT EXISTS previous_attempts           text,
  ADD COLUMN IF NOT EXISTS decision_moment             text,
  ADD COLUMN IF NOT EXISTS pattern_awareness_duration  text,
  ADD COLUMN IF NOT EXISTS life_changing_definition    text,
  ADD COLUMN IF NOT EXISTS program_fears               text,
  ADD COLUMN IF NOT EXISTS letter_to_self              text,
  ADD COLUMN IF NOT EXISTS life_context                text,
  ADD COLUMN IF NOT EXISTS partner_needs               text,
  ADD COLUMN IF NOT EXISTS three_words                 text,
  ADD COLUMN IF NOT EXISTS timezone                    text,
  ADD COLUMN IF NOT EXISTS letter_sent_at              timestamptz,
  ADD COLUMN IF NOT EXISTS graduation_date             date,
  ADD COLUMN IF NOT EXISTS intake_completed_at         timestamptz;

-- Expand the feedback_pref CHECK to allow the upgraded intake options
-- alongside the legacy ones. Drop and recreate in one step so existing
-- 'straight' / 'context' / 'written' / 'example' rows stay valid.
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
    FROM pg_constraint
   WHERE conrelid = 'circle_members'::regclass
     AND contype  = 'c'
     AND pg_get_constraintdef(oid) LIKE '%feedback_pref%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE circle_members DROP CONSTRAINT %I', cname);
  END IF;
END$$;

ALTER TABLE circle_members
  ADD CONSTRAINT circle_members_feedback_pref_chk
  CHECK (feedback_pref IS NULL OR feedback_pref IN (
    -- legacy values (kept so old rows stay valid)
    'straight', 'context', 'written', 'example',
    -- new intake options (Q4 in 030 intake form)
    'direct', 'warm', 'questions', 'reflect', 'flex'
  ));

-- Constrain pattern_awareness_duration to the four supported buckets.
-- Allow NULL so legacy rows (and members who skip the question) stay valid.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'circle_members_pattern_awareness_chk'
  ) THEN
    ALTER TABLE circle_members
      ADD CONSTRAINT circle_members_pattern_awareness_chk
      CHECK (pattern_awareness_duration IS NULL OR pattern_awareness_duration IN (
        'recent', '1_to_3_years', 'over_3_years', 'most_of_life'
      ));
  END IF;
END$$;

-- ─────────────────────────────────────────────────────────────
-- 2. Column comments — these are queryable from the dashboard
--    and document the privacy/usage rules in-band.
-- ─────────────────────────────────────────────────────────────
COMMENT ON COLUMN circle_members.pattern_nuance              IS 'Q1: anything the quiz result did not capture about their pattern';
COMMENT ON COLUMN circle_members.three_words                 IS 'Q5: three words a friend would use to describe them';
COMMENT ON COLUMN circle_members.previous_attempts           IS 'Q6: what they have tried before and why it did not work';
COMMENT ON COLUMN circle_members.decision_moment             IS 'Q7: the specific moment they decided to join The Circle';
COMMENT ON COLUMN circle_members.pattern_awareness_duration  IS 'Q8: how long they have known about the pattern (recent | 1_to_3_years | over_3_years | most_of_life)';
COMMENT ON COLUMN circle_members.life_changing_definition    IS 'Q10: ADMIN-ONLY. Read back to member at graduation ceremony. Never expose to other members.';
COMMENT ON COLUMN circle_members.program_fears               IS 'Q11: ADMIN-ONLY. Never share with other members or partner.';
COMMENT ON COLUMN circle_members.letter_to_self              IS 'Q12: ADMIN-ONLY in-app. Emailed back to member 180 days after graduation_date.';
COMMENT ON COLUMN circle_members.life_context                IS 'Q14: anything happening in life Nicole should know';
COMMENT ON COLUMN circle_members.partner_needs               IS 'Q15: what the accountability partner needs to know — surfaced in partner intro';
COMMENT ON COLUMN circle_members.timezone                    IS 'Q13: IANA timezone identifier (e.g. America/New_York). Used for scheduling and digest send times.';
COMMENT ON COLUMN circle_members.letter_sent_at              IS 'Timestamp the 180-day letter_to_self email was dispatched. NULL = not yet sent.';
COMMENT ON COLUMN circle_members.graduation_date             IS 'Set when member completes Week 12. Drives the 180-day letter scheduler.';
COMMENT ON COLUMN circle_members.intake_completed_at         IS 'Timestamp the upgraded 5-section intake was submitted. NULL = legacy/partial intake.';

-- ─────────────────────────────────────────────────────────────
-- 3. RLS — let owning members read AND update their own row
-- ─────────────────────────────────────────────────────────────
-- The base migration (003_circle_cohorts.sql) granted SELECT scoped
-- to "same cohort" and INSERT scoped to "self". There is no UPDATE
-- policy yet, so the intake form cannot patch new answers in. Add
-- the missing self-scoped UPDATE here, plus a self-scoped SELECT
-- overlay so a member can always read their own row even when their
-- cohort_id is NULL (Path C safety-net intake before enrollment).

DROP POLICY IF EXISTS members_read_self ON circle_members;
CREATE POLICY members_read_self ON circle_members
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS members_update_self ON circle_members;
CREATE POLICY members_update_self ON circle_members
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin overlay — Nicole + any other admin_roles entry reads all rows
-- (already covered for other tables in 006_admin_tables.sql; add the
-- equivalent here so the admin dashboard sees full intake answers).
DROP POLICY IF EXISTS members_admin_read  ON circle_members;
CREATE POLICY members_admin_read ON circle_members
  FOR SELECT
  USING (public.is_circle_admin(auth.uid()));

DROP POLICY IF EXISTS members_admin_write ON circle_members;
CREATE POLICY members_admin_write ON circle_members
  FOR UPDATE
  USING (public.is_circle_admin(auth.uid()))
  WITH CHECK (public.is_circle_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- 4. Indexes the 180-day letter scheduler will need
-- ─────────────────────────────────────────────────────────────
-- Partial index on rows where graduation_date is set and the letter
-- has not yet been sent. This is the exact predicate the cron job
-- will scan with WHERE graduation_date <= now() - interval '180 days'
-- AND letter_sent_at IS NULL.
CREATE INDEX IF NOT EXISTS idx_circle_members_letter_due
  ON circle_members (graduation_date)
  WHERE letter_to_self IS NOT NULL AND letter_sent_at IS NULL;
