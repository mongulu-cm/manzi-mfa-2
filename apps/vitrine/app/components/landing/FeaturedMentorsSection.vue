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
          Exemples de profils fictifs pour illustrer les échanges de mentoring.
        </p>
      </div>

      <ULink
        :to="loginUrl"
        :external="isAppConfigured"
        class="inline-flex min-h-11 items-center gap-1 font-semibold text-[#1F1F1F] hover:text-[#576F1F]"
      >
        <span>{{ isAppConfigured ? 'Accéder à l’application' : 'Nous contacter' }}</span>
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
            :alt="`Illustration du profil fictif de ${mentor.name}`"
            width="320"
            height="224"
            class="h-full w-full object-cover"
            loading="lazy"
          >
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
              PRO (exemple)
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
              {{ isAppConfigured ? 'Accéder à l’application' : 'Nous contacter' }}
            </UButton>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
