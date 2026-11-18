# Diagnostic des erreurs (F-020)

Les deux applications utilisent le projet Sentry `mongulu/manzi-mfa-2`. La Layer initialise le SDK Nuxt dans le navigateur et son plugin Nitro Cloudflare sur le serveur. Les scopes sont isolés par requête et l'envoi serveur utilise `waitUntil`. Le serveur de développement Node n'est pas la cible de ce plugin : utiliser Wrangler local pour vérifier le backend.

Les tags `app` (`vitrine`, `plateforme`) et `runtime` (`browser`, `cloudflare`) distinguent les frontières. `environment` distingue `development`, `preview`, `production` et `sentry-verification`. La release est le SHA Git du build, commun au navigateur et au serveur ; `SENTRY_RELEASE` permet une valeur explicite, nécessaire pour identifier un build sans métadonnées Git. Un environnement omis apparaît comme `unconfigured`, afin de signaler une configuration incomplète.

## Configuration

Pour chaque Worker, définir `NUXT_PUBLIC_SENTRY_DSN` et `NUXT_PUBLIC_SENTRY_ENVIRONMENT` dans les bindings runtime et les variables Workers Builds. Les previews ont leur propre configuration : utiliser `preview`, jamais `production`. Un DSN vide désactive l'envoi en local et dans la CI habituelle.

`SENTRY_AUTH_TOKEN` est un secret **de build uniquement** : Workers Builds pour les déploiements, environnement du processus de build pour la vérification locale autorisée, avec le scope Sentry `org:ci`. Il ne doit jamais être un binding runtime, une variable `NUXT_PUBLIC_*` ou une valeur committée. Le postbuild partagé publie les sourcemaps des deux runtimes vers Sentry, puis retire les maps du répertoire public. Les builds de validation sans token ne prouvent pas la symbolication ; ils avertissent que l'upload est absent.

Le SDK est fixé à `11.14.0`. Son uploader intégré réécrit les bundles temporaires déjà instrumentés, ce qui décale les positions par rapport aux fichiers exécutés (`js_invalid_sourcemap_location` observé pendant la vérification). Le postbuild partagé `scripts/prepare-analytics-build.mjs` conserve l’injection des debug IDs du SDK et utilise le CLI officiel Rust `@sentry/cli` avec `--no-rewrite --wait --strict`. Il publie les fichiers finaux après l’injection PostHog, qui ajuste les sourcemaps lors de l’ajout de ses métadonnées. Les deux outils reçoivent ainsi les mêmes positions de code. La suppression des maps publiques intervient seulement après les deux uploads. Le nouveau CLI JavaScript `sentry` n’est pas utilisé : son option `noRewrite` omet les références de debug IDs. Un échec d’upload fait échouer le build. Revalider les quatre combinaisons app/runtime avant de retirer ce contournement lors d'une mise à jour. Wrangler utilise `no_bundle` et charge les modules ESM générés par Nitro pour préserver ces mêmes debug IDs côté serveur.

## Données et bruit

Les options de collecte désactivent les identifiants utilisateurs, cookies, en-têtes, corps HTTP, paramètres d'URL, variables de pile et contenus DB/GraphQL/IA. Pas de Session Replay, de logs Sentry ni de breadcrumbs. Le filtre retire les données supplémentaires et le contexte Nuxt non technique. Ne jamais incorporer un secret ou une donnée personnelle dans un message d'exception ou un nom de span.

Les erreurs HTTP attendues 4xx et les annulations `AbortError` sont ignorées ; les 5xx et exceptions inattendues restent capturées. Le SDK Nitro filtre également les redirections et ses 4xx. Le groupement par pile du SDK est conservé. Les erreurs ne sont pas échantillonnées. La collecte des traces de performance est désactivée (`tracesSampleRate: 0`) ; les identifiants de trace restent disponibles sur les erreurs pour la corrélation. La propagation des traces est limitée aux domaines des deux applications et aux requêtes relatives du navigateur.

Le projet Sentry active le scrubber, le filtrage des champs sensibles et la suppression des adresses IP. Sa région est États-Unis. La politique publique décrit ce diagnostic.

## Vérification contrôlée (locale, sans données réelles)

1. Depuis la racine, `node tests/smoke/sentry-fixtures.mjs create`. Ces fichiers temporaires ne doivent jamais être publiés.
2. Exporter le DSN, `NUXT_PUBLIC_SENTRY_ENVIRONMENT=sentry-verification`, une `SENTRY_RELEASE` explicite et fournir le token de build autorisé uniquement au processus `npm run build`. Retirer ensuite la variable et toute copie locale du secret ; ne pas le transmettre au processus Wrangler runtime. Si un token distinct a été créé pour ce test, le révoquer après vérification.
3. Dans chaque application, lancer `npx wrangler dev --local` avec les bindings publics DSN et environnement (ports distincts, par exemple 8787 et 8788). Ne pas utiliser `--remote` ni `deploy` avec ces fixtures.
4. Visiter `/__sentry-verify` et cliquer le bouton. Appeler `/api/__sentry-verify` : attendre 500 et vérifier une erreur backend. Le mode `?mode=ok` doit retourner 200 ; `?mode=expected` doit retourner 401 sans événement Sentry.
5. Dans Sentry, vérifier les quatre combinaisons app/runtime, la release, l'environnement, le fichier source et la ligne de chaque exception. Inspecter les événements pour vérifier l'absence de données de requête et d'utilisateur.
6. `node tests/smoke/sentry-fixtures.mjs remove`, puis `npm run check` et `npm run test:unit`. Vérifier l'absence des routes de test dans le build final et l'absence des `.map` dans les assets publics.

Une issue n'est clôturable qu'après vérification de la capture et de la symbolication, configuration du build de déploiement et publication de l'intégration. Les captures de test peuvent être résolues comme vérifications contrôlées.

## Preuve du 18 novembre 2026

Builds de production exécutés avec Wrangler **local**, environnement `sentry-verification`, release `manzi-f020-verification` :

| Application | Runtime | Événement Sentry | Source retrouvée |
| --- | --- | --- | --- |
| Vitrine | Navigateur | `b5e4addd4d6b4cb5b25432229a8af505` | `app/pages/__sentry-verify.vue:3` |
| Plateforme | Navigateur | `902093b201d24a68bcf1c7998d5d51b3` | `app/pages/__sentry-verify.vue:3` |
| Vitrine | Cloudflare | `f476ae5d97984ab4ba145938e0e87dff` | `server/api/__sentry-verify.get.ts:5` |
| Plateforme | Cloudflare | `3341be0d338f4023b06cca5b17171dc8` | `server/api/__sentry-verify.get.ts:5` |

Issues de preuve : [navigateur](https://mongulu.sentry.io/issues/7855043310/) et [Cloudflare](https://mongulu.sentry.io/issues/7855056184/). Les réponses contrôlées sont 200, 401 et 500 sur chaque application ; seuls les 500 et les exceptions navigateur créent des événements. L'inspection du JSON serveur confirme l'absence du paramètre `token` synthétique, des en-têtes, cookies et corps HTTP. Sentry peut ajouter le pays déduit de la connexion réseau, sans conserver l'adresse IP. Les assets publics ne contiennent aucun fichier `.map` et les bundles ne contiennent pas le token de build. Les routes de vérification sont supprimées après le test.
