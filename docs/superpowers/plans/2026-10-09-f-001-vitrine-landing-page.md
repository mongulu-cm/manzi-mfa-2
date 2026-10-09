# F-001 : Présentation de Manzi-mfa sur un site public responsive — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Concevoir et livrer la landing page publique complète, responsive (320px - desktop) et accessible de la vitrine Manzi-mfa, guidant les visiteurs vers l'application.

**Architecture:** Décomposition en 4 composants de section modulaires dans `apps/vitrine/app/components/landing/`, un composable de navigation pour la résolution sécurisée des URLs applicatives avec gestion de fallback gracieux, des stories Storybook testées avec `axe-core`, et l'extension de la suite de tests E2E Playwright.

**Tech Stack:** Nuxt 4, Vue 3, Nuxt UI, Tailwind CSS, TypeScript strict, Storybook 8, Vitest (V8 coverage), Playwright, axe-core.

**Spec:** `docs/superpowers/specs/2026-10-09-f-001-vitrine-landing-page-design.md`

## Global Constraints

- Respect strict des tokens et couleurs de `DESIGN.md` : Vert primaire `#576F1F` (WCAG AA ≥ 4.5:1), fond crème `#F5F1E8`, fond carte `#FFFFFF` / `#FAFAF8`, bordures `#D9D9D9` (hover `#C8DBA8`), texte `#1F1F1F`.
- Typographie : Alegreya 700 pour les titres H1/H2/H3, Hanken Grotesk 400/600 pour le texte courant et boutons.
- Responsive mobile-first : Aucun débordement horizontal dès 320px (`scrollWidth <= innerWidth`).
- Accessibilité : Cibles tactiles ≥ 44×44px, 0 violation critique ou sérieuse avec `axe-core`.
- Qualité & CI : Maintien des seuils de couverture unitaire Vitest (95% statements, 85% branches, 100% functions/lines) et zéro code mort (`fallow`).

## Review Focus

- Absence de variable d'environnement `NUXT_PUBLIC_APP_URL` ou URL invalide : le composant doit afficher un fallback sécurisé avec contact mail sans lever d'exception.
- Défilement horizontal sur écran ultra-étroit (320px) : aucun composant, carte ou titre ne doit dépasser la largeur de l'écran.
- Hiérarchie stricte des balises de titres (`h1` -> `h2` -> `h3`) sans saut de niveau pour les technologies d'assistance.
- Contraste des textes sur les cartes d'audience et de CTA : respecter le ratio de contraste minimal de 4.5:1.
- Navigation au clavier : l'ordre de tabulation doit être continu et le focus toujours visible.

---

### Task 1: Composable de navigation applicative (`useAppNavigation`)

**Files:**
- Create: `apps/vitrine/app/composables/useAppNavigation.ts`
- Test: `tests/unit/app-navigation.test.ts`

**Interfaces:**
- Produces: `useAppNavigation()` retournant `{ getLoginUrl(): string, isAppConfigured: ComputedRef<boolean>, supportEmail: string }`

- [ ] **Step 1: Write the failing test**

Créer `tests/unit/app-navigation.test.ts` :
```typescript
import { describe, expect, it } from 'vitest'
import { resolveAppUrl } from '../../apps/vitrine/app/composables/useAppNavigation'

describe('résolution d’URL applicative', () => {
  it('construit l’URL de login avec une base valide', () => {
    expect(resolveAppUrl('http://localhost:3001', '/login')).toBe('http://localhost:3001/login')
    expect(resolveAppUrl('https://app.manzi-mfa-2.mongulu.cm/', '/login')).toBe('https://app.manzi-mfa-2.mongulu.cm/login')
  })

  it('renvoie null si la base est absente ou vide', () => {
    expect(resolveAppUrl(undefined, '/login')).toBeNull()
    expect(resolveAppUrl('', '/login')).toBeNull()
  })

  it('renvoie null si la base est une URL invalide', () => {
    expect(resolveAppUrl('not-a-valid-url', '/login')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/app-navigation.test.ts --config vitest.unit.config.ts`
Expected: FAIL avec module not found.

- [ ] **Step 3: Write minimal implementation**

