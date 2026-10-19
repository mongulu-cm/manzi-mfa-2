# Spécification de conception — F-001 : Présenter Manzi-mfa sur un site public responsive (Mise à jour Maquettes Stitch)

- **Feature ID** : `F-001`
- **Issue** : [mongulu-cm/manzi-mfa-2#8](https://github.com/mongulu-cm/manzi-mfa-2/issues/8)
- **Epic** : E-001 — Acquisition et accès
- **Date** : 2026-10-19
- **Auteur** : Collectif Mongulu
- **Référence Maquettes Stitch** : [Stitch Preview 2871921929048649073](https://stitch.withgoogle.com/preview/2871921929048649073?node-id=687261ff395c4fc4988502934c290733)

---

## 1. Contexte et Objectifs

Manzi-mfa a pour mission d'être le pont vers l'emploi dans l'IT grâce à un échange d'une heure avec un senior.

L'objectif de cette fonctionnalité est d'aligner la landing page publique de la vitrine (`apps/vitrine/app/pages/index.vue`) sur la maquette officielle Stitch issue #8 :
1. **Hero Section 2 colonnes** : Titre d'accroche direct, 2 boutons d'action (mentoré / mentor), grande photo avec badge flottant « Mentors Certifiés ».
2. **Comment ça marche ?** : 3 étapes claires (« Créez votre profil », « Choisissez votre mentor », « Book Quick Chat »).
3. **Mentors à la une** : Grille de profils mentors réels/mockés avec tags technologiques, postes et bouton d'accès au profil.
4. **Communauté & Verbatim** : Bandeau vert présentant la gratuité du service Collectif Mongulu (+2500 membres actifs) et témoignage illustré (Sekou, Junior Web Dev).
5. **Accessibilité & Responsive** : Respect strict du contraste WCAG AA, absence totale de scroll horizontal dès 320px, et SSR complet.

---

## 2. Découpage fonctionnel des Sections

### 2.1. Section Héro (`HeroSection.vue`)
- **Disposition** : Grille 2 colonnes sur desktop (`lg:grid-cols-2`), 1 colonne sur mobile.
- **Colonne texte** :
  - **Titre H1** : « Trouvez le mentor tech qui vous aidera à avancer » (police Alegreya 700).
  - **Paragraphe** : « Accélérez votre carrière grâce à des échanges de 15-30 minutes avec des professionnels chevronnés de la tech africaine et de sa diaspora. »
  - **Deux boutons CTA** :
    - Primaire : « Trouver un mentor » (vert `#576F1F`, texte blanc, arrondi pill `rounded-full`).
    - Secondaire : « Devenir mentor » (contour border `#576F1F`, texte `#576F1F`, hover fond vert clair).
  - **Gestion de repli** : Si l'app n'est pas configurée, repli gracieux vers contact mailto.
- **Colonne visuelle** :
  - Grande photo avec coins arrondis (`rounded-3xl` ou `rounded-2xl`).
  - Badge flottant en bas à gauche de l'image :
    - Fond blanc, ombre douce, bordure légère.
    - Icône de validation / bouclier sur pastille verte.
    - Texte « Mentors Certifiés » (gras, 14px) et « +500 experts dispos » (texte secondaire, 12px).

### 2.2. Section « Comment ça marche ? » (`HowItWorksSection.vue`)
- **Titre H2** : « Comment ça marche ? » (Alegreya)
- **Sous-titre** : « Trois étapes simples pour booster votre parcours. »
- **3 cartes numérotées** :
  1. Pastille verte « 1 » — Titre : « Créez votre profil » — Description claire de l'onboarding.
  2. Pastille verte « 2 » — Titre : « Choisissez votre mentor » — Recherche ciblée selon les expertises.
  3. Pastille verte « 3 » — Titre : « Book Quick Chat » — Réservation directe d'un créneau de 15-30 min.

### 2.3. Section « Mentors à la une » (`FeaturedMentorsSection.vue`)
- **En-tête de section** :
  - **Titre H2** : « Mentors à la une »
  - **Sous-titre** : « Apprenez des meilleurs de l'écosystème. »
  - **Lien à droite** : « Voir tous les mentors → » (lien vers `/login`).
- **Grille de 4 cartes mentors** :
  - **Aïcha** : Data Engineer @ TechCorp — Badge « PRO » vert clair — Tags : `Python`, `BigQuery` — Bouton « Voir profil ».
  - **Patrick** : Senior DevOps @ CloudScale — Tags : `Kubernetes`, `AWS` — Bouton « Voir profil ».
  - **Emmanuel** : Frontend Lead @ FinLink — Tags : `React`, `UI Design` — Bouton « Voir profil ».
  - **Sarah** : Engineering Manager @ GlobalTech — Tags : `Leadership`, `Scale` — Bouton « Voir profil ».
- Chaque carte a une image d'avatar soignée, bordure `#D9D9D9`, hover border `#C8DBA8`.

### 2.4. Section « Une communauté engagée et gratuite » & Verbatim (`CommunityVerbatimSection.vue`)
- **Fond de section** : Fond vert doux / amande (`#D4E4BA` ou dégradé sage conforme au design system).
- **Colonne gauche (Mission & Communauté)** :
  - **Titre H2** : « Une communauté engagée et gratuite » (Alegreya).
  - **Texte descriptif** : « Manzi-mfa est un service porté par le collectif Mongulu. Notre mission est de démocratiser l'accès au savoir technologique. Les sessions "Quick Chat" sont gratuites pour tous les membres de la communauté. »
  - **Indicateur d'impact** : Icône membres + texte « +2500 membres actifs ».
- **Colonne droite (Carte Verbatim)** :
  - Carte fond clair / verre givré aux coins arrondis.
  - Stack de 3 avatars d'utilisateurs avec pastille verte « +2k ».
  - Citation en exergue : « "Manzi-mfa a changé ma vision de la tech. Merci aux mentors !" » (police Alegreya ou Hanken 600).
  - Signature : « — Sekou, Junior Web Dev ».

---

## 3. Architecture Technique

### 3.1. Nouveaux composants et organisation
```
apps/vitrine/
├── app/
│   ├── components/
│   │   └── landing/
│   │       ├── HeroSection.vue (mis à jour layout 2 colonnes + image + badge)
│   │       ├── HowItWorksSection.vue (mis à jour textes conformes Stitch)
│   │       ├── FeaturedMentorsSection.vue (nouveau composant mentors à la une)
│   │       └── CommunityVerbatimSection.vue (nouveau composant mission + verbatim)
│   ├── pages/
│   │   └── index.vue (agrégation sémantique des 4 sections)
│   └── public/
│       └── images/
│           └── landing/ (assets locaux SVG / WebP pour hero et profils)
└── stories/
    └── landing/
        ├── HeroSection.stories.ts
        ├── HowItWorksSection.stories.ts
        ├── FeaturedMentorsSection.stories.ts
        └── CommunityVerbatimSection.stories.ts
```

### 3.2. Règles d'accessibilité et de performance
- **Images locales** : Fournies en SVG ou WebP locaux dans `apps/vitrine/public/images/landing/` avec dimensions explicites (`width`, `height`), attributs `alt` pertinents et chargement optimisé (`loading="eager"` pour le hero, `lazy` pour les mentors).
- **Contraste WCAG AA** : Vérification des contrastes sur fond crème (`#F5F1E8`), fond blanc et fond vert sage (`#C8DBA8` / `#E6F0D6`).
- **Responsive 320px** : Aucun élément ne dépasse de l'écran sur mobile étroit (`scrollWidth <= innerWidth`).
- **SEO & SSR** : Balises H1, H2, H3 sémantiques présentes dans le rendu HTML initial généré par le serveur.
