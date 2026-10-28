import { reactive } from 'vue'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function detectedBrowserName(edge: boolean, firefox: boolean, chrome: boolean, ios: boolean) {
  if (edge) return 'Edge'
  if (firefox) return 'Firefox'
  if (chrome) return 'Chrome'
  return ios ? 'Safari' : 'votre navigateur'
}

function installationGuidance(ios: boolean, browserName: string) {
  if (ios) {
    return {
      documentationUrl: 'https://support.apple.com/fr-fr/guide/iphone/iph42ab2f3a7/ios',
      instructions: browserName === 'Safari'
        ? 'Dans Safari, touchez Partager, puis Sur l’écran d’accueil et Ajouter.'
        : `Pour installer depuis ${browserName} sur iPhone ou iPad, ouvrez cette page dans Safari, puis Partager → Sur l’écran d’accueil → Ajouter.`,
    }
  }
  if (browserName === 'Firefox') {
    return {
      documentationUrl: 'https://support.mozilla.org/en-US/kb/use-web-apps-firefox-android',
      instructions: 'Dans Firefox, ouvrez le menu ⋮, puis Installer. Confirmez l’ajout sur l’écran d’accueil.',
    }
  }
  if (browserName === 'Edge') {
    return {
      documentationUrl: 'https://support.microsoft.com/fr-fr/microsoft-edge',
      instructions: 'Edge n’a pas proposé d’installation directe. Consultez son aide pour les options disponibles sur votre téléphone.',
    }
  }
  return {
    documentationUrl: 'https://support.google.com/chrome/answer/9658361?hl=fr&co=GENIE.Platform%3DAndroid',
    instructions: 'Dans Chrome, ouvrez le menu ⋮, puis Ajouter à l’écran d’accueil → Installer. Si cette option est absente, l’installation n’est pas disponible pour cette page dans ce navigateur.',
  }
}

export function createPwaInstaller(browser: Window) {
  const displayMode = browser.matchMedia('(display-mode: standalone)')
  const navigator = browser.navigator as Navigator & { standalone?: boolean }
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const android = /Android/.test(navigator.userAgent)
  const mobile = ios || android
  const firefox = /Firefox|FxiOS/.test(navigator.userAgent)
  const edge = /EdgA|EdgiOS/.test(navigator.userAgent)
  const chrome = /Chrome|CriOS/.test(navigator.userAgent)
  const browserName = detectedBrowserName(edge, firefox, chrome, ios)
  const { instructions, documentationUrl } = installationGuidance(ios, browserName)
  const state = reactive({
    mobile,
    browserName,
    documentationUrl,
    help: false,
    available: false,
    installed: displayMode.matches || navigator.standalone === true,
    busy: false,
    error: '',
    instructions,
  })
  let pending: InstallPromptEvent | null = null

  function offer(event: Event) {
    if (!state.mobile || state.installed) return
    event.preventDefault()
    pending = event as InstallPromptEvent
    state.available = true
    state.error = ''
    state.help = false
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
    if (!pending || state.busy || state.installed || !state.mobile) return
    const event = pending
    pending = null
    state.available = false
    state.busy = true
    state.error = ''
    try {
      await event.prompt()
      // L’acceptation de la fenêtre ne garantit pas que l’installation soit terminée.
      const choice = await event.userChoice
      state.help = choice.outcome === 'dismissed'
    }
    catch {
      state.error = 'Le navigateur n’a pas ouvert l’installation. Consultez la procédure ci-dessous.'
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