Créer `apps/vitrine/app/composables/useAppNavigation.ts` :
```typescript
export function resolveAppUrl(baseUrl: string | undefined | null, path: string = '/'): string | null {
  if (!baseUrl || typeof baseUrl !== 'string' || !baseUrl.trim()) {
    return null
  }
  try {
    return new URL(path, baseUrl).href
  }
  catch {
    return null
  }
}

export function useAppNavigation() {
  const config = useRuntimeConfig()
  const supportEmail = 'collectif@mongulu.cm'
  const appBaseUrl = config.public?.appUrl as string | undefined

  const isAppConfigured = computed(() => {
    return resolveAppUrl(appBaseUrl, '/') !== null
  })

  function getLoginUrl(): string {
    const resolved = resolveAppUrl(appBaseUrl, '/login')
    if (resolved) {
      return resolved
    }
    return `mailto:${supportEmail}?subject=Contact%20Manzi-mfa`
  }

  return {
    getLoginUrl,
    isAppConfigured,
    supportEmail,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/app-navigation.test.ts --config vitest.unit.config.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/vitrine/app/composables/useAppNavigation.ts tests/unit/app-navigation.test.ts
git commit -m "feat: ajouter useAppNavigation pour la résolution des liens applicatifs"
```

---

### Task 2: Composant `HeroSection.vue` et Story

**Files:**
- Create: `apps/vitrine/app/components/landing/HeroSection.vue`
- Create: `apps/vitrine/stories/landing/HeroSection.stories.ts`

**Interfaces:**
- Consumes: `useAppNavigation`
- Produces: Composant `<HeroSection />` affichant H1, description, CTA principal avec icône, et fallback gracieux si non configuré.

- [ ] **Step 1: Write Storybook story**

Créer `apps/vitrine/stories/landing/HeroSection.stories.ts` :
```typescript
import type { Meta, StoryObj } from '@storybook/vue3'
import HeroSection from '../../app/components/landing/HeroSection.vue'
import MonguluShell from '../../../../layers/mongulu/app/components/MonguluShell.vue'

const meta = {
  title: 'Vitrine/Landing/HeroSection',
  component: HeroSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HeroSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { MonguluShell, HeroSection },
    template: '<MonguluShell><HeroSection /></MonguluShell>',
  }),
}
```

- [ ] **Step 2: Write implementation**

Créer `apps/vitrine/app/components/landing/HeroSection.vue` :
```vue
<script setup lang="ts">
const { getLoginUrl, isAppConfigured, supportEmail } = useAppNavigation()
const loginUrl = computed(() => getLoginUrl())
</script>

<template>
  <section
    class="hero-section rounded-2xl border border-(--mongulu-divider) bg-[#F5F1E8] p-6 sm:p-10 lg:p-14"
    aria-labelledby="hero-title"
  >
    <div class="mx-auto max-w-3xl text-center">
      <span class="inline-block rounded-full bg-[#E6F0D6] px-3.5 py-1 text-xs font-semibold text-[#3D4D1A]">
        Collectif Mongulu
      </span>
      <h1
        id="hero-title"
        class="mt-4 font-serif text-3xl font-bold tracking-tight text-[#1F1F1F] sm:text-5xl lg:text-6xl"
      >
        Manzi-mfa
      </h1>
      <p class="mt-4 text-lg font-medium text-[#556B2F] sm:text-xl">
        Le pont vers l'emploi dans l'IT grâce à un échange d'une heure avec un senior.
      </p>
      <p class="mt-3 text-base text-[#6B6B6B] sm:text-lg">
        Rejoignez une communauté bienveillante de professionnels et de talents tech.
        Bénéficiez de conseils concrets, d'entraînements aux entretiens et d'un accompagnement personnalisé.
      </p>

      <div class="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <UButton
          :to="loginUrl"
          :external="isAppConfigured"
          size="xl"
          class="min-h-11 rounded-full bg-[#576F1F] px-8 py-3 text-white hover:bg-[#556B2F]"
        >
          {{ isAppConfigured ? 'Rejoindre la plateforme' : 'Nous contacter' }}
        </UButton>
      </div>

      <p
        v-if="!isAppConfigured"
        class="mt-3 text-xs text-[#6B6B6B]"
      >
        L'accès direct est momentanément indisponible. Écrivez-nous à {{ supportEmail }}.
      </p>
    </div>
  </section>
</template>
```

