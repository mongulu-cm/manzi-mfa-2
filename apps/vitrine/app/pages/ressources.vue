<script setup lang="ts">
import ResourceLibrary from '../components/resources/ResourceLibrary.vue'
import { interviewResources } from '../data/interview-resources'
import { validateResources } from '../utils/interview-resources'

// Validée aussi en CI : une sélection invalide ne doit jamais être rendue.
const resources = validateResources(interviewResources)

useSeoMeta({
  title: 'Ressources pour préparer vos entretiens — Manzi-mfa',
  description: 'Une sélection de services externes recommandés par le Collectif Mongulu pour préparer vos entretiens techniques.',
})
</script>

<template>
  <article
    class="mx-auto max-w-6xl"
    aria-labelledby="resources-title"
  >
    <h1
      id="resources-title"
      class="font-serif text-3xl font-bold text-default sm:text-5xl"
    >
      Ressources pour préparer vos entretiens
    </h1>
    <p class="mt-4 max-w-3xl text-base text-muted sm:text-lg">
      Une sélection de services externes pour vous entraîner aux entretiens techniques : méthode, entretiens blancs, algorithmique, conception de systèmes, front-end, pratique et parcours.
    </p>
    <ResourceLibrary
      :resources="resources"
      class="mt-10"
    />
  </article>
</template>
