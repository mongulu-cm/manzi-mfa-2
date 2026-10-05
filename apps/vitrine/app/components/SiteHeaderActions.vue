<script setup lang="ts">
const config = useRuntimeConfig()
const loginUrl = computed(() => new URL('/login', config.public.appUrl).href)
</script>

<template>
  <UButton
    :to="loginUrl"
    external
    label="Se connecter"
  />
</template>
