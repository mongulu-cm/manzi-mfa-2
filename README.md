# Manzi-mfa

Un projet du Collectif Mongulu : le pont vers l'emploi dans l'IT grâce à un échange d'une heure avec un senior.

Le dépôt contient deux applications Nuxt 4 et une Layer Mongulu commune :

| Application | Production | Rendu | Worker |
| --- | --- | --- | --- |
| `apps/vitrine` | https://manzi-mfa-2.mongulu.cm | SSR, contenu indexable | `manzi-mfa-2` |
| `apps/plateforme` | https://app.manzi-mfa-2.mongulu.cm | SPA, sans indexation | `manzi-mfa-2-app` |

La page `/login` présente le futur espace connecté. L'authentification n'est pas encore intégrée : aucun formulaire ne collecte d'identifiants.

## Confidentialité

[PRIVACY.md](PRIVACY.md) contient la politique de confidentialité commune aux deux sites, son résumé et ses notes de maintenance. Le texte public est accessible sur la vitrine à [/confidentialite](https://manzi-mfa-2.mongulu.cm/confidentialite), depuis son pied de page. Le responsable est le Collectif Mongulu et le contact est collectif@mongulu.cm. Réviser ce texte avant toute nouvelle collecte (comptes, CV, échanges, statistiques ou paiements).

## Démarrage

Node.js 24 LTS et npm. Une version Node 22 >= 22.19 est également supportée.

```sh
nvm use
npm ci
```

Pour tester la navigation entre les deux sites, exporter les URL locales dans chaque terminal :

```sh
export NUXT_PUBLIC_APP_URL=http://localhost:3001
export NUXT_PUBLIC_SITE_URL=http://localhost:3000
npm run dev:vitrine
```

Dans un second terminal, avec les mêmes variables :

```sh
npm run dev:app
```

Vitrine : http://localhost:3000. Plateforme : http://localhost:3001, avec redirection vers `/login`.
`npm run dev` démarre la vitrine. Les variables de `.env.example` sont documentaires : exporter les valeurs ou créer un `.env` dans chaque application. Les valeurs par défaut visent la production.

Avant un démarrage local, suivre aussi les instructions Supabase de `AGENTS.md`. Le socle ne consomme pas encore ces variables Supabase ; aucune modification du schéma n'est nécessaire pour les deux sites.

## Commandes

| Commande | Usage |
| --- | --- |
| `npm run dev:vitrine` / `npm run dev:app` | Développement sur les ports 3000 / 3001 |
| `npm run lint` / `npm run lint:fix` | ESLint pour l'ensemble du dépôt |
| `npm run typecheck` | Types des deux applications et de la Layer qu'elles utilisent |
| `npm run build` | Builds SSR vitrine et SPA plateforme, avec Nitro pour les deux |
| `npm run build:vitrine` / `npm run build:app` | Build d'une seule application |
| `npm run preview:vitrine` / `npm run preview:app` | Prévisualisation locale du build correspondant |
| `npm run generate` | Génération statique de la vitrine si un futur besoin le justifie |
| `npm run deploy:vitrine` / `npm run deploy:app` | Build et déploiement du Worker correspondant |
| `npm run deploy` | Déploiement de la vitrine, comme avant la migration |
| `npm run check` | Lint, types et builds des deux applications |
| `npm run storybook` / `npm run build:storybook` | Catalogue commun en développement / build statique |
| `npm run test:stories` | Interactions et contrôle axe des stories |
| `npm run test:e2e` | SSR, navigation entre sites, SPA, clavier et responsive |

Les workspaces npm (`apps/*`, `layers/*`) utilisent un seul `package-lock.json`. `npm ci` prépare les deux applications. Les sorties `.nuxt/`, `.output/` et `.wrangler/` restent propres à chacune.

## Structure et partage

- `apps/vitrine/app/` : pages et layout du site public, bouton « Se connecter », CSS propre à la vitrine.
- `apps/plateforme/app/` : pages et layout de l'espace connecté ; les futurs composants auth et middleware restent ici.
- `apps/plateforme/server/` : futurs endpoints Nitro de l'espace connecté, à créer avec les besoins métier. Avant toute intégration Supabase serveur, appliquer la skill `supabase-server` du dépôt.
- `layers/mongulu/` : thème Nuxt UI, polices locales Fontsource, tokens de `DESIGN.md`, identité et structure commune accessibles avec `extends: ['../../layers/mongulu']`.
- `layers/mongulu/public/logo.png` : source unique du logo fourni, publié à `/logo.png` sur les deux sites par `nitro.publicAssets`, sans modification de l'image.
- `layers/mongulu/stories/` et `apps/*/stories/` : stories communes et spécifiques, réunies dans un seul Storybook utilisant la vitrine comme contexte Nuxt.
- `tests/a11y/` : gate axe pour toutes les stories et vérification des tokens ; `tests/e2e/` : parcours complets avec Playwright.
- `supabase/` : configuration et schémas du backend, indépendants de cette migration.

Les pages, l'authentification et les règles serveur propres à un site restent dans son application. Extraire dans la Layer les composants effectivement partagés, utiliser directement les primitives Nuxt UI et créer seulement les wrappers qui apportent une convention utile. Nuxt UI génère les directives Tailwind `@source` des Layers.

`shared/`, lorsqu'il sera nécessaire, sert aux types et fonctions sans dépendance Vue ou Nitro utilisés côté navigateur et serveur. Il ne contient pas de composants Vue.

Les deux applications utilisent `UApp`, les annonces de navigation et un lien d'évitement clavier. Garder les secrets dans `runtimeConfig` serveur et les valeurs publiques sous `NUXT_PUBLIC_*`.

## Cloudflare Workers Builds

Chaque application possède son `wrangler.jsonc` et utilise le preset Nitro `cloudflare_module`. La plateforme a `ssr: false` mais conserve Nitro : de futures API serveur pourront y être ajoutées sans transformer le projet en site statique.

Les Workers `manzi-mfa-2` et `manzi-mfa-2-app` sont reliés au dépôt GitHub `mongulu-cm/manzi-mfa-2`. Les paramètres ci-dessous sont enregistrés dans Cloudflare pour la production et les branches d'aperçu, avec le jeton de build existant. La migration du monorepo doit être poussée sur GitHub avant de lancer un build avec ces nouveaux chemins.

Les réglages Workers Builds sont distincts du déploiement Wrangler : une session OAuth CLI peut autoriser le déploiement tout en refusant l’API Builds. Pour les configurer par API, utiliser un token utilisateur avec la permission **Workers Builds Configuration: Edit**, ainsi que **Workers Scripts: Read** pour retrouver le tag du Worker ([documentation Cloudflare](https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/)).

| Paramètre Workers Builds | Vitrine | Plateforme |
| --- | --- | --- |
| Répertoire racine | `apps/vitrine` | `apps/plateforme` |
| Build command | `cd ../.. && npm ci && npm run build:vitrine` | `cd ../.. && npm ci && npm run build:app` |
| Deploy command | `npx wrangler deploy` | `npx wrangler deploy` |
| Preview command | `npx wrangler preview` | `npx wrangler preview` |
| Branche production | `main` | `main` |
| Domaine | `manzi-mfa-2.mongulu.cm` | `app.manzi-mfa-2.mongulu.cm` |

La commande de build installe les dépendances depuis la racine du monorepo ; le déploiement s'exécute dans le répertoire de l'application, auprès de sa configuration Wrangler. Configurer aussi `NODE_VERSION=24` dans les variables de build, car les répertoires des applications ne contiennent pas de `.nvmrc`. Si l'installation automatique est activée, la désactiver via `SKIP_DEPENDENCY_INSTALL=true` pour utiliser uniquement le `npm ci` explicite ci-dessus.

Chemins surveillés, relatifs à la racine Git :

- Vitrine : `apps/vitrine/**`, `layers/**`, `package.json`, `package-lock.json`, `.nvmrc`.
- Plateforme : `apps/plateforme/**`, `layers/**`, `package.json`, `package-lock.json`, `.nvmrc`.

Un changement dans la Layer ou les dépendances déclenche donc les deux builds. Les deux Workers disposent de l'observabilité et de previews activées sur leur domaine personnalisé.

La vitrine conserve ses previews `https://<nom-preview>.manzi-mfa-2.mongulu.cm`. Les previews plateforme utilisent `https://<nom-preview>.app.manzi-mfa-2.mongulu.cm`. Pour relier une paire, configurer `NUXT_PUBLIC_APP_URL` sur la vitrine et `NUXT_PUBLIC_SITE_URL` sur la plateforme avec les URL de preview correspondantes. Sans ces variables, les liens visent volontairement la production ; le nom d'une branche n'est pas déduit automatiquement.

Valider les deux previews avant de publier le nouveau lien en production. Déployer d'abord la plateforme puis la vitrine. Revenir à une version antérieure de chaque Worker séparément si nécessaire.

## Vérification

```sh
npm run check
npx playwright install chromium
npm run build:storybook
npm run test:stories
npm run test:e2e
npx fallow --ci --format compact
```

Les E2E démarrent leurs propres serveurs sur `127.0.0.1:3100` et `:3101` avec les URL correspondantes. Ils vérifient le HTML SSR et les métadonnées de la vitrine, l'accès direct à `/login`, l'absence de rendu serveur de la plateforme, le logo, le thème commun, la navigation dans le même onglet, le clavier et les largeurs 320px et desktop.
