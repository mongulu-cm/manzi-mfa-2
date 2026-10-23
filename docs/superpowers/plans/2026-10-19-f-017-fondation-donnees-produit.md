# F-017 : Fournir la fondation de données produit — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Concevoir et livrer la fondation de données produit de Manzi-mfa : tables PostgreSQL enrichies (`profiles`), buckets Supabase Storage sécurisés (`avatars`, `documents`), politiques RLS strictes avec tests pgTAP, et couche de services applicative serveur typée.

**Architecture:** Extension de la base PostgreSQL existante via des migrations versionnées dans `supabase/migrations/` et synchronisation déclarative dans `supabase/schemas/`, tests pgTAP sous `supabase/tests/`, contrats TypeScript partagés dans `layers/mongulu/app/types/`, et utilitaires serveur sécurisés sous `apps/plateforme/server/utils/`.

**Tech Stack:** PostgreSQL, Supabase (Auth, Database, Storage, pgTAP), TypeScript strict, Nuxt 4 Nitro, Vitest (V8 coverage).

**Spec:** `docs/superpowers/specs/2026-10-19-f-017-fondation-donnees-produit-design.md`

## Global Constraints

- Respect strict des conventions Supabase : identifiants en minuscules avec snake_case, contraintes CHECK explicites, indexation partielle des requêtes courantes, triggers `SECURITY DEFINER` avec `SET search_path TO ''`.
- Isolation RLS totale : aucun accès anonyme aux données privées, interdiction stricte de lire ou muter les données/documents d'un utilisateur tiers.
- Frontière serveur : aucune clé secrète (`sb_secret_...`) divulguée côté client, gestion des erreurs masquant les détails d'infrastructure.
- Qualité & CI : maintien des seuils de couverture unitaire Vitest (95% statements, 85% branches, 100% functions/lines), zéro code mort (`fallow`), et 100% de passage des tests pgTAP (`npm run test:db` en environnement CI/local).

## Review Focus

- Tentative de mise à jour d'un profil par un tiers ou avec un rôle invalide : la politique RLS et la contrainte CHECK rejettent l'opération de façon sûre.
- Tentative d'accès à un document privé dans `documents` sans être le propriétaire du dossier : rejet strict par RLS.
- Profil mentor non complété (`is_onboarded = false`) ou inactif (`is_active = false`) : invisible dans la liste publique des mentors.
- URLs LinkedIn malformées ou non sécurisées (ex: HTTP au lieu de HTTPS ou domaine externe) : rejetées par la contrainte regex de validation.
- Suppression d'un utilisateur dans `auth.users` : suppression en cascade automatique de son profil et cohérence de la base.

---

### Task 1: Migration SQL et Schéma déclaratif pour l'évolution de la table `profiles`

**Files:**
- Create: `supabase/migrations/20261019120000_product_data_foundation.sql`
- Modify: `supabase/schemas/profiles.sql`
- Modify: `supabase/tests/profiles.test.sql`

**Interfaces:**
- Produces: Colonnes `role`, `headline`, `company_or_school`, `years_of_experience`, `linkedin_url`, `skills`, `bio`, `resume_url`, `is_onboarded`, `is_active`, `updated_at` sur `public.profiles`.
- Produces: Politiques RLS autorisant le propriétaire à modifier son profil et les utilisateurs authentifiés à consulter les profils mentors actifs/onboardés.

- [ ] **Step 1: Écrire les assertions de test pgTAP dans `supabase/tests/profiles.test.sql`**

Ajouter les tests vérifiant :
- Validation des colonnes et contraintes CHECK (`role IN ('mentor', 'mentee')`, `years_of_experience BETWEEN 0 AND 70`, `linkedin_url`).
- Mise à jour autorisée pour le propriétaire de son propre profil (`UPDATE public.profiles SET headline = 'DevOps Senior' WHERE id = auth.uid()`).
- Interdiction de modifier le profil d'un tiers.
- Lecture autorisée des profils mentors actifs et onboardés par un autre utilisateur authentifié.
- Invisibilité des profils mentorés tiers et des mentors non onboardés.

