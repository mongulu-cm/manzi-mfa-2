<script setup lang="ts">
const auth = useAuth()
const analytics = useAnalytics()
useSeoMeta({ title: 'Connexion en cours — Manzi-mfa' })

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  // Ne conserver ni code OAuth ni description fournisseur dans l’historique.
  window.history.replaceState(window.history.state, '', '/auth/callback')
  const success = await auth.completeCallback(params)
  if (['code', 'error'].some(key => params.has(key))) analytics.track(success ? 'auth.login_succeeded' : 'auth.login_failed')
  await navigateTo(success ? '/' : '/login', { replace: true })
})
</script>

<template>
  <section
    aria-labelledby="callback-title"
    aria-busy="true"
  >
    <h1 id="callback-title">
      Connexion en cours
    </h1>
    <p role="status">
      Nous préparons votre espace Manzi-mfa…
    </p>
  </section>
</template>
