CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE FUNCTION private.valid_profile_skills(value text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT value IS NULL OR (
    cardinality(value) <= 30
    AND (cardinality(value) = 0 OR array_ndims(value) = 1)
    AND NOT EXISTS (
      SELECT 1 FROM unnest(value) AS skill
      WHERE skill IS NULL OR btrim(skill, E' \t\n\r\v\f') = '' OR char_length(skill) > 50
    )
  );
$$;
REVOKE ALL ON FUNCTION private.valid_profile_skills(text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.valid_profile_skills(text[]) TO authenticated, service_role;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  role text CHECK (role IN ('mentor', 'mentee')),
  headline text CHECK (headline IS NULL OR char_length(headline) <= 120),
  company_or_school text CHECK (company_or_school IS NULL OR char_length(company_or_school) <= 120),
  years_of_experience integer CHECK (years_of_experience >= 0 AND years_of_experience <= 70),
  linkedin_url text CHECK (linkedin_url IS NULL OR linkedin_url ~* '^https://([a-z0-9-]+\.)*linkedin\.com(/.*)?$'),
  skills text[] DEFAULT '{}'::text[] CHECK (private.valid_profile_skills(skills)),
  bio text CHECK (bio IS NULL OR char_length(bio) <= 1000),
  resume_url text CHECK (resume_url IS NULL OR char_length(resume_url) <= 500),
  is_onboarded boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_active_mentors ON public.profiles (id)
  WHERE role = 'mentor' AND is_active = true AND is_onboarded = true;
CREATE INDEX idx_profiles_skills ON public.profiles USING GIN (skills);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (display_name, headline, company_or_school, years_of_experience, linkedin_url, skills, bio, resume_url, role, is_onboarded) ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;

CREATE POLICY profiles_read_own ON public.profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- L'annuaire traverse la RLS uniquement pour cette projection publique figée.
-- La table brute reste lisible par son propriétaire seul.
CREATE FUNCTION public.list_active_mentors()
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  headline text,
  company_or_school text,
  years_of_experience integer,
  skills text[],
  bio text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.headline,
    p.company_or_school, p.years_of_experience, p.skills, p.bio
  FROM public.profiles AS p
  WHERE (SELECT auth.uid()) IS NOT NULL
    AND p.role = 'mentor' AND p.is_active = true AND p.is_onboarded = true;
$$;

REVOKE ALL ON FUNCTION public.list_active_mentors() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_active_mentors() TO authenticated, service_role;

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
