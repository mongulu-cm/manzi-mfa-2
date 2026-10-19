# F-001 : Landing Page Vitrine Manzi-mfa (Alignement Maquette Stitch) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre à jour la landing page publique de la vitrine Manzi-mfa pour l'aligner fidèlement sur la maquette officielle Stitch issue #8 : Hero 2 colonnes avec visuel et badge flottant, étapes numérotées, grille de 4 mentors à la une, et bandeau vert mission / verbatim communautaire.

**Architecture:** Quatre composants modulaires sous `apps/vitrine/app/components/landing/`, assets graphiques locaux servis en statique sous `apps/vitrine/public/images/landing/`, intégration du composable `useAppNavigation` pour les liens applicatifs, stories Storybook avec validation `axe-core`, et mise à jour des tests E2E Playwright.

**Tech Stack:** Nuxt 4 (SSR), Vue 3, Nuxt UI, Tailwind CSS v4, TypeScript strict, Storybook 8, Vitest (V8 coverage), Playwright, axe-core.

**Spec:** `docs/superpowers/specs/2026-10-09-f-001-vitrine-landing-page-design.md`

## Global Constraints

- Respect strict des tokens et couleurs de `DESIGN.md` : Vert primaire `#576F1F` (WCAG AA ≥ 4.5:1), fond crème `#F5F1E8`, fond vert sage `#D4E4BA` / `#E6F0D6`, fond carte `#FFFFFF`, bordures `#D9D9D9` (hover `#C8DBA8`), texte `#1F1F1F`.
- Typographie : Alegreya 700 pour les titres H1/H2/H3, Hanken Grotesk 400/600 pour le texte courant et boutons.
- Responsive mobile-first : Aucun débordement horizontal dès 320px (`scrollWidth <= innerWidth`).
- Accessibilité : Cibles tactiles ≥ 44×44px, 0 violation critique ou sérieuse avec `axe-core`.
- Qualité & CI : Maintien des seuils de couverture unitaire Vitest (95% statements, 85% branches, 100% functions/lines) et zéro code mort (`fallow`).

## Review Focus

- Absence de variable d'environnement `NUXT_PUBLIC_APP_URL` ou URL invalide : tous les boutons vers la plateforme se replient vers `mailto:collectif@mongulu.cm` sans erreur.
- Défilement horizontal à 320px sur la grille des mentors et le bloc verbatim : `overflow-x: clip` actif, marges et paddings adaptés.
- Accessibilité des images locales : attributs `alt` pertinents pour l'image du Hero et les avatars des mentors, masquage `aria-hidden="true"` sur les icônes décoratives.
- Contraste des textes sur le bandeau vert « Une communauté engagée et gratuite » : texte foncé `#1F1F1F` ou `#3D4D1A` garantissant un ratio ≥ 4.5:1.
- Hiérarchie stricte des titres : `h1` unique sur le Hero, `h2` pour les sections (« Comment ça marche ? », « Mentors à la une », « Une communauté engagée et gratuite »), `h3` pour les noms de mentors et étapes.

---

### Task 1: Préparation des assets graphiques locaux pour la landing page

**Files:**
- Create: `apps/vitrine/public/images/landing/hero-mentor.svg`
- Create: `apps/vitrine/public/images/landing/mentor-aicha.svg`
- Create: `apps/vitrine/public/images/landing/mentor-patrick.svg`
- Create: `apps/vitrine/public/images/landing/mentor-emmanuel.svg`
- Create: `apps/vitrine/public/images/landing/mentor-sarah.svg`
- Create: `apps/vitrine/public/images/landing/avatar-1.svg`
- Create: `apps/vitrine/public/images/landing/avatar-2.svg`
- Create: `apps/vitrine/public/images/landing/avatar-3.svg`

**Interfaces:**
- Produces: Assets statiques vectoriels locaux représentant fidèlement les profils et visuels de la maquette Stitch sans dépendre d'un CDN externe en CI.

- [ ] **Step 1: Créer les assets SVG locaux sous `apps/vitrine/public/images/landing/`**

Générer des illustrations SVG soignées et stylisées reprenant les palettes et visages de la maquette (femme avec ordinateur pour le hero, portraits stylisés pour Aïcha, Patrick, Emmanuel, Sarah, et 3 avatars pour le verbatim).

- [ ] **Step 2: Vérifier la disponibilité des assets via le serveur statique Nuxt**

Run: `ls -la apps/vitrine/public/images/landing/`
Expected: 8 fichiers présents.

- [ ] **Step 3: Commit**

