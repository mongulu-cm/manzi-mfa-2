# F-012 : Consulter des ressources d’entretien qualifiées — Plan d’implémentation

**Goal:** Publier sur la vitrine une page `/ressources` présentant une sélection validée de services externes de préparation aux entretiens, clairement distinguée des fonctionnalités Manzi-mfa, avec gestion des liens invalides ou indisponibles.

**Architecture:** Données typées versionnées dans la vitrine, validées par une fonction pure ; composant `ResourceCard` et page SSR utilisant les primitives Nuxt UI ; script opt-in de vérification réseau des liens.

**Tech Stack:** Nuxt 4 (SSR), Nuxt UI, TypeScript strict, Vitest, Storybook (interactions + axe), Playwright E2E.

**Spec:** `docs/superpowers/specs/2026-11-02-f-012-ressources-entretien-design.md`

## Global Constraints

- Lire `DESIGN.md` et la skill `nuxt-ui` (`.agents/skills/nuxt-ui`) avant toute UI ; primitives Nuxt UI d’abord, tokens existants, aucune nouvelle dépendance.
- SSR préservé : aucune API navigateur au rendu, aucun état partagé mutable au niveau module.
- Accessibilité : noms accessibles des liens externes, focus visible, cibles ≥ 44 px, état non porté par la seule couleur, 320 px.
- Aucune requête réseau réelle en CI.
- Couverture : seuils existants ; `npx fallow --ci` sans code mort.

---

### Task 1: Modèle et validation

**Files:** Create `apps/vitrine/app/utils/interview-resources.ts`, `tests/unit/interview-resources.test.ts`

- [x] Types `ResourceCategory`, `ResourceLanguage`, `InterviewResource` ; libellés et ordre des catégories.
- [x] `validateResources(list)` : champs requis non vides, `id` slug unique, URL `https:` sans identifiants ni `utm_*`/`ref`/`fbclid`, URL et titres uniques, catégorie et langue connues ; lève une erreur listant les `id` fautifs.
- [x] `resourceDomain(url)` (sans `www.`) et `groupByCategory(list)` dans l’ordre des catégories, sans catégorie vide.
- [x] Tests : un cas invalide par règle, domaine, groupement.

### Task 2: Sélection initiale

**Files:** Create `apps/vitrine/app/data/interview-resources.ts` ; Modify `tests/unit/interview-resources.test.ts`

- [x] Les neuf ressources de la spec § 3, descriptions en français.
- [x] Test : la sélection réelle passe `validateResources`.

### Task 3: Carte de ressource

**Files:** Create `apps/vitrine/app/components/resources/ResourceCard.vue`, `apps/vitrine/stories/resources/ResourceCard.stories.ts`

- [x] `UBadge` « Ressource externe » et langue, domaine, `ULink` externe avec nom accessible complet, icône décorative, `rel="noopener noreferrer"`.
- [x] Stories : défaut, contenu long, ressource en français, mobile ; interaction : nom accessible et attributs du lien.

### Task 4: Page `/ressources` et navigation

**Files:** Create `apps/vitrine/app/pages/ressources.vue`, `apps/vitrine/app/components/resources/ResourceLibrary.vue`, `apps/vitrine/stories/resources/ResourceLibrary.stories.ts` (section, une catégorie, vide) ; Modify `apps/vitrine/app/components/SiteHeaderActions.vue`, `apps/vitrine/app/layouts/default.vue`, stories de `SiteHeaderActions`

- [x] H1, encadré `UAlert` « Ressources externes », sections par catégorie (H2), grille responsive, lien « Signaler un lien cassé ».
- [x] `useSeoMeta` (titre, description).
- [x] Lien « Ressources » dans l’en-tête et le pied de page.

### Task 5: Vérification des liens (opt-in)

**Files:** Create `tests/smoke/resource-links.mjs` ; Modify `package.json` (`test:resource-links`), `.fallowrc.json`

- [x] GET avec délai de 15 s et user-agent navigateur ; classement `ok` / `à vérifier` (401, 403, 429) / `cassé` ; code de sortie non nul seulement si `cassé`.

### Task 6: E2E et documentation

**Files:** Modify `tests/e2e/sites.test.mjs`, `README.md`

- [x] E2E : SSR de `/ressources`, nombre de cartes, noms accessibles, liens d’en-tête et de pied de page, clavier, 320 px et desktop, axe.
- [x] README : section « Ressources d’entretien » (ajout ou retrait par PR, règles de validation, vérification des liens, lien avec F-013).

### Task 7: Vérification finale

- [x] `npm run check`
- [x] `npm run test:coverage`
- [x] `npm run build:storybook && npm run test:stories`
- [x] `npm run test:e2e`
- [x] `npx fallow --ci --format compact` (aucune remarque sur F-012 ; trois remarques de complexité préexistantes sur `main`, hors périmètre)
- [x] `npm run test:resource-links`
- [ ] PR en **Draft**, suivi avec `ce-babysit-pr` ; passage en Ready uniquement sur accord explicite.
