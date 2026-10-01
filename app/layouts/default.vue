<template>
  <div class="site-shell">
    <a
      class="skip-link"
      href="#main-content"
    >Aller au contenu</a>
    <header class="site-header">
      <NuxtLink
        to="/"
        class="brand"
        aria-label="Manzi-mfa — accueil"
      >
        <img
          src="/logo.png"
          alt="Collectif Mongulu"
          width="64"
          height="64"
        >
        <span>Manzi-mfa</span>
      </NuxtLink>
    </header>
    <main
      id="main-content"
      class="site-main"
      tabindex="-1"
    >
      <slot />
    </main>
    <footer class="site-footer">
      Un projet du Collectif Mongulu.
    </footer>
  </div>
</template>
