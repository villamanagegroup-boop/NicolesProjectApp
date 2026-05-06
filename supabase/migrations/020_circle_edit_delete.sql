-- Clarity Portal — Migration 020
-- Lets authors edit + delete their own posts and replies. Admins inherit
-- the same powers via the FOR ALL admin override policies that already
-- live on circle_posts (008) and circle_post_comments (018).
--
-- We also store an edited_at timestamp so the UI can show "(edited)" without
-- having to compare updated_at vs created_at.

-- ─── Columns ────────────────────────────────────────────────────────────────

ALTER TABLE public.circle_posts
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

ALTER TABLE public.circle_post_comments
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- ─── RLS — author can update + delete their own ─────────────────────────────

DROP POLICY IF EXISTS posts_update_own ON public.circle_posts;
CREATE POLICY posts_update_own ON public.circle_posts
  FOR UPDATE
  USING      (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS posts_delete_own ON public.circle_posts;
CREATE POLICY posts_delete_own ON public.circle_posts
  FOR DELETE
  USING (author_id = auth.uid());

DROP POLICY IF EXISTS comments_update_own ON public.circle_post_comments;
CREATE POLICY comments_update_own ON public.circle_post_comments
  FOR UPDATE
  USING      (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- (Author DELETE on comments already exists — comments_delete_own from 018.)
-- (Admin override is covered by posts_admin_all / comments_admin_all.)
