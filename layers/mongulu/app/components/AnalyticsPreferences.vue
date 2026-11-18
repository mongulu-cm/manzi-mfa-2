<script setup lang="ts">
const config = useRuntimeConfig().public
const choice = useState<string>('analytics-consent', () => '')
const app = useNuxtApp()
</script>

<template>
  <ClientOnly v-if="config.posthogKey">
    <AnalyticsConsent
      :choice="choice"
      @choose="app.$setAnalyticsConsent"
    />
  </ClientOnly>
</template>
