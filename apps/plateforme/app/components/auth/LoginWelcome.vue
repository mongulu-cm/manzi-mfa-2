<script setup lang="ts">
withDefaults(defineProps<{ siteUrl: string, loading?: boolean, unavailable?: boolean, error?: string }>(), {
  loading: false, unavailable: false, error: '',
})
const emit = defineEmits<{ connect: [] }>()
</script>

<template>
  <div class="mx-auto flex min-h-dvh w-full max-w-md flex-col px-3 py-8 sm:px-5 sm:py-13">
    <a
      href="#main-content"
      class="sr-only z-10 rounded-lg bg-default p-3 focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
    >Aller au contenu</a>
    <header class="flex flex-col items-center gap-4 text-center">
      <BrandIdentity
        :to="siteUrl"
        external
      />
      <p class="text-muted">
        Accédez à votre espace de mentorat et construisez votre avenir technologique.
      </p>
    </header>

    <main
      id="main-content"
      tabindex="-1"
      class="py-8"
      aria-labelledby="login-title"
    >
      <UCard :ui="{ root: 'bg-white ring-(--mongulu-divider)', body: 'p-5 sm:p-8' }">
        <UAuthForm :ui="{ root: 'space-y-8', body: 'gap-y-5' }">
          <template #title>
            <h1
              id="login-title"
              class="m-0 font-display text-3xl leading-tight text-default sm:text-h2"
            >
              Bienvenue
            </h1>
          </template>
          <template #description>
            Connectez-vous pour continuer
          </template>
          <template #providers>
            <UAlert
              v-if="error || unavailable"
              role="alert"
              color="error"
              variant="soft"
              :title="error || 'La connexion est momentanément indisponible. Réessayez plus tard.'"
              class="mb-5"
            />
            <UButton
              label="Continuer avec LinkedIn"
              icon="i-lucide-linkedin"
              color="neutral"
              variant="outline"
              block
              :loading="loading"
              :disabled="unavailable || loading"
              :aria-describedby="loading ? 'login-progress' : 'login-registration'"
              class="bg-white text-default"
              @click="emit('connect')"
            />
            <p
              v-if="loading"
              id="login-progress"
              role="status"
              class="mt-3 text-center text-caption text-muted"
            >
              Ouverture de LinkedIn…
            </p>
            <p
              id="login-registration"
              class="mt-3 text-center text-caption text-muted"
            >
              Votre première connexion crée automatiquement votre compte Manzi-mfa.
            </p>
          </template>
          <template #footer>
            <div class="flex items-start gap-3 rounded-lg bg-default p-4 text-left">
              <UIcon
                name="i-lucide-lock-keyhole"
                class="mt-1 size-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <p class="text-caption text-muted">
                Nous respectons votre vie privée. Nous recevons votre nom, votre photo et votre adresse e-mail
                lorsqu’ils sont fournis par LinkedIn. Aucun contenu n’est publié sur votre compte.
              </p>
            </div>
          </template>
        </UAuthForm>
      </UCard>
    </main>

    <footer class="space-y-4 text-center text-caption text-muted">
      <nav
        aria-label="Liens utiles"
        class="flex flex-wrap justify-center gap-x-4"
      >
        <ULink
          to="mailto:collectif@mongulu.cm"
          class="inline-flex min-h-11 min-w-11 items-center justify-center underline"
        >Aide</ULink>
        <ULink
          :to="`${siteUrl}/confidentialite`"
          external
          class="inline-flex min-h-11 min-w-11 items-center justify-center underline"
        >
          Confidentialité
        </ULink>
        <ULink
          :to="siteUrl"
          external
          class="inline-flex min-h-11 min-w-11 items-center justify-center underline"
        >Retour au site</ULink>
      </nav>
      <p class="mx-auto">
        Un projet du Collectif Mongulu.
      </p>
    </footer>
  </div>
</template>