```bash
git add apps/vitrine/public/images/landing/
git commit -m "feat(assets): ajouter les visuels vectoriels locaux pour la landing page"
```

---

### Task 2: Mise à jour du composant Hero (`HeroSection.vue`)

**Files:**
- Modify: `apps/vitrine/app/components/landing/HeroSection.vue`
- Modify: `apps/vitrine/stories/landing/HeroSection.stories.ts`

**Interfaces:**
- Consumes: `useAppNavigation()`
- Produces: Composant Hero responsive sur 2 colonnes avec texte, 2 CTAs, image hero et badge flottant « Mentors Certifiés ».

- [ ] **Step 1: Écrire le composant `HeroSection.vue` mis à jour**

```vue
<script setup lang="ts">
const { getLoginUrl, isAppConfigured, supportEmail } = useAppNavigation()
const loginUrl = computed(() => getLoginUrl())
</script>

<template>
  <section
    class="hero-section rounded-3xl bg-[#F5F1E8] p-6 sm:p-10 lg:p-14"
    aria-labelledby="hero-title"
  >
    <div class="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
      <!-- Colonne texte -->
      <div class="lg:col-span-7">
        <h1
          id="hero-title"
          class="font-serif text-3xl font-bold leading-tight text-[#1F1F1F] sm:text-5xl lg:text-6xl"
        >
          Trouvez le mentor tech qui vous aidera à avancer
        </h1>
        <p class="mt-6 text-base text-[#555555] sm:text-lg">
          Accélérez votre carrière grâce à des échanges de 15-30 minutes avec des professionnels chevronnés de la tech africaine et de sa diaspora.
        </p>

        <div class="mt-8 flex flex-wrap items-center gap-4">
          <UButton
            :to="loginUrl"
            :external="isAppConfigured"
            size="xl"
            class="min-h-11 rounded-full bg-[#576F1F] px-8 py-3 font-semibold text-white hover:bg-[#556B2F]"
          >
            {{ isAppConfigured ? 'Trouver un mentor' : 'Nous contacter' }}
          </UButton>
          <UButton
            :to="loginUrl"
            :external="isAppConfigured"
            variant="outline"
            size="xl"
            class="min-h-11 rounded-full border border-[#576F1F] px-8 py-3 font-semibold text-[#576F1F] hover:bg-[#E6F0D6]"
          >
            Devenir mentor
          </UButton>
        </div>

        <p
          v-if="!isAppConfigured"
          class="mt-3 text-xs text-[#6B6B6B]"
        >
          L'accès direct est momentanément indisponible. Écrivez-nous à {{ supportEmail }}.
        </p>
      </div>

      <!-- Colonne image avec badge flottant -->
      <div class="relative lg:col-span-5">
        <div class="overflow-hidden rounded-3xl shadow-sm">
          <img
            src="/images/landing/hero-mentor.svg"
            alt="Mentorée échangeant sur son parcours professionnel"
            width="560"
            height="460"
            class="h-auto w-full object-cover"
            loading="eager"
          />
        </div>

        <!-- Badge flottant Mentors Certifiés -->
        <div
          class="absolute -bottom-4 left-4 flex items-center gap-3 rounded-2xl border border-[#E0DDD4] bg-white p-3.5 shadow-md sm:left-6 sm:p-4"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#576F1F] text-white"
            aria-hidden="true"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-bold text-[#1F1F1F]">Mentors Certifiés</p>
            <p class="text-xs text-[#6B6B6B]">+500 experts dispos</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
```

- [ ] **Step 2: Mettre à jour la story Storybook `HeroSection.stories.ts`**

Mettre à jour les assertions et tests d'interactions dans la story.

- [ ] **Step 3: Vérifier le typecheck**

Run: `npm run typecheck --workspace @manzi/vitrine`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/vitrine/app/components/landing/HeroSection.vue apps/vitrine/stories/landing/HeroSection.stories.ts
git commit -m "feat(landing): aligner HeroSection sur le layout 2 colonnes avec image et badge"
```

---

### Task 3: Mise à jour du composant « Comment ça marche ? » (`HowItWorksSection.vue`)

**Files:**
- Modify: `apps/vitrine/app/components/landing/HowItWorksSection.vue`
- Modify: `apps/vitrine/stories/landing/HowItWorksSection.stories.ts`

**Interfaces:**
- Produces: Section des 3 étapes conforme à la maquette Stitch.

- [ ] **Step 1: Mettre à jour `HowItWorksSection.vue`**

Ajuster le titre « Comment ça marche ? », le sous-titre « Trois étapes simples pour booster votre parcours. », et les 3 étapes :
1. « Créez votre profil » — Présentez votre parcours, vos objectifs et vos besoins d'accompagnement.
2. « Choisissez votre mentor » — Explorez les profils selon votre stack et réservez selon vos disponibilités.
3. « Book Quick Chat » — Échangez pendant 15-30 minutes en direct avec un senior bienveillant.

- [ ] **Step 2: Mettre à jour la story Storybook `HowItWorksSection.stories.ts`**

- [ ] **Step 3: Vérifier le typecheck**

Run: `npm run typecheck --workspace @manzi/vitrine`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/vitrine/app/components/landing/HowItWorksSection.vue apps/vitrine/stories/landing/HowItWorksSection.stories.ts
git commit -m "feat(landing): aligner HowItWorksSection sur les libellés de la maquette Stitch"
```

