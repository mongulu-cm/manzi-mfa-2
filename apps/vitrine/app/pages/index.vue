<script setup lang="ts">
import HeroSection from '../components/landing/HeroSection.vue'
import HowItWorksSection from '../components/landing/HowItWorksSection.vue'
import FeaturedMentorsSection from '../components/landing/FeaturedMentorsSection.vue'
import CommunityVerbatimSection from '../components/landing/CommunityVerbatimSection.vue'

useSeoMeta({
  title: 'Manzi-mfa — Trouvez le mentor tech qui vous aidera à avancer',
  description: 'Accélérez votre carrière grâce à des échanges de 15-30 minutes avec des professionnels chevronnés de la tech africaine et de sa diaspora.',
  ogTitle: 'Manzi-mfa — Trouvez le mentor tech qui vous aidera à avancer',
  ogDescription: 'Accélérez votre carrière grâce à des échanges de 15-30 minutes avec des professionnels chevronnés.',
})
</script>

<template>
  <div class="landing-page space-y-12 sm:space-y-16">
    <HeroSection />
    <HowItWorksSection />
    <FeaturedMentorsSection />
    <CommunityVerbatimSection />
  </div>
</template>
