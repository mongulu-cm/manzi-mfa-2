<script setup lang="ts">
const { getLoginUrl, isAppConfigured } = useAppNavigation()
const loginUrl = computed(() => getLoginUrl())
</script>

<template>
  <UButton
    :to="loginUrl"
    :external="isAppConfigured"
    :label="isAppConfigured ? 'Se connecter' : 'Nous contacter'"
    variant="outline"
    class="min-h-11 rounded-full border-primary px-5 text-sm font-semibold text-primary hover:bg-[#E6F0D6]"
  />
</template>
