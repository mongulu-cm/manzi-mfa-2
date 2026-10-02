# Manzi-mfa

Un projet du Collectif Mongulu : le pont vers l'emploi dans l'IT grâce à un échange d'une heure avec un senior.

## Démarrage

Node.js 24 LTS et npm. Une version Node 22 >= 22.19 est également supportée.

```sh
nvm use
npm ci
npm run dev
```

L'application est disponible sur http://localhost:3000.

## Commandes

| Commande | Usage |
| --- | --- |
| `npm run dev` | Développement avec rechargement automatique |
| `npm run lint` | Vérification ESLint (Nuxt, Vue et TypeScript) |
| `npm run lint:fix` | Correction des règles automatisables |
| `npm run typecheck` | Vérification des types Nuxt et Vue |
| `npm run build` | Build SSR de production |
| `npm run preview` | Prévisualisation du build |
| `npm run generate` | Génération statique si le produit le nécessite |
| `npm run deploy` | Build Nuxt + `wrangler deploy` vers Cloudflare |
| `npm run check` | Lint, types et build (également exécutés en CI) |

## Structure

- `app/app.vue` : racine, layout, routeur et annonce des navigations pour l'accessibilité.
- `app/pages/` : routes générées par Nuxt.
- `app/layouts/` : structures de pages.
- `app/assets/css/` : styles et tokens dérivés de `DESIGN.md`.
- `public/` : fichiers servis tels quels, dont le logo fourni.
- `server/` : endpoints et logique serveur Nitro, à créer lorsque nécessaires.
- `shared/` : types et fonctions compatibles navigateur/serveur, à créer lorsque nécessaires.

## Conventions

- Nuxt 4, Vue 3, TypeScript strict ; composants avec `<script setup lang="ts">`.
- Utiliser les conventions Nuxt : pages, auto-imports et composables ; pas de routeur manuel.
- Charger les données SSR avec `useFetch` ou `useAsyncData` ; utiliser `$fetch` pour les actions.
- Utiliser `useState` pour l'état partagé compatible SSR ; ajouter Pinia seulement si nécessaire.
- Éviter l'accès à `window` ou `document` côté serveur ; utiliser `onMounted` pour les APIs navigateur.
- Les secrets passent par `runtimeConfig` côté serveur. `runtimeConfig.public` est exposé au navigateur.
- Ne jamais committer `.env`. Documenter les futures variables dans `.env.example`.
- Respecter `DESIGN.md` et le logo fourni. Les polices sont servies localement via Fontsource.
- Commiter `package-lock.json` et utiliser `npm ci` pour des installations reproductibles.
- Ajouter les tests métier avec les premières fonctionnalités ; ce socle est vérifié par lint, types, build et smoke HTTP.

## Production (Cloudflare Workers)

SSR déployé comme Worker via le preset Nitro `cloudflare_module`.
Config versionnée dans `wrangler.jsonc` (`manzi-mfa-2`).

```sh
npm run build
npx wrangler deploy
# ou
npm run deploy
```

Prod : `https://manzi-mfa-2.mongulu.cm`.
Previews : URL stable par branche, pattern `https://<nom-branche>.manzi-mfa-2.mongulu.cm`
(convention branche `manzi-mfa-pr-<N>` donne `https://manzi-mfa-pr-<N>.manzi-mfa-2.mongulu.cm`).

Le socle conserve le SSR par défaut. Via Workers Builds (repo connecté) :
push sur `main` déploie la prod, chaque PR crée/met à jour sa Preview
avec commentaire URL. Domaine et previews définis dans `wrangler.jsonc`
(route `previews_enabled`), le dashboard reflète cet état. Le backend et l'authentification
seront définis avec les besoins produit.
