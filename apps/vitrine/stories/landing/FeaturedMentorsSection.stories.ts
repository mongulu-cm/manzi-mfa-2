import type { Meta, StoryObj } from '@storybook/vue3'
import FeaturedMentorsSection from '../../app/components/landing/FeaturedMentorsSection.vue'
import MonguluShell from '../../../../layers/mongulu/app/components/MonguluShell.vue'

const meta = {
  title: 'Vitrine/Landing/FeaturedMentorsSection',
  component: FeaturedMentorsSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FeaturedMentorsSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { MonguluShell, FeaturedMentorsSection },
    template: '<MonguluShell><FeaturedMentorsSection /></MonguluShell>',
  }),
}
