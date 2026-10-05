<script setup lang="ts">
const config = useRuntimeConfig()

useSeoMeta({ title: 'Se connecter — Manzi-mfa', robots: 'noindex, nofollow' })
</script>

<template>
  <AuthLoginWelcome :site-url="config.public.siteUrl" />
</template>