---

### Task 4: Création du composant « Mentors à la une » (`FeaturedMentorsSection.vue`)

**Files:**
- Create: `apps/vitrine/app/components/landing/FeaturedMentorsSection.vue`
- Create: `apps/vitrine/stories/landing/FeaturedMentorsSection.stories.ts`

**Interfaces:**
- Consumes: `useAppNavigation()` pour les liens « Voir profil » et « Voir tous les mentors → »
- Produces: Composant affichant la grille des 4 mentors vedettes (Aïcha, Patrick, Emmanuel, Sarah) avec tags, badges et boutons.

- [ ] **Step 1: Créer `FeaturedMentorsSection.vue`**

```vue
<script setup lang="ts">
const { getLoginUrl, isAppConfigured } = useAppNavigation()
const loginUrl = computed(() => getLoginUrl())

interface Mentor {
  id: string
  name: string
  role: string
  company: string
  isPro?: boolean
  tags: string[]
  avatar: string
}

const mentors: Mentor[] = [
  {
    id: 'aicha',
    name: 'Aïcha',
    role: 'Data Engineer',
    company: 'TechCorp',
    isPro: true,
    tags: ['Python', 'BigQuery'],
    avatar: '/images/landing/mentor-aicha.svg',
  },
  {
    id: 'patrick',
    name: 'Patrick',
    role: 'Senior DevOps',
    company: 'CloudScale',
    tags: ['Kubernetes', 'AWS'],
    avatar: '/images/landing/mentor-patrick.svg',
  },
  {
    id: 'emmanuel',
    name: 'Emmanuel',
    role: 'Frontend Lead',
    company: 'FinLink',
    tags: ['React', 'UI Design'],
    avatar: '/images/landing/mentor-emmanuel.svg',
  },
  {
    id: 'sarah',
    name: 'Sarah',
    role: 'Engineering Manager',
    company: 'GlobalTech',
    tags: ['Leadership', 'Scale'],
    avatar: '/images/landing/mentor-sarah.svg',
  },
]
</script>

<template>
  <section
    class="featured-mentors-section"
    aria-labelledby="featured-mentors-title"
  >
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h2
          id="featured-mentors-title"
          class="font-serif text-2xl font-bold text-[#1F1F1F] sm:text-4xl"
        >
          Mentors à la une
        </h2>
        <p class="mt-2 text-base text-[#6B6B6B]">
          Apprenez des meilleurs de l'écosystème.
        </p>
      </div>

      <ULink
        :to="loginUrl"
        :external="isAppConfigured"
        class="inline-flex min-h-11 items-center gap-1 font-semibold text-[#1F1F1F] hover:text-[#576F1F]"
      >
        <span>Voir tous les mentors</span>
        <span aria-hidden="true">&rarr;</span>
      </ULink>
    </div>

    <div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <article
        v-for="mentor in mentors"
        :key="mentor.id"
        class="flex flex-col overflow-hidden rounded-2xl border border-[#D9D9D9] bg-white transition hover:border-[#C8DBA8]"
      >
        <div class="relative h-56 w-full overflow-hidden bg-[#FAFAF8]">
          <img
            :src="mentor.avatar"
            :alt="`Photo de profil de ${mentor.name}`"
            width="320"
            height="224"
            class="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <div class="flex flex-1 flex-col p-5">
          <div class="flex items-center justify-between">
            <h3 class="font-serif text-xl font-bold text-[#1F1F1F]">
              {{ mentor.name }}
            </h3>
            <span
              v-if="mentor.isPro"
              class="rounded-full bg-[#E6F0D6] px-2.5 py-0.5 text-xs font-bold text-[#3D4D1A]"
            >
              PRO
            </span>
          </div>

          <p class="mt-1 text-sm text-[#6B6B6B]">
            {{ mentor.role }} @ {{ mentor.company }}
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="tag in mentor.tags"
              :key="tag"
              class="rounded-full bg-[#F5F1E8] px-3 py-1 text-xs font-medium text-[#47483B]"
            >
              {{ tag }}
            </span>
          </div>

          <div class="mt-6 pt-2">
            <UButton
              :to="loginUrl"
              :external="isAppConfigured"
              variant="outline"
              class="min-h-11 w-full justify-center rounded-full border-[#576F1F] text-[#576F1F] hover:bg-[#E6F0D6]"
            >
              Voir profil
            </UButton>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
```

