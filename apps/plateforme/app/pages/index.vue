<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const auth = useAuth()
useSeoMeta({ title: 'Votre espace — Manzi-mfa' })
watch(() => auth.state.user?.id, (id) => {
  if (id) void auth.loadProfile()
  else if (!auth.state.sessionError) void navigateTo('/login', { replace: true })
}, { immediate: true })
async function logout() {
  if (await auth.logout()) await navigateTo('/login', { replace: true })
}
async function retry() {
  await auth.retrySession()
  if (!auth.state.user && !auth.state.sessionError) await navigateTo('/login', { replace: true })
}
</script>

<template>
  <section
    v-if="auth.state.sessionError"
    class="max-w-xl space-y-5"
  >
    <h1>Votre espace</h1>
    <UAlert
      role="alert"
      color="error"
      variant="soft"
      :title="auth.state.sessionError"
    />
    <UButton
      label="Réessayer"
      @click="retry"
    />
  </section>
  <AuthProfileWelcome
    v-else
    :name="auth.state.profile?.display_name"
    :avatar-url="auth.state.profile?.avatar_url"
    :email="auth.state.user?.email"
    :loading="auth.state.profileLoading"
    :error="auth.state.profileError"
    :action-error="auth.state.actionError"
    :signing-out="auth.state.signingOut"
    @retry="auth.loadProfile"
    @logout="logout"
  />
</template>
