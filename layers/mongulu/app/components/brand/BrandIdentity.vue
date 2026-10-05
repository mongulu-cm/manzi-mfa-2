<script setup lang="ts">
withDefaults(defineProps<{
  to?: string
  external?: boolean
}>(), { to: '/', external: false })
</script>

<template>
  <NuxtLink
    :to="to"
    :external="external"
    class="inline-flex min-h-11 items-center gap-4 font-semibold text-default"
    aria-label="Manzi-mfa — accueil"
  >
    <img
      src="/logo.png"
      alt="Collectif Mongulu"
      width="64"
      height="64"
      class="shrink-0 object-contain"
    >
    <span>Manzi-mfa</span>
  </NuxtLink>
</template>
