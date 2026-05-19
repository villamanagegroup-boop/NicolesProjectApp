-- ============================================================
-- THE CIRCLE — CALLS + ALUMNI (033)
-- ============================================================
-- Phase 4 schema.
--   • circle_call_responses — opening and closing round entries
--     for each live call. One row per (call, member, response_type).
--   • circle_posts: 3 new columns for the structured Week 10/11
--     peer-share composer + expanded post_type CHECK so peer_share
--     and alumni_share insertions stop being rejected.
--   • circle_members: alumni status + bridge-cron flags.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. circle_call_responses
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS circle_call_responses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id       uuid NOT NULL REFERENCES circle_live_calls(id) ON DELETE CASCADE,
  member_id     uuid NOT NULL REFERENCES circle_members(id)    ON DELETE CASCADE,
  response_type text NOT NULL CHECK (response_type IN ('opening_round', 'closing_integration')),
  response_text text NOT NULL,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(call_id, member_id, response_type)
);

CREATE INDEX IF NOT EXISTS idx_circle_call_responses_call
  ON circle_call_responses (call_id, response_type, created_at);

ALTER TABLE circle_call_responses ENABLE ROW LEVEL SECURITY;

-- Members in the same cohort as the call can read every response;
-- only members can insert their own.
DROP POLICY IF EXISTS ccr_read_own_cohort ON circle_call_responses;
CREATE POLICY ccr_read_own_cohort ON circle_call_responses
  FOR SELECT
  USING (
    call_id IN (
      SELECT id FROM circle_live_calls
       WHERE cohort_id = my_cohort_id()
    )
  );

DROP POLICY IF EXISTS ccr_insert_self ON circle_call_responses;
CREATE POLICY ccr_insert_self ON circle_call_responses
  FOR INSERT
  WITH CHECK (
    member_id IN (SELECT id FROM circle_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS ccr_admin_all ON circle_call_responses;
CREATE POLICY ccr_admin_all ON circle_call_responses
  FOR ALL
  USING (public.is_circle_admin(auth.uid()))
  WITH CHECK (public.is_circle_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- 2. circle_posts — peer-share fields + expanded post_type CHECK
-- ─────────────────────────────────────────────────────────────
ALTER TABLE circle_posts
  ADD COLUMN IF NOT EXISTS peer_share_what_i_came_in_with text,
  ADD COLUMN IF NOT EXISTS peer_share_what_shifted        text,
  ADD COLUMN IF NOT EXISTS peer_share_who_i_am_now        text;

COMMENT ON COLUMN circle_posts.peer_share_what_i_came_in_with IS 'Week 10/11 peer-share field 1';
COMMENT ON COLUMN circle_posts.peer_share_what_shifted        IS 'Week 10/11 peer-share field 2';
COMMENT ON COLUMN circle_posts.peer_share_who_i_am_now        IS 'Week 10/11 peer-share field 3';

-- Drop the old CHECK and recreate with the two new post_type values.
DO $$
DECLARE cname text;
BEGIN
  SELECT conname INTO cname
    FROM pg_constraint
   WHERE conrelid = 'circle_posts'::regclass
     AND contype  = 'c'
     AND pg_get_constraintdef(oid) LIKE '%post_type%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE circle_posts DROP CONSTRAINT %I', cname);
  END IF;
END$$;

ALTER TABLE circle_posts
  ADD CONSTRAINT circle_posts_post_type_chk
  CHECK (post_type IN (
    'wins', 'monday_prompt', 'partner_checkin', 'general', 'coach_note',
    'peer_share', 'alumni_share'
  ));

-- ─────────────────────────────────────────────────────────────
-- 3. circle_members — alumni status + bridge-cron flags
-- ─────────────────────────────────────────────────────────────
ALTER TABLE circle_members
  ADD COLUMN IF NOT EXISTS is_alumni              boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS alumni_since           date,
  ADD COLUMN IF NOT EXISTS post_grad_day15_sent   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS post_grad_day30_sent   boolean DEFAULT false;

COMMENT ON COLUMN circle_members.is_alumni IS
  'True once the member graduates (graduation_date set). Drives the 30-day alumni bridge in the community feed.';
COMMENT ON COLUMN circle_members.alumni_since IS
  'Anchor date for the 30-day community bridge + the 15/30-day post-grad voice notes. Usually equals graduation_date.';
COMMENT ON COLUMN circle_members.post_grad_day15_sent IS
  'Cron-set flag preventing duplicate sends of the day-15 post-grad voice note.';
COMMENT ON COLUMN circle_members.post_grad_day30_sent IS
  'Cron-set flag preventing duplicate sends of the day-30 post-grad voice note.';

-- Anyone who already has a graduation_date set is alumni now.
-- alumni_since = graduation_date so the 15/30-day cron windows align.
UPDATE circle_members
   SET is_alumni    = true,
       alumni_since = graduation_date
 WHERE graduation_date IS NOT NULL
   AND is_alumni = false;

-- ─────────────────────────────────────────────────────────────
-- 4. Trigger — when graduation_date is set, flip alumni status
--    automatically so the admin doesn't have to remember.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION circle_members_set_alumni_on_graduation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.graduation_date IS NOT NULL
     AND (OLD.graduation_date IS DISTINCT FROM NEW.graduation_date)
  THEN
    NEW.is_alumni    := true;
    NEW.alumni_since := NEW.graduation_date;
  END IF;
  -- Clearing the date un-alumnis them.
  IF NEW.graduation_date IS NULL AND OLD.graduation_date IS NOT NULL THEN
    NEW.is_alumni    := false;
    NEW.alumni_since := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_circle_members_alumni ON circle_members;
CREATE TRIGGER trg_circle_members_alumni
  BEFORE UPDATE OF graduation_date ON circle_members
  FOR EACH ROW EXECUTE FUNCTION circle_members_set_alumni_on_graduation();
