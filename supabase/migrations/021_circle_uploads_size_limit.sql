-- 021_circle_uploads_size_limit.sql
-- The circle-uploads bucket was created in migration 007 without explicit
-- file_size_limit / allowed_mime_types overrides, so it inherits the project
-- defaults. On Supabase Free tier that's a 50 MB per-file limit — too small
-- for even a short phone video, which is why admin video uploads were failing
-- with a generic "Upload failed — check storage permissions." message.
--
-- This raises the cap to 500 MB and explicitly allows the three media kinds
-- we use anywhere in the app: video, audio, image (plus a small set of doc
-- types used by the partner/coach attachment picker).

update storage.buckets
   set file_size_limit = 524288000,          -- 500 MB
       allowed_mime_types = array[
         'video/*',
         'audio/*',
         'image/*',
         'application/pdf',
         'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
       ]
 where id = 'circle-uploads';
