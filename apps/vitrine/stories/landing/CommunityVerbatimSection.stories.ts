import type { Meta, StoryObj } from '@storybook/vue3'
import CommunityVerbatimSection from '../../app/components/landing/CommunityVerbatimSection.vue'
import MonguluShell from '../../../../layers/mongulu/app/components/MonguluShell.vue'

const meta = {
  title: 'Vitrine/Landing/CommunityVerbatimSection',
  component: CommunityVerbatimSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CommunityVerbatimSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { MonguluShell, CommunityVerbatimSection },
    template: '<MonguluShell><CommunityVerbatimSection /></MonguluShell>',
  }),
}
