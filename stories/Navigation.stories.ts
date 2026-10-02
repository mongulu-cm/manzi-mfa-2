import type { Meta, StoryObj } from '@storybook/vue3'

const meta = {
  title: 'Components/Navigation',
} satisfies Meta

export default meta
type Story = StoryObj

export const Bar: Story = {
  render: () => ({
    template: `
      <nav class="nav">
        <span style="font-weight:600;">Manzi-mfa</span>
        <div style="display:flex;gap:24px;">
          <a class="nav-link" href="#" aria-current="page">Accueil</a>
          <a class="nav-link" href="#">Mentors</a>
          <a class="nav-link" href="#">Contact</a>
        </div>
      </nav>`,
  }),
}

export const Pill: Story = {
  render: () => ({
    template: '<a class="nav-pill" href="#">Cohorte 2026</a>',
  }),
}
