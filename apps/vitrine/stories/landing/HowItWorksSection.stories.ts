import type { Meta, StoryObj } from '@storybook/vue3'
import HowItWorksSection from '../../app/components/landing/HowItWorksSection.vue'
import MonguluShell from '../../../../layers/mongulu/app/components/MonguluShell.vue'

const meta = {
  title: 'Vitrine/Landing/HowItWorksSection',
  component: HowItWorksSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HowItWorksSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { MonguluShell, HowItWorksSection },
    template: '<MonguluShell><HowItWorksSection /></MonguluShell>',
  }),
}
