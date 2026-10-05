import type { Meta, StoryObj } from '@storybook/vue3'
import BrandIdentity from '../app/components/brand/BrandIdentity.vue'

const meta = {
  title: 'Brand/Identity',
  component: BrandIdentity,
  args: { to: '/' },
} satisfies Meta<typeof BrandIdentity>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const External: Story = {
  args: { to: 'https://manzi-mfa-2.mongulu.cm', external: true },
}
