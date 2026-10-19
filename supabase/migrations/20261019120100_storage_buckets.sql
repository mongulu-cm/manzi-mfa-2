-- Création des buckets de stockage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('documents', 'documents', false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Politiques RLS pour avatars
-- Les avatars sont servis via /object/public/avatars/* sans SELECT anonyme sur storage.objects
-- (évite le listing des dossiers utilisateurs).
CREATE POLICY "avatars_select_own" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

-- Politiques RLS pour documents privés
CREATE POLICY "documents_select_own" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

CREATE POLICY "documents_insert_own" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

CREATE POLICY "documents_update_own" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

CREATE POLICY "documents_delete_own" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));
