import { reactive } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn } from 'storybook/test'
import PwaInstallCard from '../app/components/PwaInstallCard.vue'

const meta = {
  title: 'Plateforme/Installation',
  component: PwaInstallCard,
  args: {
    mobile: true,
    browserName: 'Safari',
    documentationBrowserName: 'Safari',
    documentationUrl: 'https://support.apple.com/fr-fr/guide/iphone/iph42ab2f3a7/ios',
    instructions: 'Dans Safari, ouvrez Partager, puis Sur l’écran d’accueil. Activez « Ouvrir comme app web » si cette option apparaît, puis touchez Ajouter.',
    onInstall: fn(),
  },
} satisfies Meta<typeof PwaInstallCard>
export default meta
type Story = StoryObj<typeof meta>

export const NativePrompt: Story = {
  args: { available: true },
  play: async ({ canvas, userEvent, args }) => {
    canvas.getByRole('button', { name: 'Installer l’application' }).focus()
    await userEvent.keyboard('{Enter}')
    await expect(args.onInstall).toHaveBeenCalledTimes(1)
  },
}
export const SafariHelp: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole('button', { name: 'Installer l’application' })
    await userEvent.click(button)
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByRole('status')).toHaveTextContent('Dans Safari, ouvrez Partager')
    await expect(canvas.getByRole('link', { name: /Consulter la procédure officielle/ })).toHaveAttribute('href', args.documentationUrl)
    await expect(args.onInstall).not.toHaveBeenCalled()
    await userEvent.click(button)
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument()
  },
}
export const Installing: Story = {
  args: { busy: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Installer l’application' })).toBeDisabled()
  },
}
export const Installed: Story = {
  args: { installed: true },
  render: args => ({
    components: { PwaInstallCard },
    setup: () => ({ args }),
    template: '<main><h1>Votre espace</h1><PwaInstallCard v-bind="args" /></main>',
  }),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}
export const Desktop: Story = {
  ...Installed,
  args: { mobile: false },
}
export const Error: Story = {
  args: { error: 'L’installation n’a pas pu démarrer. Utilisez le menu de votre navigateur.' },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('L’installation n’a pas pu démarrer.')
    await expect(canvas.getByRole('status')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Installer l’application' }))
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument()
  },
}

export const HelpClearsAfterNewPrompt: Story = {
  args: { help: true },
  render: args => ({
    components: { PwaInstallCard },
    setup() {
      const state = reactive({ ...args })
      function acceptNewPrompt() {
        state.help = false
        state.error = ''
        state.available = false
      }
      function offerNewPrompt() {
        state.available = true
      }
      return { state, acceptNewPrompt, offerNewPrompt }
    },
    template: '<div><PwaInstallCard v-bind="state" /><button type="button" @click="acceptNewPrompt">Simuler une nouvelle installation acceptée</button><button type="button" @click="offerNewPrompt">Simuler une nouvelle proposition</button></div>',
  }),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('status')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Simuler une nouvelle installation acceptée' }))
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Installer l’application' })).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(canvas.getByRole('button', { name: 'Installer l’application' }))
    await expect(canvas.getByRole('status')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Simuler une nouvelle proposition', exact: true }))
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Simuler une nouvelle installation acceptée' }))
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument()
  },
}
