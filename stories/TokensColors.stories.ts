import type { Meta, StoryObj } from '@storybook/vue3'
import { onMounted, ref } from 'vue'

const meta = {
  title: 'Tokens/Colors',
} satisfies Meta

export default meta
type Story = StoryObj

const NAMES = [
  '--color-primary',
  '--color-primary-hover',
  '--color-primary-active',
  '--color-accent',
  '--color-cream',
  '--color-beige',
  '--color-tan',
  '--color-sage-glass',
  '--color-sage-tint',
  '--color-sage-active',
  '--color-charcoal',
  '--color-text',
  '--color-muted',
  '--color-placeholder',
  '--color-disabled',
  '--color-surface',
  '--color-card',
  '--color-border',
  '--color-border-strong',
  '--color-divider',
]

// Les valeurs sont lues depuis les custom properties réellement appliquées :
// la doc suit toujours tokens.css, sans duplication à maintenir.
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
      <div style="font-family:var(--font-sans)">
        <div v-for="[name, value] in colors" :key="name" style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
          <span style="width:48px;height:32px;border:1px solid var(--color-border);border-radius:8px;" :style="{ background: value }"></span>
          <code>{{ name }}</code><span style="color:var(--color-muted)">{{ value }}</span>
        </div>
      </div>`,
  }),
}
