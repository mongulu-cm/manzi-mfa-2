import type { Meta, StoryObj } from '@storybook/vue3'
import { expect } from 'storybook/test'
import ResourceCard from '../../app/components/resources/ResourceCard.vue'
import { interviewResources } from '../../app/data/interview-resources'

const meta = {
  title: 'Vitrine/Ressources/ResourceCard',
  component: ResourceCard,
  args: { resource: interviewResources.find(resource => resource.id === 'exercism')! },
} satisfies Meta<typeof ResourceCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Consulter Exercism sur exercism.org (site externe, nouvel onglet)' })
    await expect(link).toHaveAttribute('href', 'https://exercism.org/')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
    await expect(canvas.getByText('Ressource externe')).toBeVisible()
    await expect(canvas.getByText('En anglais')).toBeVisible()
    await expect(canvas.getByText('Site : exercism.org')).toBeVisible()
  },
}

export const LongContent: Story = {
  args: {
    resource: {
      id: 'contenu-long',
      title: 'Une ressource au titre particulièrement long pour vérifier le retour à la ligne des cartes',
      description: 'Une description volontairement longue, qui détaille plusieurs aspects de la préparation aux entretiens techniques afin de vérifier que la carte conserve une lecture confortable et des marges cohérentes sur toutes les largeurs.',
      url: 'https://www.example.org/un/chemin/assez/long/pour/le/domaine',
      category: 'methode',
      language: 'en',
    },
  },
}

export const FrenchResource: Story = {
  args: { resource: { ...interviewResources[0]!, id: 'ressource-fr', language: 'fr' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('En français')).toBeVisible()
  },
}

export const Mobile: Story = {
  render: args => ({
    components: { ResourceCard },
    setup: () => ({ args }),
    template: '<div style="max-width: 320px"><ResourceCard v-bind="args" /></div>',
  }),
}
