<template>
  <MonguluShell>
    <template #header>
      <SiteHeaderActions />
    </template>
    <slot />
    <template #footer>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <span>Un projet du Collectif Mongulu.</span>
        <ULink
          to="/confidentialite"
          class="inline-flex min-h-11 items-center text-primary underline"
        >
          Politique de confidentialité
        </ULink>
      </div>
    </template>
  </MonguluShell>
</template>
