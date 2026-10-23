ALTER TABLE "public"."profiles"
  ADD COLUMN IF NOT EXISTS "role" text CHECK ("role" IN ('mentor', 'mentee')),
  ADD COLUMN IF NOT EXISTS "headline" text CHECK ("headline" IS NULL OR char_length("headline") <= 120),
  ADD COLUMN IF NOT EXISTS "company_or_school" text CHECK ("company_or_school" IS NULL OR char_length("company_or_school") <= 120),
  ADD COLUMN IF NOT EXISTS "years_of_experience" integer CHECK ("years_of_experience" >= 0 AND "years_of_experience" <= 70),
  ADD COLUMN IF NOT EXISTS "linkedin_url" text CHECK ("linkedin_url" IS NULL OR "linkedin_url" ~* '^https://([a-z0-9-]+\.)*linkedin\.com(/.*)?$'),
  ADD COLUMN IF NOT EXISTS "skills" text[] DEFAULT '{}'::text[] CHECK (cardinality("skills") <= 30),
  ADD COLUMN IF NOT EXISTS "bio" text CHECK ("bio" IS NULL OR char_length("bio") <= 1000),
  ADD COLUMN IF NOT EXISTS "resume_url" text CHECK ("resume_url" IS NULL OR char_length("resume_url") <= 500),
  ADD COLUMN IF NOT EXISTS "is_onboarded" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS "idx_profiles_active_mentors"
  ON "public"."profiles" ("id")
  WHERE "role" = 'mentor' AND "is_active" = true AND "is_onboarded" = true;

CREATE INDEX IF NOT EXISTS "idx_profiles_skills"
  ON "public"."profiles" USING GIN ("skills");

-- Politique pour permettre à l'utilisateur de mettre à jour son propre profil
CREATE POLICY "profiles_update_own" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = id));

-- Politique pour permettre la lecture des mentors publics actifs et onboardés
CREATE POLICY "profiles_read_active_mentors" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ("role" = 'mentor' AND "is_active" = true AND "is_onboarded" = true);

REVOKE ALL ON TABLE "public"."profiles" FROM "authenticated";
GRANT SELECT ON TABLE "public"."profiles" TO "authenticated";
GRANT UPDATE ("display_name", "headline", "company_or_school", "years_of_experience", "linkedin_url", "skills", "bio", "resume_url", "role", "is_onboarded") ON TABLE "public"."profiles" TO "authenticated";

CREATE OR REPLACE FUNCTION private.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  NEW.created_at = OLD.created_at;
  NEW.id = OLD.id;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.set_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tr_profiles_set_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();
