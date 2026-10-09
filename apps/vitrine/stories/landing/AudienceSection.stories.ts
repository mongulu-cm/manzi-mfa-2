import type { Meta, StoryObj } from '@storybook/vue3'
import AudienceSection from '../../app/components/landing/AudienceSection.vue'
import MonguluShell from '../../../../layers/mongulu/app/components/MonguluShell.vue'

const meta = {
  title: 'Vitrine/Landing/AudienceSection',
  component: AudienceSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AudienceSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { MonguluShell, AudienceSection },
    template: '<MonguluShell><AudienceSection /></MonguluShell>',
  }),
}
