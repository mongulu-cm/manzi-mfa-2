-- Migration de données uniquement ; la structure est déclarée dans schemas/profiles.sql.
INSERT INTO public.profiles (id, display_name, avatar_url)
SELECT
  id,
  CASE WHEN jsonb_typeof(raw_user_meta_data -> 'name') = 'string'
    THEN nullif(btrim(raw_user_meta_data ->> 'name'), '') END,
  CASE WHEN jsonb_typeof(raw_user_meta_data -> 'picture') = 'string'
    AND (raw_user_meta_data ->> 'picture') ~ '^https://[^/@[:space:]]+(/[^[:space:]]*)?$'
    THEN raw_user_meta_data ->> 'picture' END
FROM auth.users
ON CONFLICT (id) DO NOTHING;
