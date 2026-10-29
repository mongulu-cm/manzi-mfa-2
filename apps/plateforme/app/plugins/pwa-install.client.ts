import { createPwaInstaller } from '../utils/pwa-install'

export default defineNuxtPlugin(() => {
  const pwaInstall = createPwaInstaller(window)
  if (import.meta.hot) import.meta.hot.dispose(pwaInstall.dispose)
  return { provide: { pwaInstall } }
})
