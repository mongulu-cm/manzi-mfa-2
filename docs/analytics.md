# PostHog — F-019

Projet EU : https://eu.posthog.com/project/357089. Même projet et token public sur les deux sites. Le token `phc_…` permet uniquement l’ingestion ; aucune clé personnelle PostHog n’est nécessaire au runtime.

## Contrat

`useAnalytics().track('profile.viewed')` est l’unique entrée produit. Convention : `domaine.action`, au passé pour une étape accomplie. Le catalogue TypeScript `layers/mongulu/shared/utils/analytics.ts` refuse les événements inconnus à l’exécution. Cette version n’accepte aucune propriété libre. Pour ajouter une propriété, définir son type, sa liste de valeurs permises et son filtre à l’exécution, avec un test de confidentialité, avant de l’ajouter au contrat.

Tous les événements comprennent `schema_version: 1`, `surface` (`vitrine` / `plateforme`), `environment` et `runtime` (`browser` / `server`). Les propriétés de navigation sont limitées aux routes publiques connues, sans query ni fragment ; une future route doit être ajoutée explicitement ou sera regroupée sous `/other`. Les métadonnées techniques autorisées (navigateur, OS, dimensions) sont filtrées dans `before_send`, y compris pour `$identify`. Pas de référent complet, UTM, texte DOM, photo, CV ou jeton. Les seuls champs de profil permis sont `email`, `name`, `first_name`, `last_name`, sur `$identify` / `$set` pour une personne identifiée.

| Événement | Déclencheur |
| --- | --- |
| `$pageview` | Premier affichage après consentement et changement de route Nuxt ; un seul événement par route consécutive |
| `auth.login_started` | Début d’une tentative LinkedIn |
| `auth.login_succeeded` / `auth.login_failed` | Résultat du callback OAuth |
| `auth.logout_succeeded` | Déconnexion locale réussie, sous la nouvelle identité anonyme |
| `profile.viewed` / `profile.load_failed` | Chargement du profil réussi / échoué |
| `$exception` | Erreur Vue, Nuxt, navigateur, promesse non gérée ou hook d’erreur Nitro |
| `matching.started` / `matching.completed` | Réservés aux futurs écrans de matching |
| `booking.started` / `booking.completed` / `booking.failed` | Réservés aux futurs parcours de réservation |
| `job_board.viewed` / `job_board.application_started` | Réservés au futur Job Board |

Les événements réservés ne sont pas émis artificiellement. Les tickets consommateurs les placeront sur des transitions réellement abouties ; les intentions utilisateur restent distinctes des succès serveur. Les étapes précédant un consentement ne sont jamais rejouées.

## Identité et consentement

Le SDK est chargé à la demande après consentement et utilise uniquement sa mémoire. Le cookie applicatif `manzi_analytics_identity_v1` contient l’UUID anonyme ou l’e-mail du compte et un booléen d’identification. Aucun jeton Auth n’y figure et il ne doit jamais servir à autoriser une requête. Le cookie `manzi_analytics_consent_v2` conserve le choix. Tous deux utilisent `SameSite=Lax`, `Path=/`, `Secure` sous HTTPS et une durée de 180 jours. Le domaine de production est limité à `manzi-mfa-2.mongulu.cm`, partagé avec `app.manzi-mfa-2.mongulu.cm`, sans étendre les cookies à tous les services `mongulu.cm`.

Le nom complet utilise le profil applicatif ou les métadonnées LinkedIn. Le prénom et le nom séparés proviennent de `given_name` / `family_name` (ou `first_name` / `last_name`) ; un nom complet n’est pas découpé arbitrairement. Un changement d’e-mail crée une nouvelle identité de mesure pour éviter une fusion accidentelle.

À la connexion, `identify(email, { email, name, first_name, last_name })` relie la navigation anonyme au compte. Au changement de compte ou à la déconnexion, `reset(true)` évite de relier deux personnes. Chaque capture relit le cookie partagé pour adopter les changements d’un autre onglet. Une visite de la vitrine déjà identifiée conserve le même e-mail. Les sessions PostHog restent propres à chaque chargement : la continuité garantie concerne la personne, pas un identifiant de session unique entre les sites.

Le retrait du consentement supprime le cookie d’identité ; chaque capture vérifie le choix courant et les onglets rafraîchissent l’interface au retour au premier plan. Le refus ne bloque aucune fonction. Si le cookie de consentement ne peut pas être relu, aucune collecte ne démarre. Les appareils/navigateurs distincts ne sont reliés qu’après une connexion avec le même compte. Le mode privé, les bloqueurs, les cookies effacés et les domaines sans parent commun limitent la continuité. Aucun identifiant n’est placé dans les liens entre les sites.

## Erreurs

