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
1. **Hero Section 2 colonnes** : Titre d'accroche direct, 2 boutons d'action (mentoré / mentor), grande photo avec badge flottant « Exemple de mentor ».
2. **Comment ça marche ?** : 3 étapes claires (« Créez votre profil », « Choisissez votre mentor », « Réservez un Quick Chat »).
3. **Mentors à la une** : Grille de profils mentors fictifs avec tags technologiques, postes et bouton d’accès à l’application.
4. **Communauté & Verbatim** : Bandeau vert présentant la gratuité du service Collectif Mongulu (chiffre illustratif : +2500 membres actifs) et témoignage fictif (Sekou, personnage fictif).
5. **Accessibilité & Responsive** : Respect strict du contraste WCAG AA, absence totale de scroll horizontal dès 320px, et SSR complet.

**Données illustratives** : les noms, entreprises, badges, chiffres (+2500, +2k) et le témoignage attribué à Sekou proviennent de la maquette et ne sont pas vérifiés. La page doit les signaler explicitement comme profils/chiffres d’exemple et témoignage fictif. Ils ne décrivent pas un annuaire réel, des certifications ou des résultats établis du service. Avant de les remplacer par des données réelles, vérifier les informations et l’autorisation de publier le témoignage.

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
  - **Navigation** : les deux CTA mènent volontairement à la connexion commune `/login` ; aucun parcours mentor distinct n’existe dans cette version.
  - **Configuration et repli** : `NUXT_PUBLIC_APP_URL` attend une origine HTTP(S) sans préfixe de chemin. Sans cette variable, `nuxt.config.ts` conserve l’adresse de production par défaut. Une URL effective vide, invalide ou utilisant un autre protocole déclenche le contact mailto et le libellé « Nous contacter ». Ce repli ne détecte pas une panne réseau ou serveur de l’application.
- **Colonne visuelle** :
  - Grande illustration avec coins arrondis (`rounded-3xl` ou `rounded-2xl`).
  - Badge flottant en bas à gauche de l'image :
    - Fond blanc, ombre douce, bordure légère.
    - Icône de validation / bouclier sur pastille verte.
    - Texte « Exemple de mentor » (gras, 14px) et « Profil illustratif » (texte secondaire, 12px).

### 2.2. Section « Comment ça marche ? » (`HowItWorksSection.vue`)
- **Titre H2** : « Comment ça marche ? » (Alegreya)
- **Sous-titre** : « Trois étapes simples pour booster votre parcours. »
- **3 cartes numérotées** :
  1. Pastille verte « 1 » — Titre : « Créez votre profil » — Description claire de l'onboarding.
  2. Pastille verte « 2 » — Titre : « Choisissez votre mentor » — Recherche ciblée selon les expertises.
  3. Pastille verte « 3 » — Titre : « Réservez un Quick Chat » — Réservation directe d'un créneau de 15-30 min.

### 2.3. Section « Mentors à la une » (`FeaturedMentorsSection.vue`)
- **En-tête de section** :
  - **Titre H2** : « Mentors à la une »
  - **Sous-titre** : « Exemples de profils fictifs pour illustrer les échanges de mentoring. »
  - **Lien à droite** : « Accéder à l’application → » (lien vers `/login`).
- **Grille de 4 cartes illustratives** (profils fictifs, sans lien individuel) :
  - **Aïcha** : Data Engineer @ TechCorp — Badge « PRO (exemple) » vert clair — Tags : `Python`, `BigQuery` — Bouton « Accéder à l’application ».
  - **Patrick** : Senior DevOps @ CloudScale — Tags : `Kubernetes`, `AWS` — Bouton « Accéder à l’application ».
  - **Emmanuel** : Frontend Lead @ FinLink — Tags : `React`, `UI Design` — Bouton « Accéder à l’application ».
  - **Sarah** : Engineering Manager @ GlobalTech — Tags : `Leadership`, `Scale` — Bouton « Accéder à l’application ».
- Chaque carte a une illustration de profil fictif, bordure `#D9D9D9`, hover border `#C8DBA8`. Les boutons et le lien de section partagent `/login` et affichent « Nous contacter » si le lien applicatif est invalide.

### 2.4. Section « Une communauté engagée et gratuite » & Verbatim (`CommunityVerbatimSection.vue`)
- **Fond de section** : Fond vert doux / amande (`#E6F0D6`, token Sage Glass de `DESIGN.md`).
- **Colonne gauche (Mission & Communauté)** :
  - **Titre H2** : « Une communauté engagée et gratuite » (Alegreya).
  - **Texte descriptif** : « Manzi-mfa est un service porté par le collectif Mongulu. Notre mission est de démocratiser l'accès au savoir technologique. Les sessions « Quick Chat » sont gratuites pour tous les membres de la communauté. »
  - **Indicateur d'impact** : Icône membres + texte « +2500 membres actifs (exemple) ».
- **Colonne droite (Carte Verbatim)** :
  - Carte fond clair / verre givré aux coins arrondis.
  - Stack de 3 avatars d'utilisateurs avec pastille verte « +2k (exemple) ».
  - Citation fictive en exergue : « Manzi-mfa a changé ma vision de la tech. Merci aux mentors ! » (police Alegreya ou Hanken 600).
  - Mention visible : « Témoignage fictif ». Signature : « — Sekou, personnage fictif ».

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
│   └── pages/
│       └── index.vue (agrégation sémantique des 4 sections)
└── stories/
    └── landing/
        ├── HeroSection.stories.ts
        ├── HowItWorksSection.stories.ts
        ├── FeaturedMentorsSection.stories.ts
        └── CommunityVerbatimSection.stories.ts

layers/mongulu/public/
└── images/
    └── landing/ (8 SVG existants : hero, profils illustratifs et avatars)
```

### 3.2. Règles d'accessibilité et de performance
- **Images locales** : Fournies par les huit SVG existants dans `layers/mongulu/public/images/landing/` avec dimensions explicites (`width`, `height`), attributs `alt` pertinents et chargement optimisé (`loading="eager"` pour le hero, `lazy` pour les mentors).
- **Contraste WCAG AA** : Vérification des contrastes sur fond crème (`#F5F1E8`), fond blanc et fond de communauté unique Sage Glass (`#E6F0D6`). Dans la communauté, les textes `#1F1F1F` et `#3D4D1A` doivent atteindre au moins 4.5:1 sur ce fond exact.
- **Responsive 320px** : Aucun élément ne dépasse de l'écran sur mobile étroit (`scrollWidth <= innerWidth`).
- **SEO & SSR** : Balises H1, H2, H3 sémantiques présentes dans le rendu HTML initial généré par le serveur.
