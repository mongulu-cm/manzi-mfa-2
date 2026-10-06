BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;
SELECT plan(21);

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'a@example.invalid', '{"name":"  Membre Test  ","picture":"https://image.example.invalid/photo.png"}'),
  ('a0000000-0000-0000-0000-000000000002', 'b@example.invalid', '{}'),
  ('a0000000-0000-0000-0000-000000000003', 'c@example.invalid', '{"name":42,"picture":"http://image.example.invalid/photo.png"}'),
  ('a0000000-0000-0000-0000-000000000004', 'd@example.invalid', '{"name":"   ","picture":{"url":"https://image.example.invalid"}}');

SELECT is((SELECT count(*)::integer FROM public.profiles WHERE id::text LIKE 'a0000000-%'), 4, 'Un profil par inscription');
SELECT is((SELECT display_name FROM public.profiles WHERE id='a0000000-0000-0000-0000-000000000001'), 'Membre Test', 'Nom normalisé');
SELECT is((SELECT avatar_url FROM public.profiles WHERE id='a0000000-0000-0000-0000-000000000001'), 'https://image.example.invalid/photo.png', 'URL HTTPS conservée');
SELECT is((SELECT display_name FROM public.profiles WHERE id='a0000000-0000-0000-0000-000000000002'), NULL, 'Nom absent accepté');
SELECT is((SELECT avatar_url FROM public.profiles WHERE id='a0000000-0000-0000-0000-000000000002'), NULL, 'Photo absente acceptée');
SELECT is((SELECT display_name FROM public.profiles WHERE id='a0000000-0000-0000-0000-000000000003'), NULL, 'Nom non textuel ignoré');
SELECT is((SELECT avatar_url FROM public.profiles WHERE id='a0000000-0000-0000-0000-000000000003'), NULL, 'Photo HTTP ignorée');
SELECT is((SELECT display_name FROM public.profiles WHERE id='a0000000-0000-0000-0000-000000000004'), NULL, 'Nom vide ignoré');
SELECT is((SELECT avatar_url FROM public.profiles WHERE id='a0000000-0000-0000-0000-000000000004'), NULL, 'Photo non textuelle ignorée');

UPDATE auth.users SET raw_user_meta_data='{"name":"Autre nom"}' WHERE id='a0000000-0000-0000-0000-000000000001';
SELECT is((SELECT display_name FROM public.profiles WHERE id='a0000000-0000-0000-0000-000000000001'), 'Membre Test', 'Les connexions suivantes ne réécrivent pas le profil');
SELECT is((SELECT count(*)::integer FROM public.profiles WHERE id='a0000000-0000-0000-0000-000000000001'), 1, 'Aucun doublon du profil');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
SELECT is((SELECT count(*)::integer FROM public.profiles), 1, 'Le propriétaire lit uniquement son profil');
SELECT is((SELECT count(*)::integer FROM public.profiles WHERE id='a0000000-0000-0000-0000-000000000002'), 0, 'Un autre profil est invisible');
SELECT throws_ok($$INSERT INTO public.profiles(id) VALUES ('b0000000-0000-0000-0000-000000000001')$$, '42501', NULL, 'Création cliente interdite');
SELECT throws_ok($$UPDATE public.profiles SET display_name='Autre nom'$$, '42501', NULL, 'Modification cliente interdite');
SELECT throws_ok($$DELETE FROM public.profiles$$, '42501', NULL, 'Suppression cliente interdite');
SELECT throws_ok($$SELECT private.create_profile()$$, '42501', NULL, 'Fonction privée inaccessible');
RESET ROLE;

SELECT ok(NOT has_function_privilege('anon', 'private.create_profile()', 'EXECUTE'), 'Aucune exécution anonyme');
SELECT ok(NOT has_function_privilege('authenticated', 'private.create_profile()', 'EXECUTE'), 'Aucune exécution authentifiée');
SET LOCAL ROLE anon;
SELECT throws_ok($$SELECT * FROM public.profiles$$, '42501', NULL, 'Lecture anonyme interdite');
RESET ROLE;

DELETE FROM auth.users WHERE id='a0000000-0000-0000-0000-000000000001';
SELECT is((SELECT count(*)::integer FROM public.profiles WHERE id='a0000000-0000-0000-0000-000000000001'), 0, 'Suppression Auth en cascade');
SELECT * FROM finish();
ROLLBACK;
