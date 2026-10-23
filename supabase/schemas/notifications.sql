-- Journal des emails Quick Chat (F-008) : idempotence et diagnostic, sans adresse ni contenu.
CREATE TABLE public.notification_deliveries (
  idempotency_key text PRIMARY KEY CHECK (char_length(idempotency_key) <= 200),
  -- Pas de clé étrangère tant que F-007 n'a pas créé la table des Quick Chats.
  quick_chat_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('quick_chat.created', 'quick_chat.updated')),
  recipient_role text NOT NULL CHECK (recipient_role IN ('mentor', 'mentee')),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'uncertain')),
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts >= 1),
  provider_message_id text CHECK (char_length(provider_message_id) <= 200),
  last_error_code text CHECK (last_error_code IN (
    'journal_unavailable', 'provider_rejected', 'provider_unavailable', 'provider_timeout', 'provider_uncertain'
  )),
  last_provider_code text CHECK (last_provider_code ~ '^E_[A-Z_]{1,64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notification_deliveries_recipient_id_idx ON public.notification_deliveries (recipient_id);
CREATE INDEX notification_deliveries_quick_chat_id_idx ON public.notification_deliveries (quick_chat_id);

-- RLS sans politique : seul le serveur (clé secret) y accède.
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.notification_deliveries FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.notification_deliveries TO service_role;

-- Réservation atomique (spec § 5.4) : la ligne est verrouillée et l'horloge est celle de la base,
-- de sorte que deux appels concurrents ne peuvent pas réserver le même envoi.
CREATE FUNCTION public.reserve_notification_delivery(
  p_idempotency_key text,
  p_quick_chat_id uuid,
  p_event_type text,
  p_recipient_role text,
  p_recipient_id uuid,
  p_pending_ttl_seconds integer
)
RETURNS TABLE (decision text, attempt integer)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  delivery public.notification_deliveries%ROWTYPE;
BEGIN
  INSERT INTO public.notification_deliveries (idempotency_key, quick_chat_id, event_type, recipient_role, recipient_id)
  VALUES (p_idempotency_key, p_quick_chat_id, p_event_type, p_recipient_role, p_recipient_id)
  ON CONFLICT (idempotency_key) DO NOTHING;
  IF FOUND THEN
    RETURN QUERY SELECT 'send'::text, 1;
    RETURN;
  END IF;

  SELECT * INTO delivery FROM public.notification_deliveries
  WHERE idempotency_key = p_idempotency_key
  FOR UPDATE;

  IF delivery.status = 'sent' THEN
    RETURN QUERY SELECT 'duplicate'::text, NULL::integer;
  ELSIF delivery.status = 'uncertain' THEN
    RETURN QUERY SELECT 'uncertain'::text, NULL::integer;
  ELSIF delivery.status = 'pending' AND delivery.updated_at > now() - make_interval(secs => p_pending_ttl_seconds) THEN
    RETURN QUERY SELECT 'in_progress'::text, NULL::integer;
  ELSIF delivery.status = 'pending' THEN
    -- Envoi interrompu : issue inconnue, jamais renvoyé automatiquement.
    UPDATE public.notification_deliveries SET status = 'uncertain', updated_at = now()
    WHERE idempotency_key = p_idempotency_key;
    RETURN QUERY SELECT 'uncertain'::text, NULL::integer;
  ELSE
    UPDATE public.notification_deliveries
    SET status = 'pending', attempts = attempts + 1, updated_at = now()
    WHERE idempotency_key = p_idempotency_key
    RETURNING attempts INTO delivery.attempts;
    RETURN QUERY SELECT 'send'::text, delivery.attempts;
  END IF;
END;
$$;

-- Issue d'une tentative réservée ; retourne false si la ligne n'existe pas ou si une autre
-- tentative l'a réservée depuis, de sorte qu'une tentative attardée n'écrase rien.
CREATE FUNCTION public.finish_notification_delivery(
  p_idempotency_key text,
  p_attempt integer,
  p_status text,
  p_provider_message_id text DEFAULT NULL,
  p_error_code text DEFAULT NULL,
  p_provider_code text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF p_status NOT IN ('sent', 'failed', 'uncertain') THEN
    RAISE EXCEPTION 'invalid delivery status' USING ERRCODE = '22023';
  END IF;
  UPDATE public.notification_deliveries
  SET status = p_status,
    provider_message_id = coalesce(p_provider_message_id, provider_message_id),
    last_error_code = p_error_code,
    last_provider_code = p_provider_code,
    updated_at = now()
  WHERE idempotency_key = p_idempotency_key AND attempts = p_attempt;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_notification_delivery(text, uuid, text, text, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_notification_delivery(text, integer, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_notification_delivery(text, uuid, text, text, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_notification_delivery(text, integer, text, text, text, text) TO service_role;
