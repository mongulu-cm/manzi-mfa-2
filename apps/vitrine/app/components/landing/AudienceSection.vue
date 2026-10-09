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
