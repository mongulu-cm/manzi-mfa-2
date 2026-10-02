import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from 'storybook/test'
import { onMounted, ref } from 'vue'

const meta = {
  title: 'Tokens/Colors',
} satisfies Meta

export default meta
type Story = StoryObj

const NAMES = [
  '--color-forest-50',
  '--color-forest-100',
  '--color-forest-200',
  '--color-forest-300',
  '--color-forest-400',
  '--color-forest-500',
  '--color-forest-600',
  '--color-forest-700',
  '--color-forest-800',
  '--color-forest-900',
  '--color-forest-950',
  '--ui-primary',
  '--ui-bg',
  '--ui-text',
  '--ui-text-muted',
  '--ui-border',
]

// Les valeurs sont lues depuis le thème réellement appliqué (@theme + --ui-*).
export const Palette: Story = {
  render: () => ({
    setup() {
      const colors = ref<Array<[string, string]>>([])
      onMounted(() => {
        const computed = getComputedStyle(document.documentElement)
        colors.value = NAMES.map(name => [name, computed.getPropertyValue(name).trim() || '(non défini)'])
      })
      return { colors }
    },
    template: `
      <div class="font-sans">
        <div v-for="[name, value] in colors" :key="name" class="flex items-center gap-3 mb-2">
          <span class="w-12 h-8 rounded-lg border border-(--ui-border)" :style="{ background: value }"></span>
          <code>{{ name }}</code><span>{{ value }}</span>
        </div>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const name = await canvas.findByText('--color-forest-500')
    await expect(name).toBeInTheDocument()
    await expect(await canvas.findByText('#576f1f')).toBeInTheDocument()
  },
}
