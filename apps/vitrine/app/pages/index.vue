<script setup lang="ts">
import HeroSection from '../components/landing/HeroSection.vue'
import HowItWorksSection from '../components/landing/HowItWorksSection.vue'
import AudienceSection from '../components/landing/AudienceSection.vue'
import CtaSection from '../components/landing/CtaSection.vue'

useSeoMeta({
  title: 'Manzi-mfa — Le pont vers l\'emploi dans l\'IT',
  description: 'Le pont vers l\'emploi dans l\'IT grâce à un échange d\'une heure avec un senior. Rencontrez des mentors bénévoles pour booster votre carrière.',
  ogTitle: 'Manzi-mfa — Le pont vers l\'emploi dans l\'IT',
  ogDescription: 'Le pont vers l\'emploi dans l\'IT grâce à un échange d\'une heure avec un senior.',
})
</script>

<template>
  <div class="landing-page space-y-12 sm:space-y-16">
    <HeroSection />
    <HowItWorksSection />
    <AudienceSection />
    <CtaSection />
  </div>
</template>
