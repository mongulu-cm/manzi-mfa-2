# F-016 — PWA responsive

Sources : issue #12, PR #53, README.md, apps/plateforme/nuxt.config.ts et tests/e2e/sites.test.mjs.

## Problème

- Parcours mobile à fiabiliser.
- Aucune PWA installable avant cette PR.

## Changements

- Vitrine : site public SSR.
- Plateforme : une seule PWA installable.
- Cache public : page hors ligne, logo, manifeste.
- Compte et profil : connexion Internet nécessaire.
- Sans réseau : message et lien « Réessayer ».
- OAuth et API : hors cache du service worker.

## Résultat vérifié

- Six formats d’écran vérifiés.
- Navigation au clavier et au toucher.
- Chargement hors ligne et reprise testés.

Ces résultats reposent sur les tests automatisés et l’inspection locale ; l’installation sur un appareil Android physique reste à tester par l’utilisateur.
