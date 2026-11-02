import type { Meta, StoryObj } from '@storybook/vue3'
import { expect } from 'storybook/test'
import ResourceLibrary from '../../app/components/resources/ResourceLibrary.vue'
import { interviewResources } from '../../app/data/interview-resources'
import MonguluShell from '../../../../layers/mongulu/app/components/MonguluShell.vue'

const meta = {
  title: 'Vitrine/Ressources/ResourceLibrary',
  component: ResourceLibrary,
  parameters: { layout: 'fullscreen' },
  args: { resources: interviewResources },
  render: args => ({
    components: { MonguluShell, ResourceLibrary },
    setup: () => ({ args }),
    template: '<MonguluShell><ResourceLibrary v-bind="args" /></MonguluShell>',
  }),
} satisfies Meta<typeof ResourceLibrary>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Ressources externes')).toBeVisible()
    await expect(canvas.getAllByRole('heading', { level: 2 })).toHaveLength(7)
    await expect(canvas.getAllByRole('link', { name: /\(site externe, nouvel onglet\)$/ })).toHaveLength(9)
    await expect(canvas.getByRole('link', { name: 'Signaler un lien cassé' }))
      .toHaveAttribute('href', expect.stringMatching(/^mailto:collectif@mongulu\.cm\?subject=/))
  },
}

export const SingleCategory: Story = {
  args: { resources: interviewResources.filter(resource => resource.category === 'entretiens-blancs') },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 2 })).toHaveLength(1)
  },
}

export const Empty: Story = {
  args: { resources: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Aucune ressource n’est disponible pour le moment.')).toBeVisible()
    await expect(canvas.queryAllByRole('heading', { level: 2 })).toHaveLength(0)
  },
}
