import { reactive } from 'vue'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function createPwaInstaller(browser: Window) {
  const displayMode = browser.matchMedia('(display-mode: standalone)')
  const navigator = browser.navigator as Navigator & { standalone?: boolean }
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const instructions = ios
    ? 'Dans Safari, ouvrez Partager, puis Sur l’écran d’accueil. Activez « Ouvrir comme app web » si cette option apparaît, puis touchez Ajouter.'
    : /Android/.test(navigator.userAgent)
      ? 'Ouvrez le menu de votre navigateur (⋮), puis Installer l’application ou Ajouter à l’écran d’accueil. Si aucune option n’apparaît, essayez Chrome ou Firefox.'
      : 'Cherchez Installer l’application dans le menu ou la barre d’adresse de Chrome ou Edge. Dans Safari sur Mac, utilisez Fichier → Ajouter au Dock si disponible.'
  const state = reactive({
    available: false,
    installed: displayMode.matches || navigator.standalone === true,
    busy: false,
    error: '',
    instructions,
  })
  let pending: InstallPromptEvent | null = null

  function offer(event: Event) {
    event.preventDefault()
    pending = event as InstallPromptEvent
    state.available = true
    state.error = ''
  }
  function installed() {
    pending = null
    state.available = false
    state.installed = true
  }
  function displayChanged() {
    state.installed = displayMode.matches || navigator.standalone === true
  }
  async function install() {
    if (!pending || state.busy || state.installed) return
    const event = pending
    pending = null
    state.available = false
    state.busy = true
    state.error = ''
    try {
      await event.prompt()
      // L’acceptation de la fenêtre ne garantit pas que l’installation soit terminée.
      await event.userChoice
    }
    catch {
      state.error = 'L’installation n’a pas pu démarrer. Utilisez le menu de votre navigateur.'
    }
    finally {
      state.busy = false
    }
  }

  browser.addEventListener('beforeinstallprompt', offer)
  browser.addEventListener('appinstalled', installed)
  displayMode.addEventListener('change', displayChanged)
  function dispose() {
    browser.removeEventListener('beforeinstallprompt', offer)
    browser.removeEventListener('appinstalled', installed)
    displayMode.removeEventListener('change', displayChanged)
  }
  return { state, install, dispose }
}
