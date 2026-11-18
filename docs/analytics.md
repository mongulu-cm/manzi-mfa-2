# PostHog — F-019

Projet EU : https://eu.posthog.com/project/357089. Même projet et token public sur les deux sites. Le token `phc_…` permet uniquement l’ingestion ; aucune clé personnelle PostHog n’est nécessaire au runtime.

## Contrat

`useAnalytics().track('profile.viewed')` est l’unique entrée produit. Convention : `domaine.action`, au passé pour une étape accomplie. Le catalogue TypeScript `layers/mongulu/shared/utils/analytics.ts` refuse les événements inconnus à l’exécution. Cette version n’accepte aucune propriété libre. Pour ajouter une propriété, définir son type, sa liste de valeurs permises et son filtre à l’exécution, avec un test de confidentialité, avant de l’ajouter au contrat.

Tous les événements comprennent `schema_version: 1`, `surface` (`vitrine` / `plateforme`), `environment` et `runtime` (`browser` / `server`). Les propriétés de navigation sont limitées aux routes publiques connues, sans query ni fragment ; une future route doit être ajoutée explicitement ou sera regroupée sous `/other`. Les métadonnées techniques autorisées (navigateur, OS, dimensions) sont filtrées dans `before_send`, y compris pour `$identify`. Pas de référent complet, UTM, texte DOM, nom, e-mail, photo, CV, jeton ni propriété de profil.

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

Le SDK est chargé à la demande après consentement et utilise uniquement sa mémoire. Le cookie applicatif `manzi_analytics_identity_v1` contient l’UUID anonyme ou Supabase et un booléen d’identification. Aucun jeton Auth n’y figure et il ne doit jamais servir à autoriser une requête. Le cookie `manzi_analytics_consent_v1` conserve le choix. Tous deux utilisent `SameSite=Lax`, `Path=/`, `Secure` sous HTTPS et une durée de 180 jours. Le domaine de production est limité à `manzi-mfa-2.mongulu.cm`, partagé avec `app.manzi-mfa-2.mongulu.cm`, sans étendre les cookies à tous les services `mongulu.cm`.

À la connexion, `identify(UUID Supabase)` relie la navigation anonyme au compte. Au changement de compte ou à la déconnexion, `reset(true)` évite de relier deux personnes. Chaque capture relit le cookie partagé pour adopter les changements d’un autre onglet. Une visite de la vitrine déjà identifiée conserve le même UUID. Les sessions PostHog restent propres à chaque chargement : la continuité garantie concerne la personne, pas un identifiant de session unique entre les sites.

Le retrait du consentement supprime le cookie d’identité ; chaque capture vérifie le choix courant et les onglets rafraîchissent l’interface au retour au premier plan. Le refus ne bloque aucune fonction. Si le cookie de consentement ne peut pas être relu, aucune collecte ne démarre. Les appareils/navigateurs distincts ne sont reliés qu’après une connexion avec le même compte. Le mode privé, les bloqueurs, les cookies effacés et les domaines sans parent commun limitent la continuité. Aucun identifiant n’est placé dans les liens entre les sites.

## Erreurs

Les messages, causes, variables, en-têtes et corps de requête sont exclus. PostHog reçoit un type d’erreur standard et, lorsqu’ils existent, les emplacements `/_nuxt/*.js` et `/chunks/*.mjs` (fichier, ligne, colonne) pour le regroupement. Cette minimisation limite le diagnostic : pas de message métier ni de sourcemaps téléversées dans cette version. Les journaux Cloudflare restent disponibles, notamment sans consentement ou avant l’initialisation du navigateur. Une erreur Vue/Nuxt relayée par plusieurs hooks peut apparaître plusieurs fois.

Nitro envoie un rapport seulement pour une requête portant les cookies de consentement et d’identité valides. Il utilise l’API publique d’ingestion et `event.waitUntil`, avec un timeout de trois secondes et sans retry ; aucun état utilisateur n’est partagé entre requêtes. Les échecs PostHog sont absorbés et ne remplacent pas l’erreur d’origine. Le cookie client est un indicateur de corrélation, jamais une preuve d’identité serveur.