- [ ] **Step 3: Verify build / typecheck**

Run: `npm run typecheck --workspace @manzi/vitrine`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/vitrine/app/components/landing/HeroSection.vue apps/vitrine/stories/landing/HeroSection.stories.ts
git commit -m "feat: ajouter le composant HeroSection et sa story"
```

---

### Task 3: Composant `HowItWorksSection.vue` et Story

**Files:**
- Create: `apps/vitrine/app/components/landing/HowItWorksSection.vue`
- Create: `apps/vitrine/stories/landing/HowItWorksSection.stories.ts`

**Interfaces:**
- Produces: Composant `<HowItWorksSection />` affichant le titre H2 et les 3 étapes numérotées dans une grille responsive.

- [ ] **Step 1: Write Storybook story**

Créer `apps/vitrine/stories/landing/HowItWorksSection.stories.ts` :
```typescript
import type { Meta, StoryObj } from '@storybook/vue3'
import HowItWorksSection from '../../app/components/landing/HowItWorksSection.vue'
import MonguluShell from '../../../../layers/mongulu/app/components/MonguluShell.vue'

const meta = {
  title: 'Vitrine/Landing/HowItWorksSection',
  component: HowItWorksSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HowItWorksSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { MonguluShell, HowItWorksSection },
    template: '<MonguluShell><HowItWorksSection /></MonguluShell>',
  }),
}
```

- [ ] **Step 2: Write implementation**

Créer `apps/vitrine/app/components/landing/HowItWorksSection.vue` :
```vue
<script setup lang="ts">
const steps = [
  {
    number: '1',
    title: 'Trouvez votre mentor',
    description: 'Explorez des profils seniors vérifiés selon votre domaine (Frontend, Backend, DevOps, Data) et vos aspirations professionnelles.',
  },
  {
    number: '2',
    title: 'Réservez un échange',
    description: 'Sélectionnez un créneau de 15 à 30 minutes sans friction ni intermédiaire, synchronisé avec les disponibilités du mentor.',
  },
  {
    number: '3',
    title: 'Accélérez votre carrière',
    description: 'Recevez des conseils personnalisés, affinez votre CV et préparez vos simulations d’entretien technique en toute confiance.',
  },
]
</script>

<template>
  <section
    class="py-12 sm:py-16"
    aria-labelledby="how-it-works-title"
  >
    <div class="text-center">
      <h2
        id="how-it-works-title"
        class="font-serif text-2xl font-bold text-[#1F1F1F] sm:text-4xl"
      >
        Comment ça marche
      </h2>
      <p class="mt-2 text-base text-[#6B6B6B] sm:text-lg">
        Trois étapes simples pour transformer votre recherche d'emploi dans l'IT.
      </p>
    </div>

    <div class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="step in steps"
        :key="step.number"
        class="flex flex-col rounded-2xl border border-[#D9D9D9] bg-white p-6 transition-all hover:border-[#C8DBA8]"
      >
        <span
          class="flex h-10 w-10 items-center justify-center rounded-full bg-[#E6F0D6] text-lg font-bold text-[#576F1F]"
          aria-hidden="true"
        >
          {{ step.number }}
        </span>
        <h3 class="mt-4 font-serif text-xl font-bold text-[#1F1F1F]">
          {{ step.title }}
        </h3>
        <p class="mt-2 flex-1 text-sm leading-relaxed text-[#6B6B6B]">
          {{ step.description }}
        </p>
      </article>
    </div>
  </section>
</template>
```

- [ ] **Step 3: Verify build / typecheck**

Run: `npm run typecheck --workspace @manzi/vitrine`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/vitrine/app/components/landing/HowItWorksSection.vue apps/vitrine/stories/landing/HowItWorksSection.stories.ts
git commit -m "feat: ajouter le composant HowItWorksSection et sa story"
```

---

