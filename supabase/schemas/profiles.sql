CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  role text CHECK (role IN ('mentor', 'mentee')),
  headline text,
  company_or_school text,
  years_of_experience integer CHECK (years_of_experience >= 0 AND years_of_experience <= 70),
  linkedin_url text CHECK (linkedin_url IS NULL OR linkedin_url ~ '^https://([a-z]{2,3}\.)?linkedin\.com/.*$'),
  skills text[] DEFAULT '{}'::text[],
  bio text,
  resume_url text,
  is_onboarded boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_active_mentors ON public.profiles (id)
  WHERE role = 'mentor' AND is_active = true AND is_onboarded = true;
CREATE INDEX idx_profiles_skills ON public.profiles USING GIN (skills);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;

CREATE POLICY profiles_read_own ON public.profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY profiles_read_active_mentors ON public.profiles
  FOR SELECT TO authenticated
  USING (role = 'mentor' AND is_active = true AND is_onboarded = true);

-- Auth crée le compte sans JWT utilisateur : NEW.id est la source de l’identité.
-- Aucune métadonnée LinkedIn ne participe aux autorisations.
CREATE FUNCTION private.create_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

REVOKE ALL ON FUNCTION private.create_profile() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.create_profile();
