-- Clarity Portal — Migration 019
-- Lets community replies carry an image / GIF.
--
-- The /circle/community page is gaining a Tenor-backed GIF picker so the
-- thread feels like a chat surface, not a comment-on-a-blog. GIFs are just
-- animated images, so we store the URL in image_url to mirror the existing
-- post schema rather than introducing a separate gif_url column.
--
-- Tenor URLs are public CDN links — no Supabase storage involvement, no
-- new RLS policies needed (the column inherits the table's existing policies).

ALTER TABLE public.circle_post_comments
  ADD COLUMN IF NOT EXISTS image_url TEXT;
