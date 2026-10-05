import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from 'storybook/test'
import { COLORS } from './tokens'

const meta = {
  title: 'Tokens/Colors',
} satisfies Meta

export default meta
type Story = StoryObj

function swatch(name: string, value: string): string {
  return `        <div class="flex items-center gap-3 mb-2">
          <span class="w-12 h-8 rounded-lg border" style="background:${value};border-color:var(--ui-border)"></span>
          <code>${name}</code><span>${value}</span>
        </div>`
}

export const Palette: Story = {
  render: () => ({
    template: `
      <div class="font-sans">
${COLORS.map(([name, value]) => swatch(name, value)).join('\n')}
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const [name] of COLORS) {
      await expect(await canvas.findByText(name)).toBeInTheDocument()
    }
  },
}