- [ ] **Step 2: Créer la story Storybook `FeaturedMentorsSection.stories.ts`**

- [ ] **Step 3: Vérifier le typecheck**

Run: `npm run typecheck --workspace @manzi/vitrine`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/vitrine/app/components/landing/FeaturedMentorsSection.vue apps/vitrine/stories/landing/FeaturedMentorsSection.stories.ts
git commit -m "feat(landing): ajouter le composant FeaturedMentorsSection et sa story"
```

---

### Task 5: Création du composant Communauté & Verbatim (`CommunityVerbatimSection.vue`)

**Files:**
- Create: `apps/vitrine/app/components/landing/CommunityVerbatimSection.vue`
- Create: `apps/vitrine/stories/landing/CommunityVerbatimSection.stories.ts`

**Interfaces:**
- Produces: Bandeau vert sage combinant la mission gratuite du Collectif Mongulu (+2500 membres actifs) et la carte verbatim de Sekou.

- [ ] **Step 1: Créer `CommunityVerbatimSection.vue`**

```vue
<template>
  <section
    class="community-verbatim-section rounded-3xl bg-[#D2E6BA] p-6 sm:p-10 lg:p-14"
    aria-labelledby="community-title"
  >
    <div class="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
      <!-- Colonne gauche: Mission -->
      <div class="lg:col-span-6">
        <h2
          id="community-title"
          class="font-serif text-3xl font-bold leading-tight text-[#1F1F1F] sm:text-4xl"
        >
          Une communauté engagée et gratuite
        </h2>
        <p class="mt-4 text-base leading-relaxed text-[#2D3D14] sm:text-lg">
          Manzi-mfa est un service porté par le collectif Mongulu. Notre mission est de démocratiser l'accès au savoir technologique. Les sessions "Quick Chat" sont gratuites pour tous les membres de la communauté.
        </p>

        <div class="mt-8 flex items-center gap-3 font-semibold text-[#1F1F1F]">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-[#3D4D1A] text-white"
            aria-hidden="true"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span>+2500 membres actifs</span>
        </div>
      </div>

      <!-- Colonne droite: Carte Verbatim -->
      <div class="lg:col-span-6">
        <div class="rounded-3xl bg-white/70 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <!-- Stack avatars -->
          <div class="flex items-center">
            <div class="flex -space-x-3 overflow-hidden">
              <img
                src="/images/landing/avatar-1.svg"
                alt="Membre de la communauté"
                width="40"
                height="40"
                class="inline-block h-10 w-10 rounded-full ring-2 ring-white"
              />
              <img
                src="/images/landing/avatar-2.svg"
                alt="Membre de la communauté"
                width="40"
                height="40"
                class="inline-block h-10 w-10 rounded-full ring-2 ring-white"
              />
              <img
                src="/images/landing/avatar-3.svg"
                alt="Membre de la communauté"
                width="40"
                height="40"
                class="inline-block h-10 w-10 rounded-full ring-2 ring-white"
              />
            </div>
            <span class="ml-3 rounded-full bg-[#3D4D1A] px-3 py-1 text-xs font-bold text-white">
              +2k
            </span>
          </div>

          <blockquote class="mt-6">
            <p class="font-serif text-xl font-bold leading-snug text-[#1F1F1F] sm:text-2xl">
              "Manzi-mfa a changé ma vision de la tech. Merci aux mentors !"
            </p>
            <footer class="mt-4 text-sm font-medium text-[#555555]">
              &mdash; Sekou, Junior Web Dev
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  </section>
</template>
```

- [ ] **Step 2: Créer la story Storybook `CommunityVerbatimSection.stories.ts`**

- [ ] **Step 3: Vérifier le typecheck**

Run: `npm run typecheck --workspace @manzi/vitrine`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/vitrine/app/components/landing/CommunityVerbatimSection.vue apps/vitrine/stories/landing/CommunityVerbatimSection.stories.ts
git commit -m "feat(landing): ajouter le composant CommunityVerbatimSection et sa story"
```

---

### Task 6: Intégration sur la page vitrine et nettoyage du code mort

**Files:**
- Modify: `apps/vitrine/app/pages/index.vue`
- Delete: `apps/vitrine/app/components/landing/AudienceSection.vue` (si remplacé)
- Delete: `apps/vitrine/stories/landing/AudienceSection.stories.ts`
- Delete: `apps/vitrine/app/components/landing/CtaSection.vue` (si remplacé)
- Delete: `apps/vitrine/stories/landing/CtaSection.stories.ts`

**Interfaces:**
- Consumes: `HeroSection`, `HowItWorksSection`, `FeaturedMentorsSection`, `CommunityVerbatimSection`
- Produces: Page vitrine index assemblant les 4 sections de la maquette.

- [ ] **Step 1: Modifier `apps/vitrine/app/pages/index.vue`**

```vue
<script setup lang="ts">
import HeroSection from '../components/landing/HeroSection.vue'
import HowItWorksSection from '../components/landing/HowItWorksSection.vue'
import FeaturedMentorsSection from '../components/landing/FeaturedMentorsSection.vue'
import CommunityVerbatimSection from '../components/landing/CommunityVerbatimSection.vue'

useSeoMeta({
  title: 'Manzi-mfa — Trouvez le mentor tech qui vous aidera à avancer',
  description: 'Accélérez votre carrière grâce à des échanges de 15-30 minutes avec des professionnels chevronnés de la tech africaine et de sa diaspora.',
  ogTitle: 'Manzi-mfa — Trouvez le mentor tech qui vous aidera à avancer',
  ogDescription: 'Accélérez votre carrière grâce à des échanges de 15-30 minutes avec des professionnels chevronnés.',
})
</script>

<template>
  <div class="landing-page space-y-12 sm:space-y-16">
    <HeroSection />
    <HowItWorksSection />
    <FeaturedMentorsSection />
    <CommunityVerbatimSection />
  </div>
</template>
```

- [ ] **Step 2: Supprimer les composants obsolètes non utilisés et vérifier avec fallow**

Run: `npx fallow --ci --format compact`
Expected: 0 code mort.

- [ ] **Step 3: Commit**

```bash
git add apps/vitrine/app/pages/index.vue
git rm apps/vitrine/app/components/landing/AudienceSection.vue apps/vitrine/stories/landing/AudienceSection.stories.ts apps/vitrine/app/components/landing/CtaSection.vue apps/vitrine/stories/landing/CtaSection.stories.ts
git commit -m "feat(landing): assembler les 4 sections Stitch sur la vitrine et retirer les anciens blocs"
```

---

### Task 7: Mise à jour et validation des tests E2E Playwright

**Files:**
- Modify: `tests/e2e/sites.test.mjs`

**Interfaces:**
- Consumes: Landing page vitrine servie en SSR et SPA.
- Produces: Tests E2E Playwright validant les nouveaux critères et titres de la maquette Stitch.

- [ ] **Step 1: Mettre à jour `tests/e2e/sites.test.mjs`**

Ajuster les vérifications de titres et de CTA pour correspondre aux nouveaux textes :
1. Rendu SSR sans JS vérifiant :
   - H1 : `Trouvez le mentor tech qui vous aidera à avancer`
   - H2 : `Comment ça marche ?`, `Mentors à la une`, `Une communauté engagée et gratuite`
   - Présence des profils Aïcha, Patrick, Emmanuel, Sarah dans le HTML SSR.
2. Accessibilité `axe-core` et non-débordement à 320px et 1280px.
3. Test du CTA « Trouver un mentor » redirigeant vers `${appUrl}/login`.

- [ ] **Step 2: Exécuter les tests E2E**

Run: `npm run test:e2e`
Expected: 14/14 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/sites.test.mjs
git commit -m "test: adapter les tests E2E Playwright à la maquette Stitch"
```

---

### Task 8: Validation complète CI & Push de la branche

**Files:**
- Aucun fichier de code créé, exécution des vérifications globales.

- [ ] **Step 1: Exécuter toutes les suites de tests et contrôles qualité**

```bash
npm run check
npm run test:unit
npm run test:coverage
npm run build:storybook
npm run test:stories
npm run test:e2e
npx fallow --ci --format compact
```
Expected: Tous les voyants au vert.

- [ ] **Step 2: Push vers `origin/feature/f-001-vitrine-landing-page`**

```bash
git push origin feature/f-001-vitrine-landing-page
```

- [ ] **Step 3: Vérification du suivi CI sur GitHub Actions**

Vérifier que les check runs sur la PR #30 repassent tous au vert.
