<template>
  <MonguluShell>
    <slot />
    <PwaInstallCard
      v-bind="$pwaInstall.state"
      class="mt-8 max-w-xl"
      @install="$pwaInstall.install"
    />
  </MonguluShell>
</template>