### Task 4: Composant `AudienceSection.vue` et Story

**Files:**
- Create: `apps/vitrine/app/components/landing/AudienceSection.vue`
- Create: `apps/vitrine/stories/landing/AudienceSection.stories.ts`

**Interfaces:**
- Consumes: `useAppNavigation`
- Produces: Composant `<AudienceSection />` affichant 2 cartes cibles (Mentorés vs Mentors) avec leurs avantages et CTAs.

- [ ] **Step 1: Write Storybook story**

Créer `apps/vitrine/stories/landing/AudienceSection.stories.ts` :
```typescript
import type { Meta, StoryObj } from '@storybook/vue3'
import AudienceSection from '../../app/components/landing/AudienceSection.vue'
import MonguluShell from '../../../../layers/mongulu/app/components/MonguluShell.vue'

const meta = {
  title: 'Vitrine/Landing/AudienceSection',
  component: AudienceSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AudienceSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { MonguluShell, AudienceSection },
    template: '<MonguluShell><AudienceSection /></MonguluShell>',
  }),
}
```

- [ ] **Step 2: Write implementation**

Créer `apps/vitrine/app/components/landing/AudienceSection.vue` :
```vue
<script setup lang="ts">
const { getLoginUrl, isAppConfigured } = useAppNavigation()
const loginUrl = computed(() => getLoginUrl())

const menteeBenefits = [
  'Accès privilégié à des retours de professionnels en poste',
  'Conseils ciblés pour vos entretiens et tests techniques',
  'Ajustement concret de votre CV et posture professionnelle',
]

const mentorBenefits = [
  'Partagez votre expertise et donnez du sens à votre expérience',
  'Seulement 1h par mois pour avoir un impact durable',
  'Contribuez activement à la mixité et l’insertion dans la tech',
]
</script>

<template>
  <section
    class="py-12 sm:py-16"
    aria-labelledby="audience-title"
  >
    <div class="text-center">
      <h2
        id="audience-title"
        class="font-serif text-2xl font-bold text-[#1F1F1F] sm:text-4xl"
      >
        Conçu pour grandir ensemble
      </h2>
      <p class="mt-2 text-base text-[#6B6B6B] sm:text-lg">
        Deux rôles complémentaires au service d'une même communauté solidaire.
      </p>
    </div>

    <div class="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
      <!-- Carte Mentoré -->
      <article class="flex flex-col rounded-2xl border border-[#D9D9D9] bg-white p-6 sm:p-8">
        <span class="inline-block w-fit rounded-full bg-[#E6F0D6] px-3 py-1 text-xs font-semibold text-[#3D4D1A]">
          Candidats & Reconversion
        </span>
        <h3 class="mt-4 font-serif text-2xl font-bold text-[#1F1F1F]">
          Vous cherchez un tremplin dans l'IT ?
        </h3>
        <p class="mt-2 text-sm text-[#6B6B6B]">
          Ne restez plus seul face aux refus. Rencontrez un mentor qui connaît la réalité du marché et vous aide à franchir chaque obstacle.
        </p>
        <ul class="mt-6 flex-1 space-y-3 text-sm text-[#47483B]">
          <li
            v-for="benefit in menteeBenefits"
            :key="benefit"
            class="flex items-start gap-2"
          >
            <span
              class="text-[#576F1F]"
              aria-hidden="true"
            >✓</span>
            <span>{{ benefit }}</span>
          </li>
        </ul>
        <div class="mt-8">
          <UButton
            :to="loginUrl"
            :external="isAppConfigured"
            variant="outline"
            class="min-h-11 w-full justify-center rounded-full border-[#576F1F] text-[#576F1F] hover:bg-[#E6F0D6]"
          >
            Trouver un mentor
          </UButton>
        </div>
      </article>

      <!-- Carte Mentor -->
      <article class="flex flex-col rounded-2xl border border-[#D9D9D9] bg-white p-6 sm:p-8">
        <span class="inline-block w-fit rounded-full bg-[#E6F0D6] px-3 py-1 text-xs font-semibold text-[#3D4D1A]">
          Professionnels & Seniors
        </span>
        <h3 class="mt-4 font-serif text-2xl font-bold text-[#1F1F1F]">
          Vous avez de l'expérience à partager ?
        </h3>
        <p class="mt-2 text-sm text-[#6B6B6B]">
          Votre parcours a de la valeur. Consacrez un échange ponctuel pour débloquer un profil motivé et booster la diversité de notre écosystème.
        </p>
        <ul class="mt-6 flex-1 space-y-3 text-sm text-[#47483B]">
          <li
            v-for="benefit in mentorBenefits"
            :key="benefit"
            class="flex items-start gap-2"
          >
            <span
              class="text-[#576F1F]"
              aria-hidden="true"
            >✓</span>
            <span>{{ benefit }}</span>
          </li>
        </ul>
        <div class="mt-8">
          <UButton
            :to="loginUrl"
            :external="isAppConfigured"
            class="min-h-11 w-full justify-center rounded-full bg-[#576F1F] text-white hover:bg-[#556B2F]"
          >
            Devenir mentor
          </UButton>
        </div>
      </article>
    </div>
  </section>
</template>
```

