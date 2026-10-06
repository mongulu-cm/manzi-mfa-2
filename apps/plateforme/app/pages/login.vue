<script setup lang="ts">
const config = useRuntimeConfig()
const auth = useAuth()
const connect = () => auth.startLogin(window.location.origin)
await auth.initialize()
watch(() => auth.state.user, (user) => {
  if (user) void navigateTo('/', { replace: true })
}, { immediate: true })

useSeoMeta({ title: 'Se connecter — Manzi-mfa', robots: 'noindex, nofollow' })
</script>

<template>
  <AuthLoginWelcome
    :site-url="config.public.siteUrl"
    :loading="auth.state.signingIn"
    :unavailable="!auth.state.configured"
    :error="auth.state.actionError || auth.state.sessionError"
    @connect="connect"
  />
</template>
