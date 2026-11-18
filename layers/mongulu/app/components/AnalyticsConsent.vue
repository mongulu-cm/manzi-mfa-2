<script setup lang="ts">
defineProps<{ choice: string }>()
const emit = defineEmits<{ choose: [choice: 'accepted' | 'rejected'] }>()
const editing = ref(false)
const region = useTemplateRef<HTMLElement>('region')
const heading = useTemplateRef<HTMLHeadingElement>('heading')
async function choose(choice: 'accepted' | 'rejected') {
  emit('choose', choice)
  editing.value = false
  await nextTick()
  region.value?.querySelector<HTMLButtonElement>('[data-preferences]')?.focus()
}
async function edit() {
  editing.value = true
  await nextTick()
  heading.value?.focus()
}
</script>

<template>
  <section
    ref="region"
    class="mx-auto w-full max-w-4xl px-3 py-5 sm:px-5"
    aria-label="Préférences de statistiques"
  >
    <UCard v-if="!choice || editing">
      <h2
        ref="heading"
        tabindex="-1"
        class="font-display text-h3 font-bold"
      >
        Nous aider à améliorer Manzi-mfa
      </h2>
      <p class="my-4">
        Avec votre accord, PostHog mesure les visites, les parcours et les erreurs sur nos deux sites.
        Après connexion, votre e-mail relie vos visites sur les deux sites ; votre nom et votre prénom complètent votre profil PostHog.
        Vous pouvez refuser ou changer d’avis ici à tout moment.
      </p>
      <div class="flex flex-wrap gap-3">
        <UButton
          label="Accepter"
          @click="choose('accepted')"
        />
        <UButton
          label="Refuser"
          color="neutral"
          variant="outline"
          @click="choose('rejected')"
        />
      </div>
    </UCard>
    <UButton
      v-else
      label="Préférences de statistiques"
      data-preferences
      variant="link"
      @click="edit"
    />
  </section>
</template>
