import type { Meta, StoryObj } from '@storybook/vue3'
import CtaSection from '../../app/components/landing/CtaSection.vue'
import MonguluShell from '../../../../layers/mongulu/app/components/MonguluShell.vue'

const meta = {
  title: 'Vitrine/Landing/CtaSection',
  component: CtaSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CtaSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { MonguluShell, CtaSection },
    template: '<MonguluShell><CtaSection /></MonguluShell>',
  }),
}
