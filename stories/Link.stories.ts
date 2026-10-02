import type { Meta, StoryObj } from '@storybook/vue3'

const meta = {
  title: 'Components/Link',
} satisfies Meta

export default meta
type Story = StoryObj

export const Inline: Story = {
  render: () => ({
    template: '<p style="font-family:var(--font-sans);">Voir le <a class="link" href="#">programme de mentorat</a>.</p>',
  }),
}

export const WithBadge: Story = {
  render: () => ({
    template: '<p style="font-family:var(--font-sans);">Mentors <a class="link-badge" href="#">12 disponibles</a></p>',
  }),
}
