<script setup lang="ts">
const { getLoginUrl, isAppConfigured } = useAppNavigation()
const loginUrl = computed(() => getLoginUrl())
</script>

<template>
  <UButton
    :to="loginUrl"
    :external="isAppConfigured"
    label="Se connecter"
    variant="outline"
    class="min-h-11 rounded-full border-[#3D5016] px-5 text-sm font-semibold text-[#3D5016] hover:bg-[#E6F0D6]"
  />
</template>
