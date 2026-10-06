BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;
-- Assertion functions are available to test roles only until this transaction rolls back.
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO anon, authenticated;
SELECT plan(15);

-- Deliberately omit RLS: newly created objects must require explicit client grants.
CREATE TABLE public.default_privileges_probe (id integer);
CREATE SEQUENCE public.default_privileges_probe_seq;
CREATE FUNCTION public.default_privileges_probe_function()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$ SELECT 1 $$;

SELECT ok(NOT has_table_privilege('anon', 'public.default_privileges_probe', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN'), 'Aucune permission automatique de table pour anon');
SELECT ok(NOT has_table_privilege('authenticated', 'public.default_privileges_probe', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN'), 'Aucune permission automatique de table pour authenticated');
SELECT ok(NOT has_sequence_privilege('anon', 'public.default_privileges_probe_seq', 'SELECT, UPDATE, USAGE'), 'Aucune permission automatique de séquence pour anon');
SELECT ok(NOT has_sequence_privilege('authenticated', 'public.default_privileges_probe_seq', 'SELECT, UPDATE, USAGE'), 'Aucune permission automatique de séquence pour authenticated');
SELECT ok(NOT has_function_privilege('anon', 'public.default_privileges_probe_function()', 'EXECUTE'), 'Pas de fonction accessible à anon par héritage PUBLIC');
SELECT ok(NOT has_function_privilege('authenticated', 'public.default_privileges_probe_function()', 'EXECUTE'), 'Pas de fonction accessible à authenticated par héritage PUBLIC');
SELECT ok(has_table_privilege('service_role', 'public.default_privileges_probe', 'SELECT, INSERT, UPDATE, DELETE'), 'Les droits par défaut de service_role sont conservés');
SELECT ok(has_sequence_privilege('service_role', 'public.default_privileges_probe_seq', 'USAGE'), 'service_role utilise les séquences');
SELECT ok(has_function_privilege('service_role', 'public.default_privileges_probe_function()', 'EXECUTE'), 'service_role exécute les fonctions public');
SELECT ok(has_table_privilege('authenticated', 'public.profiles', 'SELECT') AND NOT has_table_privilege('authenticated', 'public.profiles', 'INSERT, UPDATE, DELETE'), 'Le grant explicite de lecture des profils est conservé');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.profiles'::regclass), 'RLS protège toujours les profils');

SET LOCAL ROLE anon;
SELECT throws_ok($$SELECT * FROM public.default_privileges_probe$$, '42501', NULL, 'Une nouvelle table est inaccessible sans grant');
SELECT throws_ok($$SELECT public.default_privileges_probe_function()$$, '42501', NULL, 'Une nouvelle fonction est inaccessible via PUBLIC');
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT throws_ok($$INSERT INTO public.default_privileges_probe VALUES (1)$$, '42501', NULL, 'Un compte ne peut écrire dans une nouvelle table');
SELECT throws_ok($$SELECT nextval('public.default_privileges_probe_seq')$$, '42501', NULL, 'Un compte ne peut utiliser une nouvelle séquence');
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
