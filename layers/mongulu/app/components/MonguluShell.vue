<template>
  <div class="mongulu-shell mx-auto flex min-h-dvh max-w-(--ui-container) flex-col px-3 sm:px-5 lg:px-8">
    <a
      class="skip-link"
      href="#main-content"
    >Aller au contenu</a>
    <header class="flex flex-wrap items-center justify-between gap-4 border-b border-(--mongulu-divider) py-8">
      <BrandIdentity />
      <slot name="header" />
    </header>
    <main
      id="main-content"
      class="flex-1 py-22"
      tabindex="-1"
    >
      <slot />
    </main>
    <footer class="border-t border-(--mongulu-divider) py-8 text-muted">
      Un projet du Collectif Mongulu.
    </footer>
  </div>
</template>

<style scoped>
.skip-link {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 10;
  padding: 0.75rem 1rem;
  background: var(--ui-bg);
  transform: translateY(-200%);
}

.skip-link:focus {
  transform: translateY(0);
}
</style>
