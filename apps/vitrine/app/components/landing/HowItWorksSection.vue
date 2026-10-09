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
