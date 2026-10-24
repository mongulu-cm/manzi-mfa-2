# Spécification de conception — F-017 : Fournir la fondation de données produit

- **Feature ID** : `F-017`
- **Issue** : [mongulu-cm/manzi-mfa-2#13](https://github.com/mongulu-cm/manzi-mfa-2/issues/13)
- **Epic** : E-005 — Opérations et qualité
- **Date** : 2026-10-19
- **Auteur** : Collectif Mongulu
- **Exigences sources** : `R-041`
- **Éléments d’architecture** : `AR-007`, `AR-008`, `AR-013`

---

## 1. Contexte et Objectifs

La mission de Manzi-mfa nécessite un socle de données persistant, robuste, hautement sécurisé et respectueux de la vie privée (RGPD).
L'objectif de **F-017** est d'établir la fondation de données produit sous PostgreSQL (tables structurées, contraintes, RLS) et Supabase Storage (fichiers, avatars, CVs) accessible via une frontière applicative contrôlée (serveur Nuxt Nitro / `@supabase/server`).

### Objectifs clés
1. **Données structurées sous PostgreSQL** : Évolution du schéma `profiles` pour supporter les profils mentor / mentoré (rôle, intitulé de poste, entreprise/école, années d'expérience, lien LinkedIn, compétences/tags, bio, complétion d'onboarding).
2. **Stockage de fichiers Supabase Storage** : Définition des buckets sécurisés (`avatars` public/lecture seule avec restriction de taille (2 Mo) et formats images stricts, `documents` privé pour les CVs/fichiers avec accès strictement restreint au propriétaire).
3. **Sécurité & Isolation (RLS)** : Politiques Row Level Security strictes interdisant toute lecture ou mutation non autorisée, testées avec pgTAP.
4. **Frontière applicative stable** : Fournir une couche de services TypeScript serveur (`apps/plateforme/server/utils/database.ts` et `storage.ts`) avec validation d'entrée (`@supabase/server`), évitant d'exposer directement le stockage brut aux clients sans contrôle.
5. **Déploiement et tests déterministes** : Migrations SQL reproductibles sous `supabase/migrations/`, schéma déclaratif sous `supabase/schemas/`, et suite de tests pgTAP sous `supabase/tests/`.

---

## 2. Modèle de Données PostgreSQL

### 2.1. Évolution de la table `public.profiles`

La table existante `public.profiles` est étendue pour intégrer les champs requis par F-003 (création de profil mentor/mentoré) :

```sql
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
```

### 2.2. Indexation & Performance
Conformément aux bonnes pratiques Supabase (`supabase-postgres-best-practices`) :
- Index partiel sur les mentors actifs pour accélérer la recherche et le matching (`F-005`) :
  ```sql
  CREATE INDEX IF NOT EXISTS idx_profiles_active_mentors 
  ON public.profiles (id) 
  WHERE role = 'mentor' AND is_active = true AND is_onboarded = true;
  ```
- Index GIN sur les compétences (`skills`) :
  ```sql
  CREATE INDEX IF NOT EXISTS idx_profiles_skills 
  ON public.profiles USING GIN (skills);
  ```

### 2.3. Politiques RLS (Row Level Security)
1. **Lecture** :
   - Un utilisateur authentifié peut lire son propre profil complet (`id = auth.uid()`).
   - La table brute est lisible uniquement par son propriétaire, y compris pour un mentor actif et complété.
   - L'annuaire passe par `public.list_active_mentors()`, une RPC réservée aux utilisateurs authentifiés avec une identité JWT. Elle retourne uniquement `id`, `display_name`, `avatar_url`, `headline`, `company_or_school`, `years_of_experience`, `skills` et `bio` des mentors actifs et complétés. `resume_url` et `linkedin_url` restent privés.
   - Les utilisateurs anonymes n'ont aucun accès en lecture à la table `profiles`.
2. **Mise à jour** :
   - Seul le propriétaire peut mettre à jour son propre profil (`id = auth.uid()`).
   - La modification directe de `id` et `created_at` est interdite.
3. **Suppression** :
   - Seule la suppression de cascade Auth ou une fonction sécurisée autorisée peut supprimer la ligne.

---

## 3. Fondation Supabase Storage

### 3.1. Buckets de stockage

1. **Bucket `avatars`** :
   - Visibilité : Public (accès direct en lecture via URL publique pour les images de profil).
   - Taille maximale de fichier : 2 Mo (`file_size_limit: 2097152`).
   - Types MIME autorisés : `image/jpeg`, `image/png`, `image/webp`.
   - Chemin standardisé : `{uid}/{filename}` (normalisé et sanitisé sous le répertoire de l'utilisateur).

2. **Bucket `documents`** :
   - Visibilité : Privé (accès par URL signée uniquement, pour les CVs et justificatifs).
   - Taille maximale de fichier : 5 Mo (`file_size_limit: 5242880`).
   - Types MIME autorisés : `application/pdf`.
   - Chemin standardisé : `{uid}/cv.pdf`.

### 3.2. Politiques de sécurité Storage (`storage.objects`)
- **Bucket `avatars`** :
   - **SELECT** : Le propriétaire seul peut lister ses objets via l'API ; les images restent accessibles par leur URL publique.
  - **INSERT / UPDATE / DELETE** : Autorisé uniquement à l'utilisateur authentifié sur son propre dossier (`bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text`).
- **Bucket `documents`** :
  - **SELECT / INSERT / UPDATE / DELETE** : Autorisé uniquement à l'utilisateur authentifié sur son propre dossier (`bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text`).

---

## 4. Frontière Applicative Côté Serveur (Nuxt Nitro)

Conformément à la décision d'architecture : *« Ne pas exposer directement le stockage aux interfaces utilisateur »*.

### 4.1. Modules et Utilitaires Serveur (`apps/plateforme/server/utils/`)

1. **`server/utils/database.ts`** :
   - Fournit les fonctions typées d'accès aux profils (lecture de profil, mise à jour de profil avec validation de schéma Zod/valibot ou standard, recherche de mentors).
   - Gestion d'erreurs normalisée et sûre (aucun détail d'infrastructure ou chaîne de connexion divulgué).
2. **`server/utils/storage.ts`** :
   - Vérification de l'authentification de l'utilisateur (`userClaims.id`).
   - Upload sécurisé de fichier (vérification du type MIME, validation de taille, stockage sous `{uid}/...`).
   - Génération d'URL signée pour la consultation sécurisée des documents privés.
   - La signature exige un chemin canonique `{uid}/{filename}` avec un nom de fichier ASCII sûr ; les traversées, encodages, antislashs, paramètres et fragments sont refusés avant l'appel Storage, même avec un client administrateur.

---

## 5. Critères d'Acceptation & Stratégie de Test

### 5.1. Validation des critères d'acceptation
- [x] **Persistance PostgreSQL via la couche applicative** : Profils mis à jour et interrogés via les utilitaires serveur.
- [x] **Stockage Supabase Storage** : Fichiers stockés et relus via les buckets dédiés.
- [x] **Règles d'accès RLS** : Isolation prouvée par des tests pgTAP (aucun utilisateur ne peut modifier ou lire indûment un profil/document tiers).
- [x] **Contraintes et migrations testées** : `npm run test:db` valide les migrations, contraintes CHECK et politiques de sécurité.
- [x] **Contrat stable** : Typage TypeScript complet pour les entités `Profile`, `MentorProfile` et les opérations de storage.

### 5.2. Suite de tests
1. **Tests pgTAP (`supabase/tests/`)** :
   - Extension de `profiles.test.sql` pour valider les nouveaux champs et les politiques RLS (lecture de son propre profil, lecture publique restreinte des mentors actifs, interdiction pour un tiers).
   - Création de `storage.test.sql` pour valider l'accès aux buckets `avatars` et `documents`.
2. **Tests Unitaires (`tests/unit/`)** :
   - Validation des utilitaires serveur de profils et storage.
3. **Contrôles CI** :
   - `npm run check`, `npm run test:unit`, `npm run test:coverage`, `npm run test:db`.
