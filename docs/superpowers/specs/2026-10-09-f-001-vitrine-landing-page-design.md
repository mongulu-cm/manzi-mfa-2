# Spécification de conception — F-001 : Présenter Manzi-mfa sur un site public responsive

- **Feature ID** : `F-001`
- **Issue** : [mongulu-cm/manzi-mfa-2#8](https://github.com/mongulu-cm/manzi-mfa-2/issues/8)
- **Epic** : E-001 — Acquisition et accès
- **Date** : 2026-10-09
- **Auteur** : Collectif Mongulu

---

## 1. Contexte et Objectifs

Manzi-mfa a pour mission d'être le pont vers l'emploi dans l'IT grâce à un échange d'une heure avec un senior.

L'objectif de cette fonctionnalité est de remplacer la page d'accueil d'attente de la vitrine (`apps/vitrine/app/pages/index.vue`) par une landing page publique complète, responsive et accessible, qui :
1. Présente clairement la proposition de valeur pour les mentorés et les mentors sans nécessiter d'authentification.
2. Fournit des appels à l'action (CTA) clairs dirigeant vers l'espace applicatif connecté (`apps/plateforme`).
3. Reste parfaitement fluide, lisible et utilisable de 320px à desktop sans aucun débordement horizontal.
4. Gère explicitement et gracieusement les cas d'indisponibilité ou de mauvaise configuration du lien vers l'application.

---

## 2. Découpage fonctionnel de la Landing Page

La page d'accueil est découpée en 4 sections hiérarchisées :

### 2.1. Section Héro (`HeroSection.vue`)
- **Titre H1** : « Manzi-mfa » avec sous-titre display « Le pont vers l'emploi dans l'IT grâce à un échange d'une heure avec un senior ».
- **Paragraphe d'accroche** : Explique l'impact d'un échange individuel direct avec un professionnel en poste pour débloquer sa recherche d'emploi ou son orientation.
- **Bouton d'appel à l'action principal** :
  - Libellé : « Rejoindre la plateforme » ou « Démarrer un échange ».
  - Lien : Pointe vers l'URL de l'application (`${appUrl}/login`).
  - Accessibilité : Cible tactile ≥ 44×44px, état focus visible.
- **Gestion d'indisponibilité** : Si `appUrl` est non défini ou invalide, affiche un message d'information avec lien direct vers `mailto:collectif@mongulu.cm`.

### 2.2. Section « Comment ça marche » (`HowItWorksSection.vue`)
- **Titre H2** : « Comment ça marche »
- **Sous-titre** : « Trois étapes simples pour propulser votre parcours »
- **3 étapes sous forme de cartes** :
  1. **Étape 1 : Choisissez votre mentor** — Filtrez les profils selon votre domaine (Frontend, Backend, DevOps, Data) et vos besoins spécifiques.
  2. **Étape 2 : Réservez un créneau** — Sélectionnez une disponibilité de 15 à 30 minutes sans friction ni intermédiaire.
  3. **Étape 3 : Échangez et progressez** — Préparez vos entretiens, ajustez votre CV et recevez des retours constructifs et personnalisés.

### 2.3. Section « Deux rôles, une même communauté » (`AudienceSection.vue`)
- **Titre H2** : « Conçu pour grandir ensemble »
- **2 cartes cibles distinctes (grille 2 colonnes sur desktop, 1 colonne sur mobile)** :
  - **Pour les candidats & mentorés** :
    - Titre H3 : « Vous cherchez un emploi ou une reconversion ? »
    - Avantages : Accès direct à des professionnels en poste, retours sans filtre sur votre positionnement, conseils pour réussir les entretiens techniques.
    - CTA secondaire : « Trouver un mentor ».
  - **Pour les professionnels & mentors** :
    - Titre H3 : « Vous êtes senior dans l'IT ? »
    - Avantages : Partagez votre expérience utilement, donnez 1h de votre temps par mois, contribuez à l'insertion professionnelle et à la diversité dans la tech.
    - CTA secondaire : « Devenir mentor ».

### 2.4. Section Appel à l'action final (`CtaSection.vue`)
- **Titre H2** : « Prêt à franchir le cap ? »
- **Description** : Rappel de l'engagement associatif, gratuit et bénévole du Collectif Mongulu.
- **Bouton CTA** : Vers `${appUrl}/login`.

---

## 3. Architecture Technique & Composants

### 3.1. Emplacement des fichiers
Conformément à `AGENTS.md`, les composants propres à la vitrine restent dans son périmètre :
```
apps/vitrine/
├── app/
│   ├── components/
│   │   ├── landing/
│   │   │   ├── HeroSection.vue
│   │   │   ├── HowItWorksSection.vue
│   │   │   ├── AudienceSection.vue
│   │   │   └── CtaSection.vue
│   │   └── SiteHeaderActions.vue (existant)
│   ├── pages/
│   │   └── index.vue (agrégation sémantique des 4 sections)
│   └── assets/css/
│       └── vitrine.css (styles spécifiques et utilitaires)
└── stories/
    └── landing/
        ├── HeroSection.stories.ts
        ├── HowItWorksSection.stories.ts
        ├── AudienceSection.stories.ts
        └── CtaSection.stories.ts
```

### 3.2. Règles de design et tokens (`DESIGN.md`)
- **Typographie** :
  - Titres (H1, H2, H3) : **Alegreya** serif (700) via les classes ou styles du design system.
  - Texte courant et boutons : **Hanken Grotesk** sans-serif (400 et 600).
- **Palette** :
  - Couleur primaire : Forest Green (`#576F1F`), contrastes validés WCAG AA (≥ 4.5:1 sur fond blanc et crème).
  - Fond de cartes : Blanc (`#FFFFFF`) ou Beige chaud (`#F5F1E8`), bordures `#D9D9D9` (avec transition hover `#C8DBA8`).
  - Séparateurs de section : `#E0DDD4`.
- **Responsive** :
  - Largeur maximale du conteneur : `max-w-(--ui-container)` (`1200px`).
  - Breakpoints : mobile-first, aucun débordement horizontal dès 320px (`scrollWidth <= innerWidth`).
  - Cibles tactiles interactives : ≥ 44 × 44 px.

---

## 4. Tests et Critères d'Acceptation

### 4.1. Critères d'acceptation de l'issue
- [x] **Proposition de valeur compréhensible sans authentification** : Les sections Héro, Comment ça marche et Profils expliquent clairement la plateforme dès l'arrivée.
- [x] **Appel à l'action dirigeant vers l'application** : Le CTA principal et les liens mènent à `${appUrl}/login` dans le même onglet.
- [x] **Lisibilité et utilisation mobile et desktop** : Testé de 320px à 1280px sans scroll horizontal, typographie responsive.
- [x] **Gestion explicite des erreurs de lien** : Message et fallback par email si l'URL applicative n'est pas disponible.

### 4.2. Stratégie de tests
1. **Stories Storybook (`apps/vitrine/stories/`)** :
   - Stories pour chaque section avec tests d'interaction.
   - Validation de la gate d'accessibilité `axe-core` via `npm run test:stories`.
2. **Tests E2E Playwright (`tests/e2e/sites.test.mjs`)** :
   - Vérification du rendu SSR des textes et balises sémantiques.
   - Vérification de l'absence de régression sur la navigation et le retour depuis la plateforme.
   - Contrôle du responsive 320px et 1280px (0 débordement).
   - Contrôle d'absence de violations critiques ou sérieuses `axe-core`.
3. **Contrôles CI** :
   - `npm run check` (Lint ESLint, Typescript, Builds).
   - `npm run test:coverage` (Maintien des seuils de couverture V8).
   - `npx fallow --ci --format compact` (Zéro code mort).
