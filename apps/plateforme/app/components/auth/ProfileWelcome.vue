<script setup lang="ts">
import { safeAvatarUrl } from '../../utils/auth'

withDefaults(defineProps<{
  name?: string | null
  avatarUrl?: string | null
  email?: string
  loading?: boolean
  error?: string
  actionError?: string
  signingOut?: boolean
}>(), { name: null, avatarUrl: null, email: undefined, loading: false, error: '', actionError: '', signingOut: false })
defineEmits<{ retry: [], logout: [] }>()
</script>

<template>
  <section
    aria-labelledby="welcome-title"
    class="max-w-xl space-y-5"
  >
    <h1
      id="welcome-title"
      class="break-words"
    >
      {{ name ? `Bienvenue, ${name}` : 'Bienvenue dans votre espace' }}
    </h1>
    <p
      v-if="loading"
      role="status"
    >
      Chargement de votre profil…
    </p>
    <template v-else-if="!error">
      <UAvatar
        :src="safeAvatarUrl(avatarUrl)"
        :alt="name || 'Votre profil'"
        size="3xl"
        referrerpolicy="no-referrer"
      />
      <dl>
        <dt class="font-semibold">
          Adresse e-mail
        </dt>
        <dd class="break-all">
          {{ email || 'Adresse e-mail non disponible' }}
        </dd>
      </dl>
    </template>
    <template v-if="error">
      <UAlert
        role="alert"
        color="error"
        variant="soft"
        :title="error"
      />
      <UButton
        label="Réessayer"
        variant="outline"
        @click="$emit('retry')"
      />
    </template>
    <UAlert
      v-if="actionError"
      role="alert"
      color="error"
      variant="soft"
      :title="actionError"
    />
    <UButton
      label="Se déconnecter"
      :loading="signingOut"
      :disabled="signingOut"
      @click="$emit('logout')"
    />
  </section>
</template>
