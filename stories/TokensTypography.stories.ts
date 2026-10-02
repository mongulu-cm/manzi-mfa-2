import type { Meta, StoryObj } from '@storybook/vue3'

const meta = {
  title: 'Tokens/Typography',
} satisfies Meta

export default meta
type Story = StoryObj

export const Scale: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:20px;">
        <div><h1 style="margin:0;font-family:var(--font-display);font-size:var(--text-display-size);line-height:var(--text-display-height);font-weight:var(--text-weight-heading);">Display 62px</h1></div>
        <div><h2 style="margin:0;font-family:var(--font-display);font-size:var(--text-h2-size);line-height:var(--text-h2-height);font-weight:var(--text-weight-heading);">Heading 45px</h2></div>
        <div><h3 style="margin:0;font-family:var(--font-display);font-size:var(--text-h3-size);line-height:var(--text-h3-height);font-weight:var(--text-weight-heading);">Subheading 22px</h3></div>
        <p style="margin:0;font-family:var(--font-sans);font-size:var(--text-body-size);line-height:var(--text-body-height);">Body 16px — Le pont vers l'emploi dans l'IT grâce à un échange d'une heure avec un senior.</p>
        <p style="margin:0;font-family:var(--font-sans);font-size:var(--text-body-size);line-height:var(--text-body-height);font-weight:var(--text-weight-strong);">Body semibold 16px/600</p>
        <small style="font-family:var(--font-sans);font-size:var(--text-caption-size);line-height:var(--text-caption-height);">Caption 13px — métadonnées</small>
      </div>`,
  }),
}

export const Spacing: Story = {
  render: () => ({
    template: `
      <div style="font-family:var(--font-sans);display:flex;flex-direction:column;gap:8px;">
        <div><span style="display:inline-block;width:4px;height:16px;background:var(--color-primary);"></span> --space-1 · 4px</div>
        <div><span style="display:inline-block;width:8px;height:16px;background:var(--color-primary);"></span> --space-2 · 8px</div>
        <div><span style="display:inline-block;width:12px;height:16px;background:var(--color-primary);"></span> --space-3 · 12px</div>
        <div><span style="display:inline-block;width:16px;height:16px;background:var(--color-primary);"></span> --space-4 · 16px</div>
        <div><span style="display:inline-block;width:20px;height:16px;background:var(--color-primary);"></span> --space-5 · 20px</div>
        <div><span style="display:inline-block;width:32px;height:16px;background:var(--color-primary);"></span> --space-8 · 32px</div>
        <div><span style="display:inline-block;width:52px;height:16px;background:var(--color-primary);"></span> --space-13 · 52px</div>
        <div><span style="display:inline-block;width:88px;height:16px;background:var(--color-primary);"></span> --space-22 · 88px</div>
        <div><span style="display:inline-block;width:160px;height:16px;background:var(--color-primary);"></span> --space-40 · 160px</div>
      </div>`,
  }),
}
