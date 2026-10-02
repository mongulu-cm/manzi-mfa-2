import type { Meta, StoryObj } from '@storybook/vue3'

const meta = {
  title: 'Components/Badge',
} satisfies Meta

export default meta
type Story = StoryObj

export const Status: Story = {
  render: () => ({
    template: '<span class="badge">Inscriptions ouvertes</span>',
  }),
}

export const Tag: Story = {
  render: () => ({
    template: '<span class="tag">Développement web</span>',
  }),
}
