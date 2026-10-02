import type { Meta, StoryObj } from '@storybook/vue3'

const meta = {
  title: 'Components/Card',
} satisfies Meta

export default meta
type Story = StoryObj

export const Standard: Story = {
  render: () => ({
    template: `
      <div class="card" style="max-width:320px;">
        <h3 style="margin:0 0 8px;font-family:var(--font-display);font-size:var(--text-h3-size);">Mentorat 1:1</h3>
        <p style="margin:0;">Une heure d'échange avec un senior IT pour construire ton parcours.</p>
      </div>`,
  }),
}

export const Hero: Story = {
  render: () => ({
    template: `
      <div class="card-hero">
        <h2 style="margin:0 0 16px;font-family:var(--font-display);font-size:var(--text-h2-size);">Le pont vers l'emploi dans l'IT</h2>
        <p style="margin:0;">Un échange d'une heure avec un senior pour lancer ta carrière.</p>
      </div>`,
  }),
}

export const Image: Story = {
  render: () => ({
    template: `
      <div class="card card-image" style="max-width:320px;">
        <img src="/logo.png" alt="Collectif Mongulu" />
        <h3 style="margin:8px 0;font-family:var(--font-display);font-size:var(--text-h3-size);">Collectif Mongulu</h3>
        <p style="margin:0;">Communauté, croissance, impact.</p>
      </div>`,
  }),
}
