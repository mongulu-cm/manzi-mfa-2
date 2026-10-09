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
