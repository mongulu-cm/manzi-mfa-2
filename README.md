# Manzi-mfa

Un projet du Collectif Mongulu : le pont vers l'emploi dans l'IT grâce à un échange d'une heure avec un senior.

Le dépôt contient deux applications Nuxt 4 et une Layer Mongulu commune :

| Application | Production | Rendu | Worker |
| --- | --- | --- | --- |
| `apps/vitrine` | https://manzi-mfa-2.mongulu.cm | SSR, contenu indexable | `manzi-mfa-2` |
| `apps/plateforme` | https://app.manzi-mfa-2.mongulu.cm | SPA, sans indexation | `manzi-mfa-2-app` |

La plateforme propose une connexion LinkedIn OIDC sur `/login`. La première connexion crée le compte Supabase et son profil ; `/` affiche le nom, la photo et l’e-mail du compte connecté. L’e-mail reste dans Supabase Auth et les profils ne sont lisibles que par leur propriétaire.

## Confidentialité

[PRIVACY.md](PRIVACY.md) contient la politique de confidentialité commune aux deux sites, son résumé et ses notes de maintenance. Le texte public est accessible sur la vitrine à [/confidentialite](https://manzi-mfa-2.mongulu.cm/confidentialite), depuis son pied de page. Le responsable est le Collectif Mongulu et le contact est collectif@mongulu.cm. Le texte décrit les comptes LinkedIn et les profils Supabase. Réviser ce texte avant toute nouvelle collecte (CV, échanges, statistiques ou paiements).

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

Vitrine : http://localhost:3000. Plateforme : http://localhost:3001 ; les visiteurs anonymes sont redirigés vers `/login`.
`npm run dev` démarre la vitrine. Les variables de `.env.example` sont documentaires : exporter les valeurs ou créer un `.env` dans chaque application. Les valeurs par défaut visent la production.

Avant un démarrage local, suivre aussi les instructions Supabase de `AGENTS.md`. La plateforme consomme `NUXT_PUBLIC_SUPABASE_URL` et `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (clé de type publishable, nom default). Les exporter aussi dans le terminal plateforme ou les placer dans `apps/plateforme/.env`, ignoré par Git. Les variables `SUPABASE_URL` / `SUPABASE_KEY` utilisées par le workflow CLI ne les remplacent pas.

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

## Connexion LinkedIn et profils

La plateforme utilise `@supabase/supabase-js`, uniquement dans un plugin client, avec PKCE, renouvellement automatique et session locale persistante. Le callback `/auth/callback` échange le code une seule fois et nettoie l’URL. Les métadonnées ne servent jamais aux autorisations. Aucun secret LinkedIn ou clé Supabase secret/service_role n’est nécessaire dans le frontend.

Dans Supabase Auth, définir la Site URL sur `https://app.manzi-mfa-2.mongulu.cm` et autoriser précisément :

- `https://app.manzi-mfa-2.mongulu.cm/auth/callback`
- `http://localhost:3001/auth/callback`
- `https://codex-linkedin-auth.app.manzi-mfa-2.mongulu.cm/auth/callback` (preview de la PR LinkedIn).
- `https://codex-linkedin-auth-manzi-mfa-2-app.ntomzebiglas-dns.workers.dev/auth/callback` (alias Workers de la même preview).

Ces quatre URL sont autorisées dans le projet Supabase. Pour une nouvelle branche, ajouter ses URL exactes `/auth/callback` avant de tester OAuth ; aucun wildcard n’est autorisé. La plateforme calcule la destination depuis son origine, ce qui conserve le retour sur la preview utilisée.

Dans LinkedIn, conserver la redirection vers `https://gdcirvvqangyraxauggy.supabase.co/auth/v1/callback` et les permissions OIDC `openid profile email`. Les secrets du fournisseur restent dans Supabase. Configurer les deux variables publiques plateforme dans le build et le runtime Cloudflare ; une configuration absente désactive le bouton de connexion.

`supabase/schemas/` est la source de vérité. Lors de cette initialisation, `db pull` a confirmé que le projet distant était déjà en phase avec la baseline vide : aucun objet applicatif préexistant n’était à migrer. Les déclarations des extensions et privilèges ont été exportées du projet. Pour les évolutions, établir la référence depuis le projet lié avant de générer une modification avec `npx supabase db schema declarative sync -f nom --no-apply`. Les migrations de données sont distinctes des déclarations de structure. Le trigger privé crée un profil à l’inscription ; les comptes existants sont repris sans écrasement. Le nom et l’URL HTTPS de la photo sont capturés à la création, sans synchronisation à chaque login ni édition dans cette version. Supprimer le compte Auth supprime le profil associé.

### Tests auth

- `npm run test:unit` : session, erreurs, concurrence et callback.
- `npm run test:e2e` : OAuth Supabase simulé dans Playwright, restauration, annulation, profil indisponible, déconnexion, mobile et axe. Aucun appel LinkedIn réel en CI.
- `npx supabase start`, puis `npm run test:db` : trigger, données manquantes, suppression en cascade et accès RLS ; Docker et le client `psql` sont nécessaires. Le runner envoie les assertions pgTAP par stdin à la base locale ; il vérifie le nombre d’assertions et refuse les URL distantes. La CI utilise une base locale jetable.
- `npm run test:linkedin` : smoke opt-in avec Chromium visible, hors CI. Il consomme les variables locales, attend une intervention humaine pour l’autorisation ou un challenge et vérifie le même compte/profil après rechargement et reconnexion, sans enregistrer de données personnelles.
- Test réel manuel : lancer la plateforme avec les variables publiques du projet, cliquer « Continuer avec LinkedIn », vérifier le profil, recharger, se déconnecter puis se reconnecter. Vérifier qu’un seul compte et profil existent. Les variables locales `E2E_LINKEDIN_USERNAME` / `E2E_LINKEDIN_PASSWORD` peuvent servir au smoke test autorisé ; ne jamais les committer, enregistrer de trace contenant les identifiants ou les ajouter à la CI. Une validation MFA ou un challenge LinkedIn nécessite une intervention humaine.

Déployer les migrations et la confidentialité sur la vitrine avant la plateforme. En cas de problème, revenir à la version précédente du Worker sans supprimer les comptes ni les profils ; corriger la base par une migration suivante.
