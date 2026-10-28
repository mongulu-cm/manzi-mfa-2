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

function iosInstallationGuidance(browserName: string) {
  if (browserName === 'Chrome') {
    return {
      documentationBrowserName: 'Chrome',
      documentationUrl: 'https://support.google.com/chrome/answer/9658361?hl=fr&co=GENIE.Platform%3DiOS',
      instructions: 'Dans Chrome sur iPhone ou iPad, touchez Partager à droite de la barre d’adresse, puis Ajouter à l’écran d’accueil. Vérifiez le nom, puis touchez Ajouter.',
    }
  }
  if (browserName === 'Firefox') {
    return {
      documentationBrowserName: 'Firefox',
      documentationUrl: 'https://support.mozilla.org/en-US/kb/add-website-shortcut-your-home-screen-ios',
      instructions: 'Dans Firefox sur iPhone ou iPad, touchez Partager dans la barre d’adresse, puis ajoutez le site à l’écran d’accueil. Vérifiez le nom, puis touchez Ajouter.',
    }
  }
  return {
    documentationBrowserName: 'Safari',
    documentationUrl: 'https://support.apple.com/fr-fr/guide/iphone/iphea86e5236/ios',
    instructions: (browserName === 'Safari' ? '' : 'Ouvrez cette page dans Safari pour utiliser cette procédure. ')
      + 'Dans Safari, touchez Partager (via le menu de la page si nécessaire), puis Sur l’écran d’accueil. Activez Ouvrir comme app web si cette option apparaît, puis touchez Ajouter.',
  }
}

function installationGuidance(ios: boolean, browserName: string) {
  if (ios) return iosInstallationGuidance(browserName)
  if (browserName === 'Firefox') {
    return {
      documentationBrowserName: 'Firefox',
      documentationUrl: 'https://support.mozilla.org/en-US/kb/use-web-apps-firefox-android',
      instructions: 'Dans Firefox sur Android, ouvrez le menu ⋮ et choisissez l’ajout de l’app à l’écran d’accueil. Dans le panneau Android, touchez Ajouter automatiquement ou faites glisser l’icône sur l’écran d’accueil.',
    }
  }
  return {
    documentationBrowserName: 'Chrome',
    documentationUrl: 'https://support.google.com/chrome/answer/9658361?hl=fr&co=GENIE.Platform%3DAndroid',
    instructions: (browserName === 'Chrome' ? '' : 'Ouvrez cette page dans Chrome sur Android pour utiliser cette procédure. ')
      + 'Dans Chrome sur Android, ouvrez ⋮ → Installer et créer un raccourci → Installer, puis suivez les instructions à l’écran.',
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
    && !/SamsungBrowser|OPR|Opera|YaBrowser|Vivaldi|HuaweiBrowser|DuckDuckGo/.test(navigator.userAgent)
  const browserName = detectedBrowserName(edge, firefox, chrome, ios)
  const { instructions, documentationUrl, documentationBrowserName } = installationGuidance(ios, browserName)
  const state = reactive({
    mobile,
    browserName,
    documentationUrl,
    documentationBrowserName,
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
