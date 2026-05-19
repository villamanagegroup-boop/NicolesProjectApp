-- ============================================================
-- THE CIRCLE — PARTNER EXPERIENCE (031)
-- ============================================================
-- Phase 2 schema. Tracks whether a member has opened their partner
-- thread for the first time (so the 3-question first-conversation
-- overlay can be shown once), and stores per-week "what kind of
-- support do I need" selections so partners can see each other's
-- check-in preference each Wednesday.
--
-- Note on naming: the spec calls the partner FK
-- accountability_partner_id, but the table column is partner_id
-- (defined in 003_circle_cohorts.sql). All policies and queries
-- below use the actual column name.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. partner_thread_opened — first-conversation gate
-- ─────────────────────────────────────────────────────────────
ALTER TABLE circle_members
  ADD COLUMN IF NOT EXISTS partner_thread_opened boolean DEFAULT false;

COMMENT ON COLUMN circle_members.partner_thread_opened IS
  'Set to true the first time the member dismisses the 3-question first-conversation overlay on /circle/partner. Drives whether the overlay shows again.';

-- Existing pairs with conversation history shouldn't see the
-- overlay. Backfill anyone who has ever sent or received a partner
-- message to true. New rows still start false (column default).
UPDATE circle_members m
   SET partner_thread_opened = true
 WHERE partner_thread_opened = false
   AND (
     EXISTS (SELECT 1 FROM circle_partner_messages p WHERE p.sender_id   = m.user_id)
     OR
     EXISTS (SELECT 1 FROM circle_partner_messages p WHERE p.receiver_id = m.user_id)
   );

-- ─────────────────────────────────────────────────────────────
-- 2. partner_checkin_preferences — per-week support selector
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_checkin_preferences (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    uuid NOT NULL REFERENCES circle_members(id) ON DELETE CASCADE,
  week_number  int  NOT NULL CHECK (week_number BETWEEN 1 AND 12),
  support_type text NOT NULL CHECK (support_type IN (
    'witness', 'reflection', 'honest_feedback', 'question', 'accountability'
  )),
  free_note    text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE(member_id, week_number)
);

COMMENT ON COLUMN partner_checkin_preferences.support_type IS
  'What kind of support the member wants from their partner this week. witness | reflection | honest_feedback | question | accountability';
COMMENT ON COLUMN partner_checkin_preferences.free_note IS
  'Optional free-space note attached to the Wednesday check-in. Visible to the partner.';

CREATE INDEX IF NOT EXISTS idx_partner_checkin_member_week
  ON partner_checkin_preferences (member_id, week_number);

-- ─────────────────────────────────────────────────────────────
-- 3. RLS — caller can read own + partner's preference,
--    write only their own
-- ─────────────────────────────────────────────────────────────
ALTER TABLE partner_checkin_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pcp_read_self_or_partner ON partner_checkin_preferences;
CREATE POLICY pcp_read_self_or_partner ON partner_checkin_preferences
  FOR SELECT
  USING (
    -- own row
    member_id IN (SELECT id FROM circle_members WHERE user_id = auth.uid())
    OR
    -- partner's row (resolved via the caller's partner_id)
    member_id IN (
      SELECT partner_id
        FROM circle_members
       WHERE user_id = auth.uid()
         AND partner_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS pcp_insert_self ON partner_checkin_preferences;
CREATE POLICY pcp_insert_self ON partner_checkin_preferences
  FOR INSERT
  WITH CHECK (
    member_id IN (SELECT id FROM circle_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS pcp_update_self ON partner_checkin_preferences;
CREATE POLICY pcp_update_self ON partner_checkin_preferences
  FOR UPDATE
  USING (
    member_id IN (SELECT id FROM circle_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    member_id IN (SELECT id FROM circle_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS pcp_admin_all ON partner_checkin_preferences;
CREATE POLICY pcp_admin_all ON partner_checkin_preferences
  FOR ALL
  USING (public.is_circle_admin(auth.uid()))
  WITH CHECK (public.is_circle_admin(auth.uid()));

-- Keep updated_at fresh on UPDATE so admins can see the most recent edit.
CREATE OR REPLACE FUNCTION partner_checkin_preferences_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pcp_updated_at ON partner_checkin_preferences;
CREATE TRIGGER trg_pcp_updated_at
  BEFORE UPDATE ON partner_checkin_preferences
  FOR EACH ROW EXECUTE FUNCTION partner_checkin_preferences_touch_updated_at();
