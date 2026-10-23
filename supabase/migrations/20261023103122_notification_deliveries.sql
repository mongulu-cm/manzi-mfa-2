SET local check_function_bodies = off;

CREATE TABLE "public"."notification_deliveries" (
  "idempotency_key"     text                     NOT NULL,
  "quick_chat_id"       uuid                     NOT NULL,
  "event_type"          text                     NOT NULL,
  "recipient_role"      text                     NOT NULL,
  "recipient_id"        uuid                     NOT NULL,
  "status"              text                     NOT NULL DEFAULT 'pending'::text,
  "attempts"            integer                  NOT NULL DEFAULT 1,
  "provider_message_id" text,
  "last_error_code"     text,
  "last_provider_code"  text,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "notification_deliveries_attempts_check" CHECK ((attempts >= 1)),
  CONSTRAINT "notification_deliveries_event_type_check" CHECK ((event_type = ANY (ARRAY['quick_chat.created'::text, 'quick_chat.updated'::text]))),
  CONSTRAINT "notification_deliveries_idempotency_key_check" CHECK ((char_length(idempotency_key) <= 200)),
  CONSTRAINT "notification_deliveries_last_error_code_check"
    CHECK ((last_error_code = ANY (ARRAY['journal_unavailable'::text, 'provider_rejected'::text, 'provider_unavailable'::text, 'provider_timeout'::text]))),
  CONSTRAINT "notification_deliveries_last_provider_code_check" CHECK ((last_provider_code ~ '^E_[A-Z_]{1,64}$'::text)),
  CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY (idempotency_key),
  CONSTRAINT "notification_deliveries_provider_message_id_check" CHECK ((char_length(provider_message_id) <= 200)),
  CONSTRAINT "notification_deliveries_recipient_role_check" CHECK ((recipient_role = ANY (ARRAY['mentor'::text, 'mentee'::text]))),
  CONSTRAINT "notification_deliveries_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text, 'uncertain'::text])))
);

ALTER TABLE "public"."notification_deliveries"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."notification_deliveries" FROM "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.finish_notification_delivery (
  p_idempotency_key     text,
  p_status              text,
  p_provider_message_id text DEFAULT NULL::text,
  p_error_code          text DEFAULT NULL::text,
  p_provider_code       text DEFAULT NULL::text
)
  RETURNS boolean
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
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
  WHERE idempotency_key = p_idempotency_key;
  RETURN FOUND;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."finish_notification_delivery"(text, text, text, text, text) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.reserve_notification_delivery (
  p_idempotency_key     text,
  p_quick_chat_id       uuid,
  p_event_type          text,
  p_recipient_role      text,
  p_recipient_id        uuid,
  p_pending_ttl_seconds integer
)
  RETURNS TABLE (
    decision text,
    attempt  integer
  )
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
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
$function$;

REVOKE ALL ON FUNCTION "public"."reserve_notification_delivery"(text, uuid, text, text, uuid, integer) FROM PUBLIC, "anon", "authenticated";

ALTER TABLE "public"."notification_deliveries"
  ADD CONSTRAINT "notification_deliveries_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX notification_deliveries_quick_chat_id_idx ON public.notification_deliveries USING btree (quick_chat_id);

CREATE INDEX notification_deliveries_recipient_id_idx ON public.notification_deliveries USING btree (recipient_id);

REVOKE ALL ON FUNCTION "public"."finish_notification_delivery"(text, text, text, text, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."finish_notification_delivery"(text, text, text, text, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."finish_notification_delivery"(text, text, text, text, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."reserve_notification_delivery"(text, uuid, text, text, uuid, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."reserve_notification_delivery"(text, uuid, text, text, uuid, integer) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."reserve_notification_delivery"(text, uuid, text, text, uuid, integer) TO "service_role";

REVOKE ALL ON TABLE "public"."notification_deliveries" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notification_deliveries" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notification_deliveries" TO "service_role";