## Configuration et déploiement

`NUXT_PUBLIC_POSTHOG_KEY` vide désactive l’instrumentation. `NUXT_PUBLIC_POSTHOG_HOST` vaut `https://eu.i.posthog.com`. `NUXT_PUBLIC_ANALYTICS_ENVIRONMENT` sépare `production`, `development`, `test` et `validation`. `NUXT_PUBLIC_ANALYTICS_COOKIE_DOMAIN` vaut `manzi-mfa-2.mongulu.cm` en production, vide en local ou sur des hôtes indépendants. `analyticsSurface` est fixée par chaque app.

Les variables publiques de production sont déclarées dans les deux `wrangler.jsonc` et injectées dans la configuration Nuxt au runtime. Les previews désactivent la collecte avec un token vide. Pour les instrumenter, utiliser un environnement distinct et ne pas partager le domaine de cookie de production. Avant de publier une preview, vérifier/remplacer ses variables dans Workers Builds. Pour couper la collecte, vider le token sur les deux Workers et redéployer ; ne pas supprimer les comptes Supabase. Le développement utilise les variables exportées ou un `.env` ignoré dans chaque application.

Le projet PostHog doit conserver les produits Product Analytics, Web Analytics et Error Tracking. Filtrer Web Analytics sur le hostname de la vitrine ; filtrer les analyses produit sur `surface = plateforme`. Pour le funnel bêta : `$pageview` (vitrine) → `auth.login_started` → `auth.login_succeeded` → `profile.viewed`, en filtrant `environment = production`. Le parcours inter-sites se lit par personne, pas par session. Les erreurs se filtrent par `surface`, `environment` et `runtime`.

L’offre gratuite sélectionnée le 18 novembre 2026 annonce un an de rétention, distinctement des 180 jours des cookies. Actualiser la politique en cas de changement d’offre ; une suppression de compte Supabase ne supprime pas automatiquement la personne PostHog : traiter aussi l’UUID dans PostHog lors d’une demande d’effacement.

## Vérification

- `npm run check`, `npm run test:coverage` : SSR/SPA, contrat, confidentialité, compte, concurrence et SDK indisponible.
- `npm run build:storybook && npm run test:stories` : choix initial, refus, retrait, mobile et axe.
- `npm run test:e2e` : aucune requête avant accord, continuité vitrine/app, fusion anonyme→compte, retour vitrine, erreur filtrée et retrait inter-onglets. PostHog et OAuth sont simulés ; aucune donnée réelle en CI.
- Smoke réel : exporter le token public et `NUXT_PUBLIC_ANALYTICS_ENVIRONMENT=validation`, ouvrir les deux sites locaux dans le même navigateur, accepter puis naviguer. Vérifier les `$pageview` sous le même identifiant dans Activity et une erreur contrôlée dans Error Tracking. Les données synthétiques doivent rester filtrées hors des tableaux de production.

Le smoke automatisé s’exécute explicitement avec `POSTHOG_SMOKE_KEY=<token-public> node --test --test-name-pattern=PostHog tests/e2e/sites.test.mjs`. Il utilise des comptes OAuth simulés et envoie les événements du SDK au projet EU avec `environment=validation`. Cette variable est ignorée en CI. Le 18 novembre 2026, le scénario a envoyé avec succès 10 événements synthétiques ; l’API d’ingestion a répondu avec succès à chaque envoi. Personne de test : `a0000000-0000-0000-0000-000000000001`. L’exclusion des robots est désactivée seulement en `test` et `validation`, pour permettre ces vérifications automatiques.

Sources : [configuration du SDK](https://posthog.com/docs/libraries/js/config), [identification Nuxt](https://posthog.com/docs/libraries/nuxt-js), [API de collecte](https://posthog.com/docs/api/capture).
