import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from 'storybook/test'

const meta = {
  title: 'Tokens/Typography',
} satisfies Meta

export default meta
type Story = StoryObj

export const Scale: Story = {
  render: () => ({
    template: `
      <div class="flex flex-col gap-5 font-sans">
        <h1 class="font-display font-bold" style="margin:0;font-size:var(--text-display);line-height:var(--text-display--line-height)">Display 62px</h1>
        <h2 class="m-0 font-display text-h2 font-bold">Heading 45px</h2>
        <h3 class="m-0 font-display text-h3 font-bold">Subheading 22px</h3>
        <p class="m-0 text-base/relaxed">Body 16px — Le pont vers l'emploi dans l'IT grâce à un échange d'une heure avec un senior.</p>
        <p class="m-0 text-base/relaxed font-semibold">Body semibold 16px/600</p>
        <small class="text-caption">Caption 13px — métadonnées</small>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('Display 62px')).toBeInTheDocument()
  },
}

export const Spacing: Story = {
  render: () => ({
    template: `
      <div class="font-sans flex flex-col gap-2">
        <div><span class="inline-block w-1 h-4 bg-primary"></span> space-1 · 4px</div>
        <div><span class="inline-block w-2 h-4 bg-primary"></span> space-2 · 8px</div>
        <div><span class="inline-block w-3 h-4 bg-primary"></span> space-3 · 12px</div>
        <div><span class="inline-block w-4 h-4 bg-primary"></span> space-4 · 16px</div>
        <div><span class="inline-block w-5 h-4 bg-primary"></span> space-5 · 20px</div>
        <div><span class="inline-block w-8 h-4 bg-primary"></span> space-8 · 32px</div>
        <div><span class="inline-block w-13 h-4 bg-primary"></span> space-13 · 52px</div>
        <div><span class="inline-block w-22 h-4 bg-primary"></span> space-22 · 88px</div>
        <div><span class="inline-block w-40 h-4 bg-primary"></span> space-40 · 160px</div>
      </div>`,
  }),
}
