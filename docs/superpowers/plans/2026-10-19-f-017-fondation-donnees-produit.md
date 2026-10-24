# F-017 : Fournir la fondation de données produit — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Concevoir et livrer la fondation de données produit de Manzi-mfa : tables PostgreSQL enrichies (`profiles`), buckets Supabase Storage sécurisés (`avatars`, `documents`), politiques RLS strictes avec tests pgTAP, et couche de services applicative serveur typée.

**Architecture:** Extension de la base PostgreSQL existante via des migrations versionnées dans `supabase/migrations/` et synchronisation déclarative dans `supabase/schemas/`, tests pgTAP sous `supabase/tests/`, contrats TypeScript partagés dans `layers/mongulu/app/types/`, et utilitaires serveur sécurisés sous `apps/plateforme/server/utils/`.

**Tech Stack:** PostgreSQL, Supabase (Auth, Database, Storage, pgTAP), TypeScript strict, Nuxt 4 Nitro, Vitest (V8 coverage).

**Spec:** `docs/superpowers/specs/2026-10-19-f-017-fondation-donnees-produit-design.md`

**Frontière de lecture :** la table `profiles` reste lisible uniquement par son propriétaire. La découverte des mentors passe par la RPC `public.list_active_mentors()`, qui impose une projection publique en SQL. La signature des documents impose un chemin canonique avant tout appel au SDK. Les tests `mentor_directory.test.sql` et `server-storage.test.ts` couvrent ces frontières.

## Global Constraints

- Respect strict des conventions Supabase : identifiants en minuscules avec snake_case, contraintes CHECK explicites, indexation partielle des requêtes courantes, triggers `SECURITY DEFINER` avec `SET search_path TO ''`.
- Isolation RLS totale : aucun accès anonyme aux données privées, interdiction stricte de lire ou muter les données/documents d'un utilisateur tiers.
- Frontière serveur : aucune clé secrète (`sb_secret_...`) divulguée côté client, gestion des erreurs masquant les détails d'infrastructure.
- Qualité & CI : maintien des seuils de couverture unitaire Vitest (95% statements, 85% branches, 100% functions/lines), zéro code mort (`fallow`), et 100% de passage des tests pgTAP (`npm run test:db` en environnement CI/local).

## Review Focus

- Tentative de mise à jour d'un profil par un tiers ou avec un rôle invalide : la politique RLS et la contrainte CHECK rejettent l'opération de façon sûre.
- Tentative d'accès à un document privé dans `documents` sans être le propriétaire du dossier : rejet strict par RLS.
- Profil mentor non complété (`is_onboarded = false`) ou inactif (`is_active = false`) : absent de la RPC `public.list_active_mentors()`. Les profils bruts des tiers restent invisibles quel que soit leur statut.
- URLs LinkedIn malformées ou non sécurisées (ex: HTTP au lieu de HTTPS ou domaine externe) : rejetées par la contrainte regex de validation.
- Suppression d'un utilisateur dans `auth.users` : suppression en cascade automatique de son profil et cohérence de la base.

---

### Task 1: Migration SQL et Schéma déclaratif pour l'évolution de la table `profiles`

**Files:**
- Migration initiale : `supabase/migrations/20261019120000_product_data_foundation.sql`
- Migration corrective : `supabase/migrations/20261024100134_secure_profile_boundaries.sql`
- Modify: `supabase/schemas/profiles.sql`
- Modify: `supabase/tests/profiles.test.sql`
- Create: `supabase/tests/mentor_directory.test.sql`

**Interfaces:**
- Produces: Colonnes `role`, `headline`, `company_or_school`, `years_of_experience`, `linkedin_url`, `skills`, `bio`, `resume_url`, `is_onboarded`, `is_active`, `updated_at` sur `public.profiles`.
- Produces: Politiques RLS réservant la lecture complète et la mise à jour du profil à son propriétaire.
- Produces: RPC `public.list_active_mentors()` accessible aux utilisateurs authentifiés, qui retourne uniquement `id`, `display_name`, `avatar_url`, `headline`, `company_or_school`, `years_of_experience`, `skills` et `bio` pour les mentors actifs et onboardés.

- [ ] **Step 1: Écrire les assertions pgTAP dans `supabase/tests/profiles.test.sql` et `supabase/tests/mentor_directory.test.sql`**

Ajouter les tests vérifiant :
- Validation des colonnes et contraintes CHECK (`role IN ('mentor', 'mentee')`, `years_of_experience BETWEEN 0 AND 70`, `linkedin_url`, limites des textes et compétences).
- Lecture complète et mise à jour autorisées pour le propriétaire de son propre profil (`UPDATE public.profiles SET headline = 'DevOps Senior' WHERE id = auth.uid()`).
- Impossibilité de lire ou modifier le profil brut d'un tiers, y compris celui d'un mentor actif et onboardé ; `resume_url` et `linkedin_url` restent privés.
- Lecture des mentors actifs et onboardés via `public.list_active_mentors()` par un autre utilisateur authentifié.
- Exclusion des mentorés, mentors non onboardés et mentors inactifs du résultat de la RPC.
- Projection SQL de la RPC sans `resume_url` ni `linkedin_url`, refus des appels anonymes et résultat vide sans identité utilisateur.