Les messages, causes, variables, en-têtes et corps de requête sont exclus. PostHog reçoit un type d’erreur standard et les frames de code (fichier, ligne, colonne) dans l’ordre des appels. Les bundles navigateur `/_nuxt/*.js` et les chunks Nitro `/chunks/*.mjs` sont reconnus. Côté serveur, les bundles Cloudflare/Wrangler `index.js`, `index.mjs`, `worker.js` et `_worker.js` sont normalisés sous `/server/`, sans chemin local ni répertoire temporaire. Les noms de fonctions serveur sont conservés lorsqu’ils sont des identifiants de code ; les noms dynamiques sont remplacés par `<anonymous>`.

Nuxt génère les sourcemaps client et serveur. Le postbuild conserve les modules Nitro et leurs maps TypeScript, puis le CLI PostHog injecte les `chunk_id` et publie les symboles. Sentry conserve ses debug IDs et reçoit ces mêmes fichiers après l’injection PostHog, pour garder les positions cohérentes dans les deux outils. Chaque frame utilise `web:javascript` ou `node:javascript` et le `chunk_id` correspondant avant normalisation du chemin. Les messages métier restent exclus. Les erreurs attendues (statuts 4xx et AbortError) sont filtrées dans PostHog comme dans Sentry. Les journaux Cloudflare restent disponibles, notamment sans consentement ou avant l’initialisation du navigateur. Une erreur Vue/Nuxt relayée par plusieurs hooks peut apparaître plusieurs fois.

Nitro envoie un rapport seulement pour une requête portant les cookies de consentement et d’identité valides. Il utilise l’API publique d’ingestion et `event.waitUntil`, avec un timeout de trois secondes et sans retry ; aucun état utilisateur n’est partagé entre requêtes. Les échecs PostHog sont absorbés et ne remplacent pas l’erreur d’origine. Le cookie client est un indicateur de corrélation, jamais une preuve d’identité serveur.

Le consentement est versionné en `v2` : une acceptation antérieure sans information sur l’e-mail et le nom ne déclenche pas cette nouvelle collecte.

## Configuration et déploiement

`NUXT_PUBLIC_POSTHOG_KEY` vide désactive l’instrumentation. `NUXT_PUBLIC_POSTHOG_HOST` vaut `https://eu.i.posthog.com`. `NUXT_PUBLIC_ANALYTICS_ENVIRONMENT` sépare `production`, `development`, `test` et `validation`. `NUXT_PUBLIC_ANALYTICS_COOKIE_DOMAIN` vaut `manzi-mfa-2.mongulu.cm` en production, vide en local ou sur des hôtes indépendants. `analyticsSurface` est fixée par chaque app.

Les variables publiques de production sont déclarées dans les deux `wrangler.jsonc` et injectées dans la configuration Nuxt au runtime. Les previews désactivent la collecte avec un token vide. Pour les instrumenter, utiliser un environnement distinct et ne pas partager le domaine de cookie de production. Avant de publier une preview, vérifier/remplacer ses variables dans Workers Builds. Pour couper la collecte, vider le token sur les deux Workers et redéployer ; ne pas supprimer les comptes Supabase. Le développement utilise les variables exportées ou un `.env` ignoré dans chaque application ; sans environnement explicite, les événements portent `unconfigured`, jamais `production`.

Le projet PostHog doit conserver les produits Product Analytics, Web Analytics et Error Tracking. Filtrer Web Analytics sur le hostname de la vitrine ; filtrer les analyses produit sur `surface = plateforme`. Pour le funnel bêta : `$pageview` (vitrine) → `auth.login_started` → `auth.login_succeeded` → `profile.viewed`, en filtrant `environment = production`. Le parcours inter-sites se lit par personne, pas par session. Les erreurs se filtrent par `surface`, `environment` et `runtime`.

L’offre gratuite sélectionnée le 18 novembre 2026 annonce un an de rétention, distinctement des 180 jours des cookies. Actualiser la politique en cas de changement d’offre ; une suppression de compte Supabase ne supprime pas automatiquement la personne PostHog : traiter aussi l’e-mail et ses identifiants anonymes associés dans PostHog lors d’une demande d’effacement.

## Vérification

- `npm run check`, `npm run test:coverage` : SSR/SPA, contrat, confidentialité, compte, concurrence et SDK indisponible.
- `npm run build:storybook && npm run test:stories` : choix initial, refus, retrait, mobile et axe.
- `npm run test:e2e` : aucune requête avant accord, continuité vitrine/app, fusion anonyme→compte, retour vitrine, erreur filtrée et retrait inter-onglets. PostHog et OAuth sont simulés ; aucune donnée réelle en CI.
- Smoke réel : exporter le token public et `NUXT_PUBLIC_ANALYTICS_ENVIRONMENT=validation`, ouvrir les deux sites locaux dans le même navigateur, accepter puis naviguer. Vérifier les `$pageview` sous le même identifiant dans Activity et une erreur contrôlée dans Error Tracking. Les données synthétiques doivent rester filtrées hors des tableaux de production.

