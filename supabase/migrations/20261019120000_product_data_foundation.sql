ALTER TABLE "public"."profiles"
  ADD COLUMN IF NOT EXISTS "role" text CHECK ("role" IN ('mentor', 'mentee')),
  ADD COLUMN IF NOT EXISTS "headline" text,
  ADD COLUMN IF NOT EXISTS "company_or_school" text,
  ADD COLUMN IF NOT EXISTS "years_of_experience" integer CHECK ("years_of_experience" >= 0 AND "years_of_experience" <= 70),
  ADD COLUMN IF NOT EXISTS "linkedin_url" text CHECK ("linkedin_url" IS NULL OR "linkedin_url" ~ '^https://([a-z]{2,3}\.)?linkedin\.com/.*$'),
  ADD COLUMN IF NOT EXISTS "skills" text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS "bio" text,
  ADD COLUMN IF NOT EXISTS "resume_url" text,
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

GRANT UPDATE ON TABLE "public"."profiles" TO "authenticated";