- [ ] **Step 2: Déclarer le modèle final dans `supabase/schemas/profiles.sql`**

Ce fichier est la source canonique des colonnes, contraintes, index, fonctions, triggers et privilèges. Conserver uniquement `profiles_read_own` pour la lecture de la table et `profiles_update_own` pour sa mise à jour, avec les droits UPDATE limités aux colonnes éditables.

Déclarer `public.list_active_mentors()` avec une liste de colonnes de retour fixe, les filtres `role = 'mentor'`, `is_active = true`, `is_onboarded = true` et une identité `auth.uid()` non nulle. Cette fonction SQL `STABLE SECURITY DEFINER` utilise un `search_path` vide pour lire la projection publique malgré la RLS propriétaire. Révoquer son droit EXECUTE par défaut à `PUBLIC` et à `anon`, puis l'accorder à `authenticated` et `service_role`.

- [ ] **Step 3: Générer et relire la migration depuis le schéma déclaratif**

Run: `npx supabase db schema declarative sync -f secure_profile_boundaries --no-apply`

La migration corrective `supabase/migrations/20261024100134_secure_profile_boundaries.sql` supprime la politique de lecture interprofils de la migration initiale, renforce la contrainte des compétences et crée la RPC avec ses privilèges. Appliquer toute la chaîne des migrations pour obtenir le modèle final ; ne pas réintroduire la lecture des mentors tiers sur la table brute.

- [ ] **Step 4: Valider les migrations et la cohérence de schéma**

Run: `npm run test:db` après application des migrations sur une base Supabase locale réinitialisée.
Expected: Tous les tests pgTAP de profils et d'annuaire passent, notamment la confidentialité des colonnes privées lors d'un accès direct à la table.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261019120000_product_data_foundation.sql supabase/migrations/20261024100134_secure_profile_boundaries.sql supabase/schemas/profiles.sql supabase/tests/profiles.test.sql supabase/tests/mentor_directory.test.sql
git commit -m "feat(db): ajouter les champs métier et sécuriser l'annuaire des mentors"
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
- Les avatars sont accessibles par leur URL publique ; le listing des objets via l’API est réservé au propriétaire du dossier.
- La lecture du bucket privé `documents` est refusée aux tiers.

- [ ] **Step 2: Déclarer les buckets et politiques dans `supabase/schemas/storage.sql`**

Le schéma canonique `supabase/schemas/storage.sql` définit les buckets et les politiques appliqués par `supabase/migrations/20261019120100_storage_buckets.sql` :
- `avatars` est public pour la lecture par URL CDN, avec une limite de 2 Mo par fichier et les types JPEG/PNG/WebP. La politique SELECT `avatars_select_own` réserve le listing API au propriétaire ; INSERT, UPDATE et DELETE sont également limités à son dossier.
- `documents` est privé, avec une limite de 5 Mo par fichier et le type PDF. Les quatre opérations sont limitées au dossier du propriétaire.
- Les politiques de propriété comparent `(storage.foldername(name))[1]` à `(SELECT auth.uid()::text)` ; aucun SELECT public sur `storage.objects` n'est accordé.

Réutiliser ces définitions plutôt qu'une copie de SQL dans le plan.

- [ ] **Step 3: Générer et relire la migration depuis le schéma canonique**

Run: `npx supabase db schema declarative sync -f storage_buckets --no-apply`
Expected: La migration générée correspond aux définitions de `supabase/schemas/storage.sql`. Versionner le schéma et la migration ensemble ; ne pas écrire la migration avant le schéma.

- [ ] **Step 4: Valider les migrations et les politiques Storage**

Run: `npm run test:db` après application des migrations sur une base Supabase locale réinitialisée.
Expected: Tous les tests pgTAP de profils, annuaire et Storage passent.

- [ ] **Step 5: Commit**

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
- `fetchActiveMentors` appelle `client.rpc('list_active_mentors')`, mappe sa projection publique vers `MentorPublicProfile` et masque les erreurs SQL ; aucun SELECT interprofils sur la table brute.

- [ ] **Step 2: Implémenter `apps/plateforme/server/utils/database.ts`**

Implémenter `fetchUserProfile` et `updateUserProfile` sur la table `profiles` avec le client de l'utilisateur vérifié. Implémenter `fetchActiveMentors` via `client.rpc('list_active_mentors')` ; les filtres d'éligibilité et la projection publique sont imposés par SQL. Gérer les erreurs sans fuite d'informations sensibles.

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
