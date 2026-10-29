import { describe, expect, it, vi } from 'vitest'
import { createPwaInstaller } from '../../apps/plateforme/app/utils/pwa-install'

function environment(navigator = { userAgent: 'Chrome Android', platform: 'Linux', maxTouchPoints: 0, standalone: false }, standalone = false) {
  const media = Object.assign(new EventTarget(), { matches: standalone })
  const browser = Object.assign(new EventTarget(), { navigator, matchMedia: () => media })
  const installer = createPwaInstaller(browser as unknown as Window)
  return { browser, media, installer }
}

function proposal(prompt = vi.fn().mockResolvedValue(undefined), userChoice = Promise.resolve({ outcome: 'dismissed' as 'dismissed' | 'accepted' })) {
  return Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt, userChoice })
}

const guides = {
  chromeAndroid: 'https://support.google.com/chrome/answer/9658361?hl=fr&co=GENIE.Platform%3DAndroid',
  chromeIOS: 'https://support.google.com/chrome/answer/9658361?hl=fr&co=GENIE.Platform%3DiOS',
  firefoxAndroid: 'https://support.mozilla.org/en-US/kb/use-web-apps-firefox-android',
  firefoxIOS: 'https://support.mozilla.org/en-US/kb/add-website-shortcut-your-home-screen-ios',
  safari: 'https://support.apple.com/fr-fr/guide/iphone/iphea86e5236/ios',
} as const