- [ ] **Step 2: Écrire la migration SQL `supabase/migrations/20261019120000_product_data_foundation.sql`**

```sql
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
```

- [ ] **Step 3: Mettre à jour le fichier déclaratif `supabase/schemas/profiles.sql`**

Reporter la structure complète à jour de la table et des politiques RLS.

- [ ] **Step 4: Valider le lint SQL et la cohérence de schéma**

Run: `npm run test:db` (après application des migrations avec reset Supabase local)
Expected: Tous les tests pgTAP passent.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261019120000_product_data_foundation.sql supabase/schemas/profiles.sql supabase/tests/profiles.test.sql
git commit -m "feat(db): ajouter les champs métier et politiques RLS de profils"
```

---

### Task 2: Configuration et Politiques RLS Supabase Storage (`avatars` et `documents`)

**Files:**
- Create: `supabase/migrations/20261019120100_storage_buckets.sql`
- Create: `supabase/schemas/storage.sql`
- Create: `supabase/tests/storage.test.sql`

**Interfaces:**
- Produces: Buckets `avatars` (public, 2 Mo max, formats image) et `documents` (privé, 5 Mo max, pdf).
- Produces: Politiques RLS sur `storage.objects` isolant les dossiers par `auth.uid()`.

- [ ] **Step 1: Créer le fichier de test pgTAP `supabase/tests/storage.test.sql`**

Vérifier la création des deux buckets et tester l'isolation RLS :
- Un utilisateur peut uploader dans son dossier `{uid}/...`.
- Un utilisateur ne peut pas uploader dans le dossier d'un tiers.
- La lecture du bucket public `avatars` est permise.
- La lecture du bucket privé `documents` est refusée aux tiers.

- [ ] **Step 2: Créer la migration `supabase/migrations/20261019120100_storage_buckets.sql`**

```sql
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
CREATE POLICY "avatars_select_public" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

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
```

- [ ] **Step 3: Documenter le schéma déclaratif dans `supabase/schemas/storage.sql`**

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20261019120100_storage_buckets.sql supabase/schemas/storage.sql supabase/tests/storage.test.sql
git commit -m "feat(db): configurer les buckets et politiques RLS de stockage Supabase"
```

---

### Task 3: Contrat TypeScript & Types partagés (`profile.ts`)

**Files:**
- Create: `layers/mongulu/app/types/profile.ts`
- Test: `tests/unit/profile-types.test.ts`

**Interfaces:**
- Produces: Types `UserRole`, `Profile`, `MentorPublicProfile`, `ProfileUpdateInput`, et fonction de validation `validateProfileUpdateInput`.

- [ ] **Step 1: Écrire le test unitaire `tests/unit/profile-types.test.ts`**

Tester la validation des champs :
- Valider le rôle lorsqu'il est fourni (`mentor` ou `mentee`); le rendre obligatoire uniquement lors de l'onboarding.
- Validation des années d'expérience (0 à 70).
- Validation de format de l'URL LinkedIn (HTTPS et domaine valide).
- Validation des compétences (array de chaînes non vides).

- [ ] **Step 2: Implémenter `layers/mongulu/app/types/profile.ts`**

```typescript
export type UserRole = 'mentor' | 'mentee'

export interface Profile {
  id: string
  displayName: string | null
  avatarUrl: string | null
  role: UserRole | null
  headline: string | null
  companyOrSchool: string | null
  yearsOfExperience: number | null
  linkedinUrl: string | null
  skills: string[]
  bio: string | null
  resumeUrl: string | null
  isOnboarded: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MentorPublicProfile {
  id: string
  displayName: string
  avatarUrl: string | null
  headline: string
  companyOrSchool: string
  yearsOfExperience: number
  skills: string[]
  bio: string | null
}

export interface ProfileUpdateInput {
  role?: UserRole
  headline?: string
  companyOrSchool?: string
  yearsOfExperience?: number
  linkedinUrl?: string | null
  skills?: string[]
  bio?: string | null
  resumeUrl?: string | null
  isOnboarded?: boolean
}

export function validateProfileUpdateInput(input: unknown): { valid: boolean; errors: string[] } {
  // Logique pure de validation
}
```

