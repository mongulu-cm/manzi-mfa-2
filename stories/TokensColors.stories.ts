import type { Meta, StoryObj } from '@storybook/vue3'

const meta = {
  title: 'Tokens/Colors',
} satisfies Meta

export default meta
type Story = StoryObj

const COLORS: Array<[string, string]> = [
  ['--color-primary', '#6b8e23'],
  ['--color-primary-hover', '#556b2f'],
  ['--color-primary-active', '#3d4d1a'],
  ['--color-accent', '#9acd32'],
  ['--color-cream', '#f5f1e8'],
  ['--color-beige', '#e8e4d8'],
  ['--color-tan', '#d4b896'],
  ['--color-sage-glass', '#e6f0d6'],
  ['--color-sage-tint', '#c8dba8'],
  ['--color-sage-active', '#d0e5b8'],
  ['--color-charcoal', '#47483b'],
  ['--color-text', '#1f1f1f'],
  ['--color-muted', '#6b6b6b'],
  ['--color-disabled', '#a9a9a9'],
  ['--color-surface', '#ffffff'],
  ['--color-card', '#fafaf8'],
  ['--color-border', '#d9d9d9'],
  ['--color-divider', '#e0ddd4'],
]

const swatches = COLORS.map(
  ([name, value]) =>
    `<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">`
    + `<span style="width:48px;height:32px;border:1px solid #d9d9d9;border-radius:8px;background:${value}"></span>`
    + `<code>${name}</code><span style="color:#6b6b6b">${value}</span></div>`,
).join('')

export const Palette: Story = {
  render: () => ({
    template: `<div style="font-family:var(--font-sans)">${swatches}</div>`,
  }),
}
