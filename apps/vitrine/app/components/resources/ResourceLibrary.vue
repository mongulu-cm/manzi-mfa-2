<script setup lang="ts">
import { groupByCategory } from '../../utils/interview-resources'
import type { InterviewResource } from '../../utils/interview-resources'
import ResourceCard from './ResourceCard.vue'

const props = defineProps<{ resources: InterviewResource[] }>()

const groups = computed(() => groupByCategory(props.resources))
const reportUrl = `mailto:collectif@mongulu.cm?subject=${encodeURIComponent('Ressource d’entretien : lien cassé')}`
</script>

<template>
  <div class="space-y-12">
    <UAlert
      title="Ressources externes"
      description="Ces services sont édités par des tiers et recommandés par le Collectif Mongulu. Ils ne font pas partie de Manzi-mfa, qui ne génère pas d’entretiens par IA. Leurs conditions d’utilisation et leurs politiques de confidentialité s’appliquent."
      icon="i-lucide-info"
      color="neutral"
      variant="outline"
    />

    <p
      v-if="groups.length === 0"
      class="text-base text-muted"
    >
      Aucune ressource n’est disponible pour le moment.
    </p>

    <section
      v-for="group in groups"
      :key="group.category"
      :aria-labelledby="`category-${group.category}`"
    >
      <h2
        :id="`category-${group.category}`"
        class="font-serif text-2xl font-bold text-default sm:text-3xl"
      >
        {{ group.label }}
      </h2>
      <ul
        class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
      >
        <li
          v-for="resource in group.resources"
          :key="resource.id"
        >
          <ResourceCard :resource="resource" />
        </li>
      </ul>
    </section>

    <p class="text-base text-default">
      Un lien ne fonctionne plus ?
      <ULink
        :to="reportUrl"
        class="inline-flex min-h-11 items-center text-primary underline"
      >
        Signaler un lien cassé
      </ULink>
    </p>
  </div>
</template>
