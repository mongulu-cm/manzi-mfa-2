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
        <p class="mt-6 text-base text-[#47483B] sm:text-lg">
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
          >
        </div>

        <!-- Badge flottant Mentors Certifiés -->
        <div
          class="absolute -bottom-4 left-4 flex items-center gap-3 rounded-2xl border border-[#E0DDD4] bg-white p-3.5 shadow-md sm:left-6 sm:p-4"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#576F1F] text-white"
            aria-hidden="true"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <p class="text-sm font-bold text-[#1F1F1F]">
              Mentors Certifiés
            </p>
            <p class="text-xs text-[#6B6B6B]">
              +500 experts dispos
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
