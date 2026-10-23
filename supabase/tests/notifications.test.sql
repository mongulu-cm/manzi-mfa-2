BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
-- Assertion functions are available to test roles only until this transaction rolls back.
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO anon, authenticated, service_role;
SET search_path = public, extensions;
SELECT plan(33);

INSERT INTO auth.users (id, email) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'mentor@example.invalid'),
  ('c0000000-0000-0000-0000-000000000002', 'mentee@example.invalid');

-- Structure et contraintes
SELECT has_table('public', 'notification_deliveries', 'Table du journal présente');
SELECT col_is_pk('public', 'notification_deliveries', 'idempotency_key', 'Clé d’idempotence en clé primaire');
SELECT hasnt_column('public', 'notification_deliveries', 'email', 'Aucune adresse stockée');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.notification_deliveries'::regclass), 'RLS activée');
SELECT is((SELECT count(*)::integer FROM pg_policies WHERE tablename = 'notification_deliveries'), 0, 'Aucune politique RLS');

PREPARE delivery(text, text, text, text) AS
  INSERT INTO public.notification_deliveries (idempotency_key, quick_chat_id, event_type, recipient_role, recipient_id, status)
  VALUES ($1, 'd0000000-0000-0000-0000-000000000001', $2, $3, 'c0000000-0000-0000-0000-000000000001', $4);
SELECT throws_ok($$EXECUTE delivery('k1', 'quick_chat.cancelled', 'mentor', 'pending')$$, '23514', NULL, 'Type d’événement contrôlé');
SELECT throws_ok($$EXECUTE delivery('k2', 'quick_chat.created', 'admin', 'pending')$$, '23514', NULL, 'Rôle contrôlé');
SELECT throws_ok($$EXECUTE delivery('k3', 'quick_chat.created', 'mentor', 'delivered')$$, '23514', NULL, 'Statut contrôlé');
SELECT throws_ok($$INSERT INTO public.notification_deliveries (idempotency_key, quick_chat_id, event_type, recipient_role, recipient_id, attempts)
  VALUES ('k4', 'd0000000-0000-0000-0000-000000000001', 'quick_chat.created', 'mentor', 'c0000000-0000-0000-0000-000000000001', 0)$$,
  '23514', NULL, 'Au moins une tentative');
SELECT throws_ok($$INSERT INTO public.notification_deliveries (idempotency_key, quick_chat_id, event_type, recipient_role, recipient_id, last_provider_code)
  VALUES ('k5', 'd0000000-0000-0000-0000-000000000001', 'quick_chat.created', 'mentor', 'c0000000-0000-0000-0000-000000000001', 'refusé pour a@b.c')$$,
  '23514', NULL, 'Code fournisseur sans texte libre');
SELECT throws_ok($$INSERT INTO public.notification_deliveries (idempotency_key, quick_chat_id, event_type, recipient_role, recipient_id, last_error_code)
  VALUES ('k6', 'd0000000-0000-0000-0000-000000000001', 'quick_chat.created', 'mentor', 'c0000000-0000-0000-0000-000000000001', 'boom')$$,
  '23514', NULL, 'Code d’erreur contrôlé');

-- Réservation et issue d'un envoi
CREATE TEMP TABLE reserved AS
  SELECT * FROM public.reserve_notification_delivery('qc:v1:mentor', 'd0000000-0000-0000-0000-000000000001', 'quick_chat.created', 'mentor', 'c0000000-0000-0000-0000-000000000001', 120);
SELECT results_eq('SELECT decision, attempt FROM reserved', $$VALUES ('send'::text, 1)$$, 'Première réservation : envoi');
SELECT results_eq(
  $$SELECT decision, attempt FROM public.reserve_notification_delivery('qc:v1:mentor', 'd0000000-0000-0000-0000-000000000001', 'quick_chat.created', 'mentor', 'c0000000-0000-0000-0000-000000000001', 120)$$,
  $$VALUES ('in_progress'::text, NULL::integer)$$, 'Envoi en cours non dupliqué');
SELECT ok(public.finish_notification_delivery('qc:v1:mentor', 'failed', NULL, 'provider_unavailable', 'E_RATE_LIMIT_EXCEEDED'), 'Échec enregistré');
SELECT results_eq('SELECT status, last_error_code, last_provider_code FROM public.notification_deliveries WHERE idempotency_key = ''qc:v1:mentor''',
  $$VALUES ('failed'::text, 'provider_unavailable'::text, 'E_RATE_LIMIT_EXCEEDED'::text)$$, 'Codes d’échec conservés');
