-- See supabase/schemas/profiles.sql for the declarative source.
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

ALTER TABLE public.profiles DROP CONSTRAINT profiles_skills_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_skills_check CHECK (private.valid_profile_skills(skills));

DROP POLICY profiles_read_active_mentors ON public.profiles;

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