Le smoke automatisé s’exécute explicitement avec `POSTHOG_SMOKE_KEY=<token-public> node --test --test-name-pattern=PostHog tests/e2e/sites.test.mjs`. Il utilise des comptes OAuth simulés et envoie les événements du SDK au projet EU avec `environment=validation`. Cette variable est ignorée en CI. Le 18 novembre 2026, le scénario a envoyé avec succès 10 événements synthétiques ; l’API d’ingestion a répondu avec succès à chaque envoi. Le smoke initial utilisait un UUID ; le nouveau smoke a confirmé l’e-mail `membre@example.invalid` et les propriétés `name=Membre Test`, `first_name=Membre`, `last_name=Test` dans l’interface PostHog. L’exclusion des robots est désactivée seulement en `test` et `validation`, pour permettre ces vérifications automatiques.

Sources : [configuration du SDK](https://posthog.com/docs/libraries/js/config), [identification Nuxt](https://posthog.com/docs/libraries/nuxt-js), [API de collecte](https://posthog.com/docs/api/capture).

### Sourcemaps au build

Le `postbuild` de chaque application exécute `scripts/prepare-analytics-build.mjs`. Il prépare les fichiers client dans `.output/posthog/client` et instrumente les modules Nitro dans `.output/server`. Après injection PostHog, il téléverse ces mêmes fichiers vers les deux outils avec leurs secrets de build respectifs, copie les JS client injectés vers les assets et supprime les `.map` publics. Wrangler utilise `no_bundle: true` et les modules ESM additionnels : ne pas les rebundler après injection. Le déploiement conserve la redirection Nuxt vers cette configuration générée.

Configurer `POSTHOG_CLI_API_KEY` comme **secret de build**, jamais comme variable runtime ou `NUXT_PUBLIC_*`. Projet : `POSTHOG_CLI_PROJECT_ID=357089`, hôte : `POSTHOG_CLI_HOST=https://eu.posthog.com`. Activer `POSTHOG_SOURCEMAPS_REQUIRED=true` dans les builds de production pour bloquer un déploiement sans clé. Une erreur d’upload bloque toujours le build lorsqu’une clé est fournie. Les builds de CI et locaux sans clé restent hors réseau PostHog ; ils produisent les maps privées et retirent les maps publiques, mais n’injectent pas les symboles. La clé « Manzi source maps » est configurée sur les deux Workers avec le scope `error_tracking:write`, limitée au projet 357089. `POSTHOG_SOURCEMAPS_REQUIRED=true` est activé ; les chemins surveillés incluent `scripts/**`. Renouveler la clé avant le 16 février 2027.

La release reprend le nom du Worker et la version explicite (`SENTRY_RELEASE`, puis `WORKERS_CI_COMMIT_SHA`, sinon le SHA Git). Pour vérifier une erreur réelle sans toucher la production :

1. Créer les fixtures temporaires avec `node tests/smoke/sentry-fixtures.mjs create`, puis construire avec les deux secrets de sourcemaps fournis au seul processus `npm run build`. Retirer ensuite ces variables de l’environnement local et supprimer leur copie temporaire avant de lancer Wrangler, conformément à [la procédure Sentry](sentry.md) ; ne jamais les transmettre au runtime.
2. Exécuter le build localement avec Wrangler, configurer le token public PostHog, `environment=validation`, le consentement accepté et une identité synthétique.
3. Appeler `/api/__sentry-verify` : la route temporaire lance une exception non interceptée et répond 500. Vérifier sa réception dans PostHog et le fichier `apps/<application>/server/api/__sentry-verify.get.ts`, ligne 5, avec son contexte TypeScript. Ne pas simuler seulement un événement `$exception` à la main.
4. Appeler `/api/__sentry-verify?mode=expected` : la réponse 401 ne doit produire aucun événement d’erreur. Les réponses 4xx, notamment un challenge invalide à `/api/auth/linkedin`, sont volontairement exclues.
5. Supprimer les fixtures avec `node tests/smoke/sentry-fixtures.mjs remove` et reconstruire avant tout déploiement. Ne jamais committer ni déployer ces routes de diagnostic.

Le 18 novembre 2026, après intégration de Sentry et PostHog, une requête invalide au Worker local a envoyé directement une erreur au projet EU (`environment=validation`, identité synthétique `b0000000-0000-4000-8000-000000000019`). Cette vérification précède le filtrage commun des erreurs 4xx. L’interface PostHog affiche `apps/plateforme/server/api/auth/linkedin.post.ts:7:11` et son contexte TypeScript. Les 36 fichiers instrumentés de la vitrine et les 30 de la plateforme conservent les identifiants Sentry dans le code et les maps après injection PostHog ; aucun fichier `.map` n’est exposé dans les assets publics.

Sources sourcemaps : [CLI PostHog](https://posthog.com/docs/error-tracking/upload-source-maps/cli), [Cloudflare](https://developers.cloudflare.com/workers/observability/source-maps/).