SELECT results_eq(
  $$SELECT decision, attempt FROM public.reserve_notification_delivery('qc:v1:mentor', 'd0000000-0000-0000-0000-000000000001', 'quick_chat.created', 'mentor', 'c0000000-0000-0000-0000-000000000001', 120)$$,
  $$VALUES ('send'::text, 2)$$, 'Nouvelle tentative après échec');
SELECT ok(public.finish_notification_delivery('qc:v1:mentor', 'sent', 'cf-123'), 'Envoi enregistré');
SELECT results_eq('SELECT status, attempts, provider_message_id, last_error_code FROM public.notification_deliveries WHERE idempotency_key = ''qc:v1:mentor''',
  $$VALUES ('sent'::text, 2, 'cf-123'::text, NULL::text)$$, 'Succès après deux tentatives, erreur effacée');
SELECT results_eq(
  $$SELECT decision FROM public.reserve_notification_delivery('qc:v1:mentor', 'd0000000-0000-0000-0000-000000000001', 'quick_chat.created', 'mentor', 'c0000000-0000-0000-0000-000000000001', 120)$$,
  $$VALUES ('duplicate'::text)$$, 'Rejeu après envoi : doublon');

-- Issue inconnue : délai dépassé ou envoi interrompu
SELECT public.reserve_notification_delivery('qc:v1:mentee', 'd0000000-0000-0000-0000-000000000001', 'quick_chat.created', 'mentee', 'c0000000-0000-0000-0000-000000000002', 120);
UPDATE public.notification_deliveries SET updated_at = now() - interval '3 minutes' WHERE idempotency_key = 'qc:v1:mentee';
SELECT results_eq(
  $$SELECT decision FROM public.reserve_notification_delivery('qc:v1:mentee', 'd0000000-0000-0000-0000-000000000001', 'quick_chat.created', 'mentee', 'c0000000-0000-0000-0000-000000000002', 120)$$,
  $$VALUES ('uncertain'::text)$$, 'Envoi interrompu : issue inconnue');
SELECT is((SELECT status FROM public.notification_deliveries WHERE idempotency_key = 'qc:v1:mentee'), 'uncertain', 'Ligne marquée uncertain');
SELECT results_eq(
  $$SELECT decision FROM public.reserve_notification_delivery('qc:v1:mentee', 'd0000000-0000-0000-0000-000000000001', 'quick_chat.created', 'mentee', 'c0000000-0000-0000-0000-000000000002', 120)$$,
  $$VALUES ('uncertain'::text)$$, 'Issue inconnue jamais renvoyée');
SELECT ok(public.finish_notification_delivery('qc:v1:mentee', 'uncertain', NULL, 'provider_timeout'), 'Délai dépassé enregistré');
SELECT ok(NOT public.finish_notification_delivery('absente', 'sent', 'cf-1'), 'Ligne absente signalée');
SELECT throws_ok($$SELECT public.finish_notification_delivery('qc:v1:mentee', 'pending')$$, '22023', NULL, 'Statut final contrôlé');

-- Accès
SELECT ok(NOT has_function_privilege('anon', 'public.reserve_notification_delivery(text, uuid, text, text, uuid, integer)', 'EXECUTE'), 'Réservation anonyme interdite');
SELECT ok(NOT has_function_privilege('authenticated', 'public.finish_notification_delivery(text, text, text, text, text)', 'EXECUTE'), 'Mise à jour authentifiée interdite');
SELECT ok(has_function_privilege('service_role', 'public.reserve_notification_delivery(text, uuid, text, text, uuid, integer)', 'EXECUTE'), 'Serveur autorisé');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-000000000002', true);
SELECT throws_ok($$SELECT * FROM public.notification_deliveries$$, '42501', NULL, 'Lecture authentifiée interdite, même pour le destinataire');
SELECT throws_ok($$DELETE FROM public.notification_deliveries$$, '42501', NULL, 'Suppression authentifiée interdite');
RESET ROLE;
SET LOCAL ROLE anon;
SELECT throws_ok($$SELECT * FROM public.notification_deliveries$$, '42501', NULL, 'Lecture anonyme interdite');
SELECT throws_ok($$INSERT INTO public.notification_deliveries (idempotency_key, quick_chat_id, event_type, recipient_role, recipient_id)
  VALUES ('x', 'd0000000-0000-0000-0000-000000000001', 'quick_chat.created', 'mentor', 'c0000000-0000-0000-0000-000000000001')$$,
  '42501', NULL, 'Écriture anonyme interdite');
RESET ROLE;

DELETE FROM auth.users WHERE id = 'c0000000-0000-0000-0000-000000000002';
SELECT is((SELECT count(*)::integer FROM public.notification_deliveries WHERE recipient_id = 'c0000000-0000-0000-0000-000000000002'), 0, 'Suppression du compte en cascade');
SELECT * FROM finish();
ROLLBACK;
