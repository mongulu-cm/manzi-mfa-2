BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO anon, authenticated;
SET search_path = public, extensions;
SELECT plan(15);

INSERT INTO auth.users (id, email) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'mentor@example.invalid'),
  ('b0000000-0000-0000-0000-000000000002', 'reader@example.invalid'),
  ('b0000000-0000-0000-0000-000000000003', 'draft@example.invalid'),
  ('b0000000-0000-0000-0000-000000000004', 'inactive@example.invalid');
UPDATE public.profiles SET role = 'mentor', is_onboarded = true,
  headline = 'Mentor', resume_url = 'private/cv.pdf', linkedin_url = 'https://linkedin.com/in/private'
  WHERE id = 'b0000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET role = 'mentee', is_onboarded = true
  WHERE id = 'b0000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET role = 'mentor'
  WHERE id = 'b0000000-0000-0000-0000-000000000003';
UPDATE public.profiles SET role = 'mentor', is_onboarded = true, is_active = false
  WHERE id = 'b0000000-0000-0000-0000-000000000004';

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000002', true);
SELECT is((SELECT count(*)::integer FROM public.profiles WHERE id = 'b0000000-0000-0000-0000-000000000001'), 0, 'Le lecteur ne lit pas le profil brut du mentor');
SELECT is((SELECT resume_url FROM public.profiles WHERE id = 'b0000000-0000-0000-0000-000000000001'), NULL, 'Le CV du mentor reste privé');
SELECT is((SELECT linkedin_url FROM public.profiles WHERE id = 'b0000000-0000-0000-0000-000000000001'), NULL, 'Le lien LinkedIn du mentor reste privé');
SELECT is((SELECT count(*)::integer FROM public.list_active_mentors() WHERE id = 'b0000000-0000-0000-0000-000000000001'), 1, 'Le mentor actif est visible dans l''annuaire');
SELECT is((SELECT headline FROM public.list_active_mentors() WHERE id = 'b0000000-0000-0000-0000-000000000001'), 'Mentor', 'Les attributs publics sont disponibles');
SELECT is((SELECT count(*)::integer FROM public.list_active_mentors() WHERE id IN ('b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004')), 0, 'Mentorés, brouillons et mentors inactifs sont exclus');
SELECT ok((SELECT NOT (to_jsonb(m) ? 'resume_url') FROM public.list_active_mentors() AS m WHERE id = 'b0000000-0000-0000-0000-000000000001'), 'La projection SQL exclut resume_url');
SELECT ok((SELECT NOT (to_jsonb(m) ? 'linkedin_url') FROM public.list_active_mentors() AS m WHERE id = 'b0000000-0000-0000-0000-000000000001'), 'La projection SQL exclut linkedin_url');
WITH u AS (UPDATE public.profiles SET bio = 'pirate' WHERE id = 'b0000000-0000-0000-0000-000000000001' RETURNING 1)
SELECT is((SELECT count(*)::integer FROM u), 0, 'La lecture de l''annuaire ne permet pas de modifier le mentor');

SELECT set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000001', true);
SELECT is((SELECT resume_url FROM public.profiles WHERE id = (SELECT auth.uid())), 'private/cv.pdf', 'Le propriétaire garde accès à son CV');
SELECT is((SELECT linkedin_url FROM public.profiles WHERE id = (SELECT auth.uid())), 'https://linkedin.com/in/private', 'Le propriétaire garde accès à son lien LinkedIn');
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT is((SELECT count(*)::integer FROM public.list_active_mentors()), 0, 'La RPC ne retourne rien sans identité utilisateur');
RESET ROLE;

SELECT ok(NOT has_function_privilege('anon', 'public.list_active_mentors()', 'EXECUTE'), 'Aucun droit d''exécution anonyme');
SET LOCAL ROLE anon;
SELECT throws_ok($$SELECT * FROM public.list_active_mentors()$$, '42501', NULL, 'L''annuaire refuse un appel anonyme');
SELECT throws_ok($$SELECT * FROM public.profiles$$, '42501', NULL, 'La table refuse une lecture anonyme');
RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
