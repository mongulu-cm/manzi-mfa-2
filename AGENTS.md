# Consignes de contribution

- Lire README.md et DESIGN.md avant toute modification.
- Utiliser Nuxt 4 et les conventions du dossier app/ ; TypeScript strict et Vue avec script setup.
- Respecter DESIGN.md et public/logo.png pour tout travail visuel.
- Ne pas ajouter de bibliothèque ni de module sans besoin concret.
- Préserver la compatibilité SSR. Aucun état partagé mutable au niveau module.
- Garder les secrets côté serveur et hors du dépôt.
- Après modification : npm run check. Ajouter des tests lorsque la logique métier le justifie.
