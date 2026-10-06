SET local check_function_bodies = off;

CREATE SCHEMA "private";

CREATE TABLE "public"."profiles" (
  "id"           uuid                     NOT NULL,
  "display_name" text,
  "avatar_url"   text,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."profiles" FROM "anon";

CREATE OR REPLACE FUNCTION private.create_profile()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    CASE WHEN jsonb_typeof(NEW.raw_user_meta_data -> 'name') = 'string'
      THEN nullif(btrim(NEW.raw_user_meta_data ->> 'name'), '') END,
    CASE WHEN jsonb_typeof(NEW.raw_user_meta_data -> 'picture') = 'string'
      AND (NEW.raw_user_meta_data ->> 'picture') ~ '^https://[^/@[:space:]]+(/[^[:space:]]*)?$'
      THEN NEW.raw_user_meta_data ->> 'picture' END
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION private.create_profile();

CREATE POLICY "profiles_read_own" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = id));

REVOKE ALL ON FUNCTION "private"."create_profile"() FROM PUBLIC;

REVOKE ALL ON TABLE "public"."profiles" FROM "authenticated";

GRANT SELECT ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";
