<template>
  <MonguluShell>
    <template #header>
      <SiteHeaderActions />
    </template>
    <slot />
    <template #footer>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <span>Un projet du Collectif Mongulu.</span>
        <div class="flex flex-wrap gap-x-6">
          <ULink
            to="/ressources"
            class="inline-flex min-h-11 items-center text-primary underline"
          >
            Ressources d’entretien
          </ULink>
          <ULink
            to="/confidentialite"
            class="inline-flex min-h-11 items-center text-primary underline"
          >
            Politique de confidentialité
          </ULink>
        </div>
      </div>
    </template>
  </MonguluShell>
</template>
