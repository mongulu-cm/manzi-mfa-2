# Consignes de contribution

Manzi-mfa (Collectif Mongulu) facilite l'accès à l'emploi IT grâce à un échange avec un senior. Socle : Nuxt 4, Vue 3, TypeScript strict, Nuxt UI et SSR sur Cloudflare Workers.

## Repères et commandes

- Lire `README.md` et `DESIGN.md` avant toute modification ; consulter `.github/workflows/ci.yml` pour les contrôles CI.
- Node et installation : `nvm use` (voir `.nvmrc`), puis `npm ci`. Conserver `package-lock.json`.
- Développement : préparer l'environnement Supabase ci-dessous, puis `npm run dev`. Production : `npm run build`, puis `npm run preview` ; déploiement : `npm run deploy` (configuration dans `wrangler.jsonc`).
- Après modification : `npm run check` (lint, types et build). Ajouter des tests lorsque la logique métier le justifie.
- Pour les changements UI/stories : `npx playwright install chromium`, `npx storybook build -o storybook-static`, puis `npm run test:stories` (interactions et a11y). Le serveur statique est lancé automatiquement par les tests.

### Supabase avant le démarrage local

Depuis la racine du dépôt, être authentifié via `npx supabase login` (si la session CLI n'est pas déjà active), puis lier le projet avec `npx supabase link --project-ref gdcirvvqangyraxauggy`.

Dans le même terminal, avec `jq` installé :

```sh
export PROJECT_REF=gdcirvvqangyraxauggy
export SUPABASE_URL=https://gdcirvvqangyraxauggy.supabase.co
SUPABASE_KEY="$(
  npx supabase projects api-keys --project-ref "$PROJECT_REF" --output json \
    | jq -er '.[] | select(.type == "publishable" and .name == "default") | .api_key'
)" && test -n "$SUPABASE_KEY" && export SUPABASE_KEY && npm run dev
```

La clé recherchée a le type `publishable` et le nom `default`, pas le nom `publishable`. Ne pas afficher ni committer sa valeur ; ne jamais lui substituer une clé `secret` ou `service_role`. Le socle actuel démarre avec ces variables exportées mais ne les consomme pas encore : ce lancement ne valide pas à lui seul une intégration Supabase dans l'application.

## Code et sécurité

- Suivre les conventions Nuxt dans `app/` : pages, layouts, composables, auto-imports et composants Vue avec `<script setup lang="ts">`.
- Ne pas ajouter de bibliothèque ni de module sans besoin concret.
- Préserver le SSR : `useFetch` / `useAsyncData` pour les données, `$fetch` pour les actions, `useState` pour l'état partagé. Aucun état partagé mutable au niveau module ; réserver les APIs navigateur à `onMounted` ou à une garde client.
- Garder les secrets côté serveur dans `runtimeConfig` (jamais `runtimeConfig.public`) et hors du dépôt. Ne pas committer `.env` ; documenter les variables dans `.env.example`.

## UI et composants

- `DESIGN.md` est la source de vérité visuelle (couleurs, typographies, espacements, rayons, bordures, états et responsive), y compris face aux styles par défaut des bibliothèques. Utiliser `public/logo.png` sans le modifier ni le recréer ; toute nouvelle convention visuelle nécessite un besoin explicite.
- Utiliser les primitives **Nuxt UI**, y compris pour les formulaires, avant toute primitive custom ; ne pas ajouter une autre bibliothèque UI pour un besoin déjà couvert, ni mélanger les bibliothèques sans justification explicite.
- Avant de créer un composant, vérifier Nuxt UI, les composants métier existants et les patterns de l'application. Si un pattern apparaît au moins trois fois, envisager son extraction.
- Distinguer primitives Nuxt UI, wrappers nécessaires dans `app/components/ui/` et petits composants métier composables regroupés par domaine dans `app/components/` (mentor, booking, jobs, chat, onboarding selon les besoins).
- Créer un wrapper seulement pour une variante Mongulu réutilisable, une convention commune ou une simplification significative de l'API ; aucun wrapper purement pass-through.
- Préférer : thème global Nuxt UI (`app/app.config.ts`), tokens (`app/assets/css/`), classes Tailwind, puis CSS scoped. Éviter valeurs arbitraires répétées, couleurs déjà tokenisées codées en dur, `!important`, styles inline et hacks propres à une page.
- Utiliser une seule famille d'icônes via Nuxt UI / Iconify ; ignorer les icônes décoratives pour les technologies d'assistance et nommer les actions composées uniquement d'une icône.

## Accessibilité et formulaires

- Vérifier clavier, focus visible, ordre de tabulation, sémantique, labels, textes alternatifs, contrastes et états disabled compréhensibles. Ne jamais communiquer un état par la seule couleur ; cibles tactiles d'au moins `44 × 44 px`.
- Vérifier mobile et desktop, les breakpoints de `DESIGN.md`, les contenus longs et multilignes ; rester fonctionnel dès `320px`, sans largeur fixe inutile ni masquage d'information essentielle.
- Formulaires : labels associés aux champs, requis/facultatif explicites, erreurs près du champ et associées à celui-ci, valeurs conservées après erreur, états loading/disabled à la soumission, prévention des doubles soumissions et feedback de succès/erreur.

## Storybook et tests

- Documenter dans `stories/**/*.stories.ts` les composants métier significatifs, compositions complexes et wrappers avec API/variantes propres. Ne pas ajouter de stories dédiées aux primitives Nuxt UI utilisées telles quelles ni retester leur implémentation interne.
- Couvrir les états pertinents : défaut, loading, empty, error, disabled, selected/active, données longues ou manquantes, variantes métier et mobile.
- Ajouter des interaction tests pour les comportements utilisateur non triviaux ; les composants purement présentationnels n'en nécessitent pas.
- Conserver `@storybook/addon-a11y` et le contrôle axe de `tests/a11y/`. Les violations sérieuses doivent faire échouer la CI ; justifier toute exception dans le code ou la PR, sans désactivation globale pour faire passer les tests. Compléter l'automatisation par des vérifications clavier et visuelles des parcours critiques.
- Répartir les tests : composants métier → stories, interactions et a11y ; composables/logique métier → tests unitaires ; parcours complets → Playwright E2E. Éviter de reproduire exactement le même scénario à plusieurs niveaux sans risque métier le justifiant.
- Un composant métier est terminé lorsqu'il respecte le design, réutilise les primitives appropriées sans duplication ni styles évitables, possède les stories et interactions nécessaires, passe l'a11y automatisée et fonctionne au clavier, sur mobile et desktop.
