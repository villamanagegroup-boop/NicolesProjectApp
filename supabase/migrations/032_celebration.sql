-- ============================================================
-- THE CIRCLE — CELEBRATION (032)
-- ============================================================
-- Phase 3 schema. Tracks the celebration moments that anchor the
-- 90-day arc:
--   • first_action_completed_at  — the very first time a member
--     marks any weekly action complete. Drives the "first
--     interruption" overlay + an amber admin alert telling Nicole
--     to send a personal note.
--   • week6_message_sent  — flag flipped after Nicole sends the
--     Week 6 mid-program personal check-in. Drives the admin
--     banner that surfaces during Week 6 of any active cohort.
--   • graduation_seal_card_url  — public URL of the generated
--     graduation seal PNG. Set by /api/admin/generate-seal-card.
--
-- Also provisions the circle-assets storage bucket (public)
-- so the seal-card route has somewhere to upload PNGs.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Columns on circle_members
-- ─────────────────────────────────────────────────────────────
ALTER TABLE circle_members
  ADD COLUMN IF NOT EXISTS first_action_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS week6_message_sent        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS graduation_seal_card_url  text;

COMMENT ON COLUMN circle_members.first_action_completed_at IS
  'Stamped the first time this member marks any weekly action complete. NULL = not yet. Drives the "first interruption" celebration + admin alert.';
COMMENT ON COLUMN circle_members.week6_message_sent IS
  'True after Nicole sends the Week 6 mid-program personal message. Greys the member out in the Week 6 composer.';
COMMENT ON COLUMN circle_members.graduation_seal_card_url IS
  'Public URL of the generated graduation seal PNG. Written by /api/admin/generate-seal-card.';

-- Backfill: anyone who already has at least one completed action
-- shouldn't trigger the "first interruption" overlay retroactively.
-- Stamp them with the earliest completed_at timestamp on a row
-- where action_completed = true. NULL stays NULL for new members.
UPDATE circle_members m
   SET first_action_completed_at = sub.first_at
  FROM (
    SELECT member_id, min(completed_at) AS first_at
      FROM circle_member_progress
     WHERE action_completed = true
       AND completed_at IS NOT NULL
     GROUP BY member_id
  ) sub
 WHERE m.id = sub.member_id
   AND m.first_action_completed_at IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. Storage bucket — circle-assets (public, for seal cards
--    and any other admin-generated permanent assets)
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('circle-assets', 'circle-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read (public bucket). Only admins can write — the
-- generate-seal-card route uses the service-role key, which
-- bypasses RLS, but these policies still enforce the rule for
-- any path that goes through the anon/auth client.
DROP POLICY IF EXISTS "circle-assets read public" ON storage.objects;
CREATE POLICY "circle-assets read public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'circle-assets');

DROP POLICY IF EXISTS "circle-assets admin write" ON storage.objects;
CREATE POLICY "circle-assets admin write" ON storage.objects
  FOR ALL
  USING (bucket_id = 'circle-assets' AND public.is_circle_admin(auth.uid()))
  WITH CHECK (bucket_id = 'circle-assets' AND public.is_circle_admin(auth.uid()));
