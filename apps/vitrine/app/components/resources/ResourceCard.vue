<script setup lang="ts">
import { LANGUAGE_LABELS, resourceDomain } from '../../utils/interview-resources'
import type { InterviewResource } from '../../utils/interview-resources'

const props = defineProps<{ resource: InterviewResource }>()

const domain = computed(() => resourceDomain(props.resource.url))
// Le nom accessible précise la destination et l'ouverture dans un nouvel onglet.
const linkLabel = computed(() =>
  `Consulter ${props.resource.title} sur ${domain.value} (site externe, nouvel onglet)`)
</script>

<template>
  <article
    class="flex h-full flex-col rounded-2xl border border-[#D9D9D9] bg-white p-5 transition hover:border-[#C8DBA8]"
    :aria-labelledby="`resource-${resource.id}`"
  >
    <div class="flex flex-wrap gap-2">
      <UBadge
        label="Ressource externe"
        color="primary"
        variant="soft"
        icon="i-lucide-globe"
      />
      <UBadge
        :label="LANGUAGE_LABELS[resource.language]"
        color="neutral"
        variant="outline"
      />
    </div>

    <h3
      :id="`resource-${resource.id}`"
      class="mt-4 font-serif text-xl font-bold text-default"
    >
      {{ resource.title }}
    </h3>
    <p class="mt-2 flex-1 text-base text-default">
      {{ resource.description }}
    </p>
    <p class="mt-4 text-sm text-muted">
      Site : {{ domain }}
    </p>

    <ULink
      :to="resource.url"
      external
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="linkLabel"
      class="mt-3 inline-flex min-h-11 items-center gap-2 self-start font-semibold text-primary underline"
    >
      Consulter la ressource
      <UIcon
        name="i-lucide-external-link"
        class="size-4"
        aria-hidden="true"
      />
    </ULink>
  </article>
</template>
