import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn } from 'storybook/test'
import ProfileWelcome from '../app/components/auth/ProfileWelcome.vue'

const meta = {
  title: 'Plateforme/Profil', component: ProfileWelcome,
  args: { name: 'Membre du collectif', email: 'membre@example.invalid', onRetry: fn(), onLogout: fn() },
} satisfies Meta<typeof ProfileWelcome>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Se déconnecter' }))
    await expect(args.onLogout).toHaveBeenCalledTimes(1)
  },
}
export const Loading: Story = { args: { loading: true } }
export const MissingData: Story = { args: { name: null, email: undefined } }
export const LongData: Story = { args: { name: 'Un membre du collectif avec un nom particulièrement long et plusieurs prénoms', email: 'une.adresse.particulierement.longue.pour.verifier.le.retoursurmobile@example.invalid' } }
export const Error: Story = {
  args: { error: 'Impossible de charger votre profil. Vous pouvez réessayer sans vous reconnecter.' },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Réessayer' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}
export const SigningOut: Story = { args: { signingOut: true } }
export const LogoutError: Story = { args: { actionError: 'La déconnexion a échoué. Vérifiez votre connexion et réessayez.' } }
