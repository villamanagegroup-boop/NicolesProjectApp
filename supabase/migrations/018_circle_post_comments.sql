-- Clarity Portal — Migration 018
-- Threaded community: replies + reactions on replies.
--
-- Until now, circle_posts could only be reacted to with an emoji. The
-- community page lacked any back-and-forth, which made it feel like a
-- broadcast wall instead of a place members want to hang out. This
-- migration introduces:
--
--   circle_post_comments       — text replies under a post
--   circle_comment_reactions   — emoji reactions on a reply
--
-- RLS: cohort-scoped reads/inserts (mirrors circle_posts + circle_reactions),
--      author-only deletes, and an admin override consistent with 008.

-- ─── Tables ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.circle_post_comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID        NOT NULL REFERENCES public.circle_posts(id) ON DELETE CASCADE,
  author_id   UUID        NOT NULL REFERENCES public.users(id)        ON DELETE CASCADE,
  body        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.circle_comment_reactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  UUID        NOT NULL REFERENCES public.circle_post_comments(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.users(id)                ON DELETE CASCADE,
  emoji       TEXT        NOT NULL DEFAULT '❤️',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_circle_post_comments_post
  ON public.circle_post_comments (post_id, created_at);

CREATE INDEX IF NOT EXISTS idx_circle_comment_reactions_comment
  ON public.circle_comment_reactions (comment_id);

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.circle_post_comments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_comment_reactions ENABLE ROW LEVEL SECURITY;

-- Comments: members of the same cohort can read; author can write/delete.
DROP POLICY IF EXISTS comments_read_own_cohort ON public.circle_post_comments;
CREATE POLICY comments_read_own_cohort ON public.circle_post_comments
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM public.circle_posts WHERE cohort_id = public.my_cohort_id()
    )
  );

DROP POLICY IF EXISTS comments_insert_self ON public.circle_post_comments;
CREATE POLICY comments_insert_self ON public.circle_post_comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND post_id IN (
      SELECT id FROM public.circle_posts WHERE cohort_id = public.my_cohort_id()
    )
  );

DROP POLICY IF EXISTS comments_delete_own ON public.circle_post_comments;
CREATE POLICY comments_delete_own ON public.circle_post_comments
  FOR DELETE USING (author_id = auth.uid());

DROP POLICY IF EXISTS comments_admin_all ON public.circle_post_comments;
CREATE POLICY comments_admin_all ON public.circle_post_comments
  FOR ALL USING (public.is_circle_admin(auth.uid()));

-- Comment reactions: cohort-scoped read; user can react/unreact for self.
DROP POLICY IF EXISTS comment_reactions_read ON public.circle_comment_reactions;
CREATE POLICY comment_reactions_read ON public.circle_comment_reactions
  FOR SELECT USING (
    comment_id IN (
      SELECT c.id
      FROM public.circle_post_comments c
      JOIN public.circle_posts p ON p.id = c.post_id
      WHERE p.cohort_id = public.my_cohort_id()
    )
  );

DROP POLICY IF EXISTS comment_reactions_insert ON public.circle_comment_reactions;
CREATE POLICY comment_reactions_insert ON public.circle_comment_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS comment_reactions_delete_own ON public.circle_comment_reactions;
CREATE POLICY comment_reactions_delete_own ON public.circle_comment_reactions
  FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS comment_reactions_admin_all ON public.circle_comment_reactions;
CREATE POLICY comment_reactions_admin_all ON public.circle_comment_reactions
  FOR ALL USING (public.is_circle_admin(auth.uid()));