- [ ] **Step 3: Verify build / typecheck**

Run: `npm run typecheck --workspace @manzi/vitrine`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/vitrine/app/components/landing/AudienceSection.vue apps/vitrine/stories/landing/AudienceSection.stories.ts
git commit -m "feat: ajouter le composant AudienceSection et sa story"
```

---

### Task 5: Composant `CtaSection.vue` et Story

**Files:**
- Create: `apps/vitrine/app/components/landing/CtaSection.vue`
- Create: `apps/vitrine/stories/landing/CtaSection.stories.ts`

**Interfaces:**
- Consumes: `useAppNavigation`
- Produces: Composant `<CtaSection />` affichant la section de réassurance et d'appel à l'action final.

- [ ] **Step 1: Write Storybook story**

Créer `apps/vitrine/stories/landing/CtaSection.stories.ts` :
```typescript
import type { Meta, StoryObj } from '@storybook/vue3'
import CtaSection from '../../app/components/landing/CtaSection.vue'
import MonguluShell from '../../../../layers/mongulu/app/components/MonguluShell.vue'

const meta = {
  title: 'Vitrine/Landing/CtaSection',
  component: CtaSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CtaSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { MonguluShell, CtaSection },
    template: '<MonguluShell><CtaSection /></MonguluShell>',
  }),
}
```

- [ ] **Step 2: Write implementation**

Créer `apps/vitrine/app/components/landing/CtaSection.vue` :
```vue
<script setup lang="ts">
const { getLoginUrl, isAppConfigured } = useAppNavigation()
const loginUrl = computed(() => getLoginUrl())
</script>

<template>
  <section
    class="my-12 rounded-2xl border border-(--mongulu-divider) bg-[#F5F1E8] p-8 text-center sm:p-12"
    aria-labelledby="cta-title"
  >
    <div class="mx-auto max-w-2xl">
      <h2
        id="cta-title"
        class="font-serif text-2xl font-bold text-[#1F1F1F] sm:text-4xl"
      >
        Prêt à franchir le cap ?
      </h2>
      <p class="mt-4 text-base text-[#6B6B6B] sm:text-lg">
        L'inscription est rapide et l'ensemble des échanges est 100 % gratuit et bénévole, porté par le Collectif Mongulu.
      </p>
      <div class="mt-8 flex justify-center">
        <UButton
          :to="loginUrl"
          :external="isAppConfigured"
          size="xl"
          class="min-h-11 rounded-full bg-[#576F1F] px-8 py-3 text-white hover:bg-[#556B2F]"
        >
          Démarrer maintenant
        </UButton>
      </div>
    </div>
  </section>
</template>
```

- [ ] **Step 3: Verify build / typecheck**

Run: `npm run typecheck --workspace @manzi/vitrine`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/vitrine/app/components/landing/CtaSection.vue apps/vitrine/stories/landing/CtaSection.stories.ts
git commit -m "feat: ajouter le composant CtaSection et sa story"
```

---

### Task 6: Intégration sur `apps/vitrine/app/pages/index.vue` et `vitrine.css`

