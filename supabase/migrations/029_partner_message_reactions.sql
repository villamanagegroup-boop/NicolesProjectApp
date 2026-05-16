-- 029_partner_message_reactions.sql
-- Emoji reactions on partner DMs. Mirrors circle_reactions (which is keyed
-- to circle_posts), but keyed to circle_partner_messages instead.
--
-- RLS: only the sender or receiver of a message can read its reactions or
-- add one. Each user can delete their own reactions; admins can do anything
-- (matching the pattern in 008_circle_uploads_and_admin_rls.sql).

CREATE TABLE IF NOT EXISTS public.circle_partner_message_reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID NOT NULL REFERENCES public.circle_partner_messages(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL DEFAULT '❤️',
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_partner_msg_reactions_message
  ON public.circle_partner_message_reactions(message_id);

ALTER TABLE public.circle_partner_message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pmr_read ON public.circle_partner_message_reactions;
CREATE POLICY pmr_read ON public.circle_partner_message_reactions
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM public.circle_partner_messages
      WHERE sender_id = auth.uid() OR receiver_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS pmr_insert ON public.circle_partner_message_reactions;
CREATE POLICY pmr_insert ON public.circle_partner_message_reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    message_id IN (
      SELECT id FROM public.circle_partner_messages
      WHERE sender_id = auth.uid() OR receiver_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS pmr_delete_own ON public.circle_partner_message_reactions;
CREATE POLICY pmr_delete_own ON public.circle_partner_message_reactions
  FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS pmr_admin_all ON public.circle_partner_message_reactions;
CREATE POLICY pmr_admin_all ON public.circle_partner_message_reactions
  FOR ALL USING (public.is_circle_admin(auth.uid()));
