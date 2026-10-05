import type { Meta, StoryObj } from '@storybook/vue3'
import MonguluShell from '../app/components/MonguluShell.vue'

const meta = {
  title: 'Brand/Shell',
  component: MonguluShell,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MonguluShell>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { MonguluShell },
    template: '<MonguluShell><h1>Manzi-mfa</h1><p>Un échange avec un senior du collectif.</p></MonguluShell>',
  }),
}

export const LongContent: Story = {
  render: () => ({
    components: { MonguluShell },
    template: `<MonguluShell>
      <h1>Un accompagnement vers votre prochain emploi dans les métiers de l’informatique</h1>
      <p>Découvrez les échanges avec les seniors du Collectif Mongulu et préparez votre prochaine étape professionnelle.</p>
    </MonguluShell>`,
  }),
}
