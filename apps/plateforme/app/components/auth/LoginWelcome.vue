<script setup lang="ts">
defineProps<{ siteUrl: string }>()
</script>

<template>
  <section aria-labelledby="login-title">
    <h1 id="login-title">
      Se connecter
    </h1>
    <p>Bienvenue dans votre espace Manzi-mfa.</p>
    <p class="text-muted">
      La connexion sera bientôt disponible. Vous pourrez retrouver ici vos échanges avec les seniors du collectif.
    </p>
    <UButton
      :to="siteUrl"
      external
      label="Retour au site"
      class="mt-5"
    />
  </section>
</template>
