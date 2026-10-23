BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
-- Assertion functions are available to test roles only until this transaction rolls back.
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO anon, authenticated;
SET search_path = public, extensions;
SELECT plan(39);

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
SELECT lives_ok($$UPDATE public.profiles SET headline='DevOps Senior' WHERE id = (SELECT auth.uid())$$, 'Le propriétaire modifie son profil');
SELECT is((SELECT headline FROM public.profiles WHERE id='a0000000-0000-0000-0000-000000000001'), 'DevOps Senior', 'Modification propriétaire persistée');
WITH u AS (UPDATE public.profiles SET headline='Pirate' WHERE id='a0000000-0000-0000-0000-000000000002' RETURNING 1), cnt AS (SELECT count(*)::integer AS n FROM u) SELECT is(n, 0, 'Modification du profil d''un tiers sans effet') FROM cnt;
SELECT throws_ok($$UPDATE public.profiles SET role='invalid' WHERE id = (SELECT auth.uid())$$, '23514', NULL, 'Rôle invalide refusé');
SELECT throws_ok($$UPDATE public.profiles SET years_of_experience=71 WHERE id = (SELECT auth.uid())$$, '23514', NULL, 'Expérience > 70 refusée');
SELECT throws_ok($$UPDATE public.profiles SET years_of_experience=-1 WHERE id = (SELECT auth.uid())$$, '23514', NULL, 'Expérience négative refusée');
SELECT throws_ok($$UPDATE public.profiles SET linkedin_url='https://example.com/in/x' WHERE id = (SELECT auth.uid())$$, '23514', NULL, 'URL LinkedIn invalide refusée');
SELECT throws_ok($$UPDATE public.profiles SET headline=repeat('a', 121) WHERE id = (SELECT auth.uid())$$, '23514', NULL, 'Headline > 120 caractères refusé');
SELECT throws_ok($$UPDATE public.profiles SET bio=repeat('a', 1001) WHERE id = (SELECT auth.uid())$$, '23514', NULL, 'Bio > 1000 caractères refusé');
SELECT throws_ok($$UPDATE public.profiles SET resume_url=repeat('a', 501) WHERE id = (SELECT auth.uid())$$, '23514', NULL, 'Resume URL > 500 caractères refusé');
SELECT throws_ok($$UPDATE public.profiles SET skills=array_fill('ts'::text, ARRAY[31]) WHERE id = (SELECT auth.uid())$$, '23514', NULL, 'Compétences > 30 éléments refusé');
SELECT lives_ok($$UPDATE public.profiles SET role='mentee', years_of_experience=10, linkedin_url='https://www.linkedin.com/in/test' WHERE id = (SELECT auth.uid())$$, 'Valeurs valides acceptées');
SELECT throws_ok($$UPDATE public.profiles SET created_at = now() WHERE id = (SELECT auth.uid())$$, '42501', NULL, 'created_at non modifiable');
SELECT throws_ok($$UPDATE public.profiles SET id = gen_random_uuid() WHERE id = (SELECT auth.uid())$$, '42501', NULL, 'id non modifiable');
SELECT throws_ok($$UPDATE public.profiles SET is_active = false WHERE id = (SELECT auth.uid())$$, '42501', NULL, 'is_active non modifiable');
SELECT throws_ok($$DELETE FROM public.profiles$$, '42501', NULL, 'Suppression cliente interdite');
SELECT throws_ok($$SELECT private.create_profile()$$, '42501', NULL, 'Fonction privée inaccessible');
RESET ROLE;

UPDATE public.profiles SET role='mentor', is_onboarded=true, is_active=true WHERE id='a0000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET role='mentor', is_onboarded=false WHERE id='a0000000-0000-0000-0000-000000000003';
UPDATE public.profiles SET role='mentee', is_onboarded=true WHERE id='a0000000-0000-0000-0000-000000000004';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
SELECT is((SELECT count(*)::integer FROM public.profiles WHERE id='a0000000-0000-0000-0000-000000000002'), 1, 'Mentor actif et onboardé visible');
SELECT is((SELECT count(*)::integer FROM public.profiles WHERE id='a0000000-0000-0000-0000-000000000003'), 0, 'Mentor non onboardé invisible');
SELECT is((SELECT count(*)::integer FROM public.profiles WHERE id='a0000000-0000-0000-0000-000000000004'), 0, 'Autre mentoré invisible');
SELECT is((SELECT count(*)::integer FROM public.profiles), 2, 'Soi-même et mentors visibles uniquement');
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
