# Gate de couverture Vitest

## Problème

Les PR vers `main` exécutaient les tests unitaires, sans seuil de couverture qui empêche une régression.

## Changements réalisés

- Ajout de `@vitest/coverage-v8`.
- Ajout de `npm run test:coverage`.
- Ajout d'une job GitHub Actions qui s'exécute seulement pour les PR ciblant `main`.
- Seuils : 95 % statements, 85 % branches, 100 % fonctions et 100 % lignes.

## Résultat vérifié localement

- 78 tests réussis.
- Statements : 95,42 % (146/153).
- Branches : 85,26 % (81/95).
- Fonctions : 100 % (23/23).
- Lignes : 100 % (128/128).
- `npm run check` réussit.
