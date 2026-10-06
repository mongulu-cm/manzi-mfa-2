BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;
SELECT plan(3);
INSERT INTO auth.users(id, email, raw_user_meta_data) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'existing@example.invalid', '{"name":"Ancien membre","picture":"https://image.example.invalid/photo.png"}');
DELETE FROM public.profiles WHERE id='b0000000-0000-0000-0000-000000000001';

-- BACKFILL_MIGRATION

SELECT is((SELECT display_name FROM public.profiles WHERE id='b0000000-0000-0000-0000-000000000001'), 'Ancien membre', 'Le compte existant reçoit son profil');
UPDATE auth.users SET raw_user_meta_data='{"name":"Nom remplacé"}' WHERE id='b0000000-0000-0000-0000-000000000001';

-- BACKFILL_MIGRATION

SELECT is((SELECT display_name FROM public.profiles WHERE id='b0000000-0000-0000-0000-000000000001'), 'Ancien membre', 'Le remplissage ne remplace pas le profil');
SELECT is((SELECT count(*)::integer FROM public.profiles WHERE id='b0000000-0000-0000-0000-000000000001'), 1, 'Le remplissage est idempotent');
SELECT * FROM finish();
ROLLBACK;