describe('installation de la PWA', () => {
  it.each([
    ['iPhone Safari', 'iPhone', 1, true, 'Safari', 'support.apple.com', 'Dans Safari, touchez Partager', 'Safari', guides.safari],
    ['FxiOS iPhone', 'iPhone', 1, true, 'Firefox', 'support.mozilla.org', 'Dans Firefox sur iPhone ou iPad, touchez Partager', 'Firefox', guides.firefoxIOS],
    ['CriOS iPhone', 'iPhone', 1, true, 'Chrome', 'support.google.com', 'Dans Chrome sur iPhone ou iPad, touchez Partager', 'Chrome', guides.chromeIOS],
    ['EdgiOS iPhone', 'iPhone', 1, true, 'Edge', 'support.apple.com', 'Ouvrez cette page dans Safari', 'Safari', guides.safari],
    ['Safari iPad', 'MacIntel', 5, true, 'Safari', 'support.apple.com', 'Dans Safari, touchez Partager', 'Safari', guides.safari],
    ['Safari desktop', 'MacIntel', 0, false, 'votre navigateur', 'support.google.com', 'Ouvrez cette page dans Chrome sur Android', 'Chrome', guides.chromeAndroid],
    ['Firefox Android', 'Linux', 1, true, 'Firefox', 'support.mozilla.org', 'Dans Firefox sur Android, ouvrez le menu ⋮', 'Firefox', guides.firefoxAndroid],
    ['Chrome Android', 'Linux', 1, true, 'Chrome', 'support.google.com', 'Installer et créer un raccourci → Installer', 'Chrome', guides.chromeAndroid],
    ['EdgA Android', 'Linux', 1, true, 'Edge', 'support.google.com', 'Ouvrez cette page dans Chrome sur Android', 'Chrome', guides.chromeAndroid],
    ['Chrome desktop', 'Linux', 0, false, 'Chrome', 'support.google.com', 'Installer et créer un raccourci → Installer', 'Chrome', guides.chromeAndroid],
    ['Chrome Android SamsungBrowser/26.0', 'Linux', 1, true, 'votre navigateur', 'support.google.com', 'Ouvrez cette page dans Chrome sur Android', 'Chrome', guides.chromeAndroid],
    ['Chrome Android OPR/85.0', 'Linux', 1, true, 'votre navigateur', 'support.google.com', 'Ouvrez cette page dans Chrome sur Android', 'Chrome', guides.chromeAndroid],
    ['Unknown Android', 'Linux', 1, true, 'votre navigateur', 'support.google.com', 'Ouvrez cette page dans Chrome sur Android', 'Chrome', guides.chromeAndroid],
  ])('détecte mobile et navigateur : %s', (userAgent, platform, maxTouchPoints, mobile, browserName, documentationHost, instructions, documentationBrowserName, documentationUrl) => {
    const { installer } = environment({ userAgent, platform, maxTouchPoints, standalone: false })
    expect(installer.state.mobile).toBe(mobile)
    expect(installer.state.browserName).toBe(browserName)
    expect(new URL(installer.state.documentationUrl).host).toBe(documentationHost)
    expect(installer.state.instructions).toContain(instructions)
    expect(installer.state.documentationBrowserName).toBe(documentationBrowserName)
    expect(installer.state.documentationUrl).toBe(documentationUrl)
    installer.dispose()
  })

  it.each(['Chrome Android SamsungBrowser/26.0', 'Chrome Android OPR/85.0', 'Unknown Android'])('permet la proposition native fournie par %s', async (userAgent) => {
    const { installer, browser } = environment({ userAgent, platform: 'Linux', maxTouchPoints: 1, standalone: false })
    const event = proposal()
    browser.dispatchEvent(event)
    await installer.install()
    expect(event.defaultPrevented).toBe(true)
    expect(event.prompt).toHaveBeenCalledTimes(1)
    installer.dispose()
  })

  it('ne capture pas la proposition d’installation sur desktop', async () => {
    const { installer, browser } = environment({ userAgent: 'Chrome desktop', platform: 'Linux', maxTouchPoints: 0, standalone: false })
    const event = proposal()
    browser.dispatchEvent(event)
    await installer.install()
    expect(event.defaultPrevented).toBe(false)
    expect(event.prompt).not.toHaveBeenCalled()
    expect(installer.state.available).toBe(false)
    installer.dispose()
  })

  it('attend un clic, consomme chaque proposition une seule fois et autorise une nouvelle proposition après refus', async () => {
    const { browser, installer } = environment()
    await installer.install()
    expect(installer.state.available).toBe(false)
    const event = proposal()
    browser.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(installer.state.available).toBe(true)
    expect(event.prompt).not.toHaveBeenCalled()
    await installer.install()
    expect(installer.state.help).toBe(true)
    expect(event.prompt).toHaveBeenCalledTimes(1)
    expect(installer.state.available).toBe(false)
    expect(installer.state.busy).toBe(false)
    await installer.install()
    expect(event.prompt).toHaveBeenCalledTimes(1)
    const accepted = proposal(vi.fn().mockResolvedValue(undefined), Promise.resolve({ outcome: 'accepted' }))
    browser.dispatchEvent(accepted)
    await installer.install()
    expect(installer.state.installed).toBe(false)
    browser.dispatchEvent(new Event('appinstalled'))
    expect(installer.state.installed).toBe(true)
    expect(installer.state.available).toBe(false)
    installer.dispose()
  })

  it('sérialise deux propositions reçues pendant que la fenêtre native est ouverte', async () => {
    const { browser, installer } = environment()
    let finish!: (value: { outcome: 'dismissed' }) => void
    const first = proposal(vi.fn().mockResolvedValue(undefined), new Promise((resolve) => {
      finish = resolve
    }))
    browser.dispatchEvent(first)
    const running = installer.install()
    expect(installer.state.busy).toBe(true)
    const second = proposal()
    browser.dispatchEvent(second)
    await installer.install()
    expect(second.prompt).not.toHaveBeenCalled()
    finish({ outcome: 'dismissed' })
    await running
    await installer.install()
    expect(second.prompt).toHaveBeenCalledTimes(1)
    installer.dispose()
  })

  it('récupère une erreur native et efface le message à la proposition suivante', async () => {
    const { browser, installer } = environment()
    browser.dispatchEvent(proposal(vi.fn().mockRejectedValue(new Error('private browser detail'))))
    await installer.install()
    expect(installer.state.error).toContain('Consultez la procédure ci-dessous')
    expect(installer.state.error).not.toContain('private browser detail')
    expect(installer.state.busy).toBe(false)
    browser.dispatchEvent(proposal())
    expect(installer.state.error).toBe('')
    installer.dispose()
  })

  it.each([false, true])('détecte le mode autonome et ses changements (initial=%s)', (initial) => {
    const { media, installer, browser } = environment(undefined, initial)
    expect(installer.state.installed).toBe(initial)
    media.matches = !initial
    media.dispatchEvent(new Event('change'))
    expect(installer.state.installed).toBe(!initial)
    browser.navigator.standalone = true
    media.matches = false
    media.dispatchEvent(new Event('change'))
    expect(installer.state.installed).toBe(true)
    installer.dispose()
  })

  it('n’ouvre aucune fenêtre dans une application iOS autonome et libère ses écouteurs', async () => {
    const { browser, media, installer } = environment({ userAgent: 'iPhone', platform: 'iPhone', maxTouchPoints: 1, standalone: true })
    expect(installer.state.installed).toBe(true)
    const event = proposal()
    browser.dispatchEvent(event)
    await installer.install()
    expect(event.prompt).not.toHaveBeenCalled()
    installer.dispose()
    browser.navigator.standalone = false
    media.dispatchEvent(new Event('change'))
    expect(installer.state.installed).toBe(true)
    const ignored = proposal()
    browser.dispatchEvent(ignored)
    expect(ignored.defaultPrevented).toBe(false)
    browser.dispatchEvent(new Event('appinstalled'))
    expect(installer.state.available).toBe(false)
  })
})
