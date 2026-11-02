<script setup lang="ts">
const { getLoginUrl, isAppConfigured } = useAppNavigation()
const loginUrl = computed(() => getLoginUrl())
</script>

<template>
  <div class="flex items-center gap-4">
    <ULink
      to="/ressources"
      class="inline-flex min-h-11 items-center text-sm font-semibold text-default hover:text-primary"
      active-class="text-primary underline"
    >
      Ressources
    </ULink>
    <UButton
      :to="loginUrl"
      :external="isAppConfigured"
      :label="isAppConfigured ? 'Se connecter' : 'Nous contacter'"
      variant="outline"
      class="min-h-11 rounded-full border-primary px-5 text-sm font-semibold text-primary hover:bg-[#E6F0D6]"
    />
  </div>
</template>
