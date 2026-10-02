import type { Meta, StoryObj } from '@storybook/vue3'

const meta = {
  title: 'Components/Button',
} satisfies Meta

export default meta
type Story = StoryObj

export const Primary: Story = {
  render: () => ({
    template: '<button class="btn btn-primary" type="button">Échanger avec un senior</button>',
  }),
}

export const Secondary: Story = {
  render: () => ({
    template: '<button class="btn btn-secondary" type="button">En savoir plus</button>',
  }),
}

export const Ghost: Story = {
  render: () => ({
    template: '<button class="btn btn-ghost" type="button">Devenir mentor</button>',
  }),
}

export const Disabled: Story = {
  render: () => ({
    template: '<button class="btn btn-primary" type="button" disabled>Inscription fermée</button>',
  }),
}

export const All: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <button class="btn btn-primary" type="button">Primaire</button>
        <button class="btn btn-secondary" type="button">Secondaire</button>
        <button class="btn btn-ghost" type="button">Fantôme</button>
        <button class="btn btn-primary" type="button" disabled>Désactivé</button>
      </div>`,
  }),
}
