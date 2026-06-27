-- 039_monday_attachments.sql
-- The Monday prompt can ask for different kinds of responses (a reflection, a
-- voice note, a photo, a video). Alongside the existing text response
-- (monday_response), members can now attach files of any type. We store them as
-- a JSON array of { url, name, kind } on the member's weekly progress row.
--   kind ∈ 'image' | 'video' | 'audio' | 'file'
-- (The Wednesday voice note is coach content and lives on
--  circle_weekly_content.monday_voice_note_url — not here.)

alter table public.circle_member_progress
  add column if not exists monday_attachments jsonb not null default '[]'::jsonb;
