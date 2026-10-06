import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn } from 'storybook/test'
import LoginWelcome from '../app/components/auth/LoginWelcome.vue'

const meta = {
  title: 'Plateforme/Login',
  component: LoginWelcome,
  args: { siteUrl: 'https://manzi-mfa-2.mongulu.cm', onConnect: fn() },
} satisfies Meta<typeof LoginWelcome>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Continuer avec LinkedIn' }))
    await expect(args.onConnect).toHaveBeenCalledTimes(1)
  },
}
export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Continuer avec LinkedIn' })).toBeDisabled()
  },
}
export const Error: Story = { args: { error: 'La connexion a été annulée ou a expiré. Réessayez avec LinkedIn.' } }
export const Unavailable: Story = { args: { unavailable: true } }