- [ ] **Step 3: Vérifier les tests unitaires**

Run: `npx vitest run tests/unit/profile-types.test.ts --config vitest.unit.config.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add layers/mongulu/app/types/profile.ts tests/unit/profile-types.test.ts
git commit -m "feat(types): définir le contrat TypeScript pour les profils et la validation"
```

---

### Task 4: Frontière applicative serveur pour les données et profils

**Files:**
- Create: `apps/plateforme/server/utils/database.ts`
- Test: `tests/unit/server-database.test.ts`

**Interfaces:**
- Consumes: `@supabase/server` et types `Profile`, `ProfileUpdateInput`.
- Produces: Fonctions `fetchUserProfile(client, userId)`, `updateUserProfile(client, userId, input)`, `fetchActiveMentors(client)`.

- [ ] **Step 1: Écrire le test unitaire `tests/unit/server-database.test.ts`**

Tester avec mocks Supabase :
- `fetchUserProfile` retourne le profil typé ou lève une erreur gérée si introuvable.
- `updateUserProfile` applique la validation en amont et effectue la mise à jour SQL.
- `fetchActiveMentors` filtre correctement les mentors actifs et onboardés.

- [ ] **Step 2: Implémenter `apps/plateforme/server/utils/database.ts`**

Implémenter les fonctions d'accès aux profils avec gestion des erreurs sans fuite d'informations sensibles.

- [ ] **Step 3: Vérifier les tests unitaires et la couverture**

Run: `npx vitest run tests/unit/server-database.test.ts --config vitest.unit.config.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/plateforme/server/utils/database.ts tests/unit/server-database.test.ts
git commit -m "feat(server): ajouter les utilitaires serveur d'accès aux profils"
```

---

### Task 5: Frontière applicative serveur pour le stockage de fichiers

**Files:**
- Create: `apps/plateforme/server/utils/storage.ts`
- Test: `tests/unit/server-storage.test.ts`

**Interfaces:**
- Produces: Fonctions serveur de contrôle de fichiers `validateFilePayload(mimeType, sizeBytes, bucket)`, `buildStoragePath(userId, bucket, filename)`, `createSignedDocumentUrl(adminClient, userId, path)`.

- [ ] **Step 1: Écrire le test unitaire `tests/unit/server-storage.test.ts`**

Tester :
- Rejet des types MIME non autorisés (ex: exécutables, scripts).
- Rejet des fichiers dépassant la taille limite (2 Mo avatars, 5 Mo documents).
- Formatage sécurisé du chemin de fichier `{userId}/{sanitizedName}`.

- [ ] **Step 2: Implémenter `apps/plateforme/server/utils/storage.ts`**

- [ ] **Step 3: Vérifier les tests unitaires**

Run: `npx vitest run tests/unit/server-storage.test.ts --config vitest.unit.config.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/plateforme/server/utils/storage.ts tests/unit/server-storage.test.ts
git commit -m "feat(server): ajouter les utilitaires serveur de validation de fichiers et stockage"
```

---

### Task 6: Validation complète des tests (Unitaires, Couverture, Fallow, E2E, Check)

**Files:**
- Aucun fichier de code créé, exécution des vérifications globales.

- [ ] **Step 1: Exécuter l'ensemble des suites de tests**

```bash
npm run check
npm run test:unit
npm run test:coverage
npm run test:stories
npm run test:e2e
npx fallow --ci --format compact
```
Expected: 100% vert, couverture V8 respectée (100% lignes/fonctions).

- [ ] **Step 2: Commit final ou récapitulatif de la branche**
