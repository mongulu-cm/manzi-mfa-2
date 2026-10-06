<script setup lang="ts">
withDefaults(defineProps<{ siteUrl: string, loading?: boolean, unavailable?: boolean, error?: string }>(), {
  loading: false, unavailable: false, error: '',
})
const emit = defineEmits<{ connect: [] }>()
</script>

<template>
  <section aria-labelledby="login-title">
    <h1 id="login-title">
      Se connecter
    </h1>
    <p>Bienvenue dans votre espace Manzi-mfa.</p>
    <p class="text-muted">
      Connectez-vous avec LinkedIn. Votre première connexion crée automatiquement votre compte Manzi-mfa.
    </p>
    <UAlert
      v-if="error || unavailable"
      role="alert"
      color="error"
      variant="soft"
      :title="error || 'La connexion est momentanément indisponible. Réessayez plus tard.'"
      class="my-5 max-w-xl"
    />
    <UButton
      label="Continuer avec LinkedIn"
      :loading="loading"
      :disabled="unavailable || loading"
      class="my-5"
      @click="emit('connect')"
    />
    <p class="max-w-xl text-muted">
      Nous recevons votre nom, votre photo et votre adresse e-mail lorsqu’ils sont fournis par LinkedIn.
      Consultez notre
      <ULink
        :to="`${siteUrl}/confidentialite`"
        external
        class="text-primary underline"
      >politique de confidentialité</ULink>.
    </p>
    <UButton
      :to="siteUrl"
      external
      label="Retour au site"
      variant="outline"
      class="mt-5"
    />
  </section>
</template>
