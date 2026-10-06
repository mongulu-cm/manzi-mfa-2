# Consignes de contribution

Manzi-mfa (Collectif Mongulu) facilite l'accès à l'emploi IT grâce à un échange avec un senior. Socle : monorepo npm, Nuxt 4, Vue 3, TypeScript strict et Nuxt UI sur Cloudflare Workers. La vitrine (`apps/vitrine`) utilise le SSR ; l’espace connecté (`apps/plateforme`) est une SPA. Le thème et les composants communs vivent dans `layers/mongulu`.

## Repères et commandes

- Lire `README.md` et `DESIGN.md` avant toute modification ; consulter `.github/workflows/ci.yml` pour les contrôles CI.
- Node et installation : `nvm use` (voir `.nvmrc`), puis `npm ci`. Conserver `package-lock.json`.
- Développement : préparer l'environnement Supabase ci-dessous, puis `npm run dev:vitrine` et `npm run dev:app` dans deux terminaux ; exporter les URL locales de `.env.example` dans chaque terminal. `npm run dev` reste un alias de la vitrine. Production : `npm run build`, puis `npm run preview:vitrine` / `npm run preview:app` ; déploiement : `npm run deploy:vitrine` / `npm run deploy:app` (configurations dans `apps/*/wrangler.jsonc`).
- Après modification : `npm run check` (lint, types et builds des deux applications). Ajouter des tests lorsque la logique métier le justifie.
- Pour les changements UI/stories : `npx playwright install chromium`, `npm run build:storybook`, puis `npm run test:stories` (interactions et a11y). Le serveur statique est lancé automatiquement par les tests.

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

La clé recherchée a le type `publishable` et le nom `default`, pas le nom `publishable`. Ne pas afficher ni committer sa valeur ; ne jamais lui substituer une clé `secret` ou `service_role`. Pour la plateforme, exporter aussi `NUXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"` et `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$SUPABASE_KEY"`, ou les définir dans `apps/plateforme/.env` ignoré par Git. La plateforme consomme ces variables publiques pour LinkedIn OIDC ; la vitrine ne consomme pas de session Supabase.

### Schémas et migrations Supabase — obligatoire

- `supabase/schemas/` est la source de vérité du schéma : tout ajout ou changement de structure (tables, colonnes, index, fonctions, triggers, vues, politiques RLS, etc.) doit d'abord être déclaré dans ces fichiers SQL. Ne pas créer ces éléments directement via Studio, SQL ou une migration écrite à la main.
- Ensuite, générer la migration avec `npx supabase db schema declarative sync -f nom_modification --no-apply`, relire le SQL généré dans `supabase/migrations/`, puis le tester localement avant déploiement. Versionner ensemble les fichiers déclaratifs et la migration correspondante.
- Ce workflow nécessite `pg-delta` activé dans `supabase/config.toml` (`[experimental.pgdelta]`, `enabled = true`), ou le flag `--experimental`. Pour une base existante sans migrations, établir d'abord la migration initiale avec `npx supabase db pull`, puis exporter les fichiers déclaratifs avec `npx supabase db schema declarative generate --linked`.
- `declarative generate` sert à exporter un schéma existant ; il ne génère pas de migration. Après modification de `supabase/schemas/`, utiliser `declarative sync`.

## Pull requests et restitution du travail

- Créer toute pull request en **Draft** (`gh pr create --draft`).
- Le passage de **Draft** à **Ready for review** appartient à l’utilisateur. À la fin du travail, lui demander explicitement s’il souhaite ce passage et attendre sa réponse avant de l’effectuer. Une CI verte ou un travail terminé ne vaut pas autorisation ; conserver la PR en Draft tant que l’utilisateur ne l’a pas demandé.
- Une fois le travail terminé et vérifié, utiliser la skill **`baoyu-infographic`**, après lecture de son `SKILL.md`, pour générer une infographie expliquant le problème, les changements réalisés et leur résultat. La présenter avec le bilan du travail avant la demande de passage en Ready.
- Pour cette infographie, utiliser uniquement le style **tldraw** : fond blanc, schéma dessiné à la main, traits simples, blocs et flèches lisibles, annotations manuscrites et couleurs sobres. Il n’est pas nécessaire de suivre `DESIGN.md` pour les infographies de restitution ; ce fichier reste la référence pour l’interface des sites. Inclure uniquement des faits vérifiés, sans secrets ni données personnelles.

## Code et sécurité

