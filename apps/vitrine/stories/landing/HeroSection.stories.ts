import type { Meta, StoryObj } from '@storybook/vue3'
import HeroSection from '../../app/components/landing/HeroSection.vue'
import MonguluShell from '../../../../layers/mongulu/app/components/MonguluShell.vue'

const meta = {
  title: 'Vitrine/Landing/HeroSection',
  component: HeroSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HeroSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { MonguluShell, HeroSection },
    template: '<MonguluShell><HeroSection /></MonguluShell>',
  }),
}
