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