**Files:**
- Modify: `apps/vitrine/app/pages/index.vue`
- Modify: `apps/vitrine/app/assets/css/vitrine.css`

**Interfaces:**
- Consumes: `<HeroSection />`, `<HowItWorksSection />`, `<AudienceSection />`, `<CtaSection />`
- Produces: Page d'accueil publique complète avec métadonnées SEO complètes.

- [ ] **Step 1: Update index.vue**

Modifier `apps/vitrine/app/pages/index.vue` :
```vue
<script setup lang="ts">
import HeroSection from '../components/landing/HeroSection.vue'
import HowItWorksSection from '../components/landing/HowItWorksSection.vue'
import AudienceSection from '../components/landing/AudienceSection.vue'
import CtaSection from '../components/landing/CtaSection.vue'

useSeoMeta({
  title: 'Manzi-mfa — Le pont vers l\'emploi dans l\'IT',
  description: 'Le pont vers l\'emploi dans l\'IT grâce à un échange d\'une heure avec un senior. Rencontrez des mentors bénévoles pour booster votre carrière.',
  ogTitle: 'Manzi-mfa — Le pont vers l\'emploi dans l\'IT',
  ogDescription: 'Le pont vers l\'emploi dans l\'IT grâce à un échange d\'une heure avec un senior.',
})
</script>

<template>
  <div class="landing-page space-y-12 sm:space-y-16">
    <HeroSection />
    <HowItWorksSection />
    <AudienceSection />
    <CtaSection />
  </div>
</template>
```

- [ ] **Step 2: Update vitrine.css if needed**

Vérifier et ajuster `apps/vitrine/app/assets/css/vitrine.css` pour assurer la fluidité des marges et l'absence de débordement.

- [ ] **Step 3: Verify check and storybook build**

Run: `npm run check`
Expected: PASS (lint, typecheck et build).

- [ ] **Step 4: Commit**

```bash
git add apps/vitrine/app/pages/index.vue apps/vitrine/app/assets/css/vitrine.css
git commit -m "feat: assembler les 4 sections sur la page d'accueil vitrine"
```

---

### Task 7: Tests E2E Playwright (`tests/e2e/sites.test.mjs`)

**Files:**
- Modify: `tests/e2e/sites.test.mjs`

**Interfaces:**
- Consumes: La landing page vitrine servie en SSR et SPA.
- Produces: Assertions Playwright validant les 4 critères d'acceptation de l'issue #8.

- [ ] **Step 1: Update test file to add landing page coverage**

Ajouter dans `tests/e2e/sites.test.mjs` :
1. Test de rendu SSR vérifiant la présence des titres des 4 sections (« Manzi-mfa », « Comment ça marche », « Conçu pour grandir ensemble », « Prêt à franchir le cap ») dans le HTML brut sans JS.
2. Test d'accessibilité et de non-débordement horizontal sur mobile 320px et desktop 1280px pour la nouvelle page d'accueil (`axe.run()`).
3. Test de clic sur le CTA redirigeant vers `${appUrl}/login`.

- [ ] **Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/sites.test.mjs
git commit -m "test: valider les critères d'acceptation E2E de la landing page vitrine"
```

---

### Task 8: Validation Complète CI & Création de la PR en Draft

**Files:**
- Aucun fichier de code créé, exécution des vérifications globales.

- [ ] **Step 1: Exécuter toutes les suites de tests et contrôles**

```bash
npm run check
npm run test:unit
npm run test:coverage
npm run build:storybook
npm run test:stories
npm run test:e2e
npx fallow --ci --format compact
```
Expected: Tous les contrôles au vert.

- [ ] **Step 2: Créer la Pull Request en Draft**

Conformément à `AGENTS.md` :
```bash
git push -u origin feature/f-001-vitrine-landing-page
gh pr create --draft --title "[F-001] Présenter Manzi-mfa sur un site public responsive" --body "..."
```

- [ ] **Step 3: Suivi avec `ce-babysit-pr`**

Appliquer la consigne de `AGENTS.md` : surveiller la PR jusqu'à ce que la CI soit entièrement verte avant toute demande à l'utilisateur.
