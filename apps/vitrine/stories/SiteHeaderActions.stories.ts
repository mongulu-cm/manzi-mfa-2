import type { Meta, StoryObj } from '@storybook/vue3'
import SiteHeaderActions from '../app/components/SiteHeaderActions.vue'
import MonguluShell from '../../../layers/mongulu/app/components/MonguluShell.vue'

const meta = {
  title: 'Vitrine/Header',
  component: SiteHeaderActions,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SiteHeaderActions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { MonguluShell, SiteHeaderActions },
    template: '<MonguluShell><template #header><SiteHeaderActions /></template><h1>Manzi-mfa</h1></MonguluShell>',
  }),
}
