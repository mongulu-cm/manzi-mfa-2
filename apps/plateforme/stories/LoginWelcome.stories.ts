import type { Meta, StoryObj } from '@storybook/vue3'
import LoginWelcome from '../app/components/auth/LoginWelcome.vue'

const meta = {
  title: 'Plateforme/Login',
  component: LoginWelcome,
  args: { siteUrl: 'https://manzi-mfa-2.mongulu.cm' },
} satisfies Meta<typeof LoginWelcome>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
