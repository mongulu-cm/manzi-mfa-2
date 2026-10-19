BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
-- Assertion functions are available to test roles only until this transaction rolls back.
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO anon, authenticated;
SET search_path = public, extensions;
SELECT plan(19);

-- Buckets
SELECT is((SELECT public FROM storage.buckets WHERE id = 'avatars'), true, 'Le bucket avatars est public');
SELECT is((SELECT file_size_limit FROM storage.buckets WHERE id = 'avatars'), 2097152::bigint, 'avatars limité à 2 Mo');
SELECT is((SELECT allowed_mime_types FROM storage.buckets WHERE id = 'avatars'), ARRAY['image/jpeg', 'image/png', 'image/webp'], 'avatars accepte jpg, png et webp');
SELECT is((SELECT public FROM storage.buckets WHERE id = 'documents'), false, 'Le bucket documents est privé');
SELECT is((SELECT file_size_limit FROM storage.buckets WHERE id = 'documents'), 5242880::bigint, 'documents limité à 5 Mo');
SELECT is((SELECT allowed_mime_types FROM storage.buckets WHERE id = 'documents'), ARRAY['application/pdf'], 'documents accepte uniquement pdf');

-- Utilisateur A
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
SELECT lives_ok($$INSERT INTO storage.objects (bucket_id, name, owner_id) VALUES ('avatars', 'a0000000-0000-0000-0000-000000000001/photo.png', 'a0000000-0000-0000-0000-000000000001')$$, 'A dépose un avatar dans son dossier');
SELECT throws_ok($$INSERT INTO storage.objects (bucket_id, name, owner_id) VALUES ('avatars', 'a0000000-0000-0000-0000-000000000002/photo.png', 'a0000000-0000-0000-0000-000000000001')$$, '42501', NULL, 'A ne dépose pas d''avatar chez B');
SELECT lives_ok($$INSERT INTO storage.objects (bucket_id, name, owner_id) VALUES ('documents', 'a0000000-0000-0000-0000-000000000001/cv.pdf', 'a0000000-0000-0000-0000-000000000001')$$, 'A dépose un document dans son dossier');
SELECT is((SELECT count(*)::integer FROM storage.objects WHERE bucket_id = 'documents' AND name = 'a0000000-0000-0000-0000-000000000001/cv.pdf'), 1, 'A lit son document');
RESET ROLE;

-- Anonyme : aucun listing (les avatars passent par l'URL publique du CDN)
SET LOCAL ROLE anon;
SELECT is((SELECT count(*)::integer FROM storage.objects WHERE bucket_id = 'avatars'), 0, 'anon ne liste pas les avatars');
SELECT is((SELECT count(*)::integer FROM storage.objects WHERE bucket_id = 'documents'), 0, 'anon ne lit pas les documents');
RESET ROLE;

-- Utilisateur B
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);
SELECT is((SELECT count(*)::integer FROM storage.objects WHERE bucket_id = 'documents' AND name = 'a0000000-0000-0000-0000-000000000001/cv.pdf'), 0, 'B ne lit pas le document de A');
SELECT throws_ok($$INSERT INTO storage.objects (bucket_id, name, owner_id) VALUES ('documents', 'a0000000-0000-0000-0000-000000000001/cv.pdf', 'a0000000-0000-0000-0000-000000000002')$$, '42501', NULL, 'B ne dépose pas dans le dossier de A');
SELECT is((SELECT count(*)::integer FROM storage.objects WHERE bucket_id = 'avatars' AND name = 'a0000000-0000-0000-0000-000000000001/photo.png'), 0, 'B ne lit pas l''avatar de A via l''API');
SELECT is((WITH u AS (UPDATE storage.objects SET name = name WHERE bucket_id = 'avatars' AND name = 'a0000000-0000-0000-0000-000000000001/photo.png' RETURNING 1) SELECT count(*)::integer FROM u), 0, 'B ne modifie pas l''avatar de A');
SELECT is((WITH d AS (DELETE FROM storage.objects WHERE bucket_id = 'avatars' AND name = 'a0000000-0000-0000-0000-000000000001/photo.png' RETURNING 1) SELECT count(*)::integer FROM d), 0, 'B ne supprime pas l''avatar de A');
SELECT is((WITH u AS (UPDATE storage.objects SET name = name WHERE bucket_id = 'documents' AND name = 'a0000000-0000-0000-0000-000000000001/cv.pdf' RETURNING 1) SELECT count(*)::integer FROM u), 0, 'B ne modifie pas le document de A');
SELECT is((WITH d AS (DELETE FROM storage.objects WHERE bucket_id = 'documents' AND name = 'a0000000-0000-0000-0000-000000000001/cv.pdf' RETURNING 1) SELECT count(*)::integer FROM d), 0, 'B ne supprime pas le document de A');
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