- Avant d'écrire ou de modifier du code serveur utilisant Supabase (endpoints Nitro, authentification, accès aux données, Edge Functions, etc.), lire et appliquer obligatoirement la skill `supabase-server` dans `.agents/skills/supabase-server/SKILL.md`.
- Suivre les conventions Nuxt dans les dossiers `app/` de chaque application et de la Layer : pages, layouts, composables, auto-imports et composants Vue avec `<script setup lang="ts">`.
- Ne pas ajouter de bibliothèque ni de module sans besoin concret.
- Préserver le SSR de la vitrine et la compatibilité SSR des composants communs : `useFetch` / `useAsyncData` pour les données, `$fetch` pour les actions, `useState` pour l'état partagé. Aucun état partagé mutable au niveau module ; réserver les APIs navigateur à `onMounted` ou à une garde client.
- Garder les secrets côté serveur dans `runtimeConfig` (jamais `runtimeConfig.public`) et hors du dépôt. Ne pas committer `.env` ; documenter les variables dans `.env.example`.

## UI et composants

- `DESIGN.md` est la source de vérité visuelle (couleurs, typographies, espacements, rayons, bordures, états et responsive), y compris face aux styles par défaut des bibliothèques. Utiliser `layers/mongulu/public/logo.png`, source unique servie à `/logo.png` sur les deux sites, sans le modifier ni le recréer ; toute nouvelle convention visuelle nécessite un besoin explicite.
- Utiliser les primitives **Nuxt UI**, y compris pour les formulaires, avant toute primitive custom ; ne pas ajouter une autre bibliothèque UI pour un besoin déjà couvert, ni mélanger les bibliothèques sans justification explicite.
- Avant de créer un composant, vérifier Nuxt UI, les composants métier existants et les patterns de l'application. Si un pattern apparaît au moins trois fois, envisager son extraction.
- Distinguer primitives Nuxt UI, wrappers nécessaires dans `app/components/ui/` et petits composants métier composables regroupés par domaine dans `app/components/` (mentor, booking, jobs, chat, onboarding selon les besoins).
- Créer un wrapper seulement pour une variante Mongulu réutilisable, une convention commune ou une simplification significative de l'API ; aucun wrapper purement pass-through.
- Préférer : thème global Nuxt UI (`layers/mongulu/app/app.config.ts`), tokens (`layers/mongulu/app/assets/css/`), classes Tailwind, puis CSS scoped. Éviter valeurs arbitraires répétées, couleurs déjà tokenisées codées en dur, `!important`, styles inline et hacks propres à une page.
- Utiliser une seule famille d'icônes via Nuxt UI / Iconify ; ignorer les icônes décoratives pour les technologies d'assistance et nommer les actions composées uniquement d'une icône.

## Accessibilité et formulaires

- Vérifier clavier, focus visible, ordre de tabulation, sémantique, labels, textes alternatifs, contrastes et états disabled compréhensibles. Ne jamais communiquer un état par la seule couleur ; cibles tactiles d'au moins `44 × 44 px`.
- Vérifier mobile et desktop, les breakpoints de `DESIGN.md`, les contenus longs et multilignes ; rester fonctionnel dès `320px`, sans largeur fixe inutile ni masquage d'information essentielle.
- Formulaires : labels associés aux champs, requis/facultatif explicites, erreurs près du champ et associées à celui-ci, valeurs conservées après erreur, états loading/disabled à la soumission, prévention des doubles soumissions et feedback de succès/erreur.

## Storybook et tests

- Documenter dans `layers/*/stories/**/*.stories.ts` et `apps/*/stories/**/*.stories.ts` les composants métier significatifs, compositions complexes et wrappers avec API/variantes propres. Ne pas ajouter de stories dédiées aux primitives Nuxt UI utilisées telles quelles ni retester leur implémentation interne.
- Couvrir les états pertinents : défaut, loading, empty, error, disabled, selected/active, données longues ou manquantes, variantes métier et mobile.
- Ajouter des interaction tests pour les comportements utilisateur non triviaux ; les composants purement présentationnels n'en nécessitent pas.
- Conserver `@storybook/addon-a11y` et le contrôle axe de `tests/a11y/`. Les violations sérieuses doivent faire échouer la CI ; justifier toute exception dans le code ou la PR, sans désactivation globale pour faire passer les tests. Compléter l'automatisation par des vérifications clavier et visuelles des parcours critiques.
- Répartir les tests : composants métier → stories, interactions et a11y ; composables/logique métier → tests unitaires ; parcours complets → Playwright E2E. Éviter de reproduire exactement le même scénario à plusieurs niveaux sans risque métier le justifiant.
- Un composant métier est terminé lorsqu'il respecte le design, réutilise les primitives appropriées sans duplication ni styles évitables, possède les stories et interactions nécessaires, passe l'a11y automatisée et fonctionne au clavier, sur mobile et desktop.
