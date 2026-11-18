import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from 'storybook/test'
import AnalyticsConsent from '../app/components/AnalyticsConsent.vue'

const meta = {
  title: 'Privacy/AnalyticsConsent', component: AnalyticsConsent,
  args: { choice: '', onChoose: fn() },
} satisfies Meta<typeof AnalyticsConsent>
export default meta
type Story = StoryObj<typeof meta>
export const Initial: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Refuser', exact: true }))
    await expect(args.onChoose).toHaveBeenCalledWith('rejected')
  },
}
export const Accepted: Story = {
  args: { choice: 'accepted' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Préférences de statistiques' }))
    await expect(canvas.getByRole('heading')).toHaveFocus()
    await userEvent.click(canvas.getByRole('button', { name: 'Refuser', exact: true }))
    await expect(args.onChoose).toHaveBeenCalledWith('rejected')
    await expect(canvas.getByRole('button', { name: 'Préférences de statistiques' })).toHaveFocus()
  },
}
export const Rejected: Story = { args: { choice: 'rejected' } }
export const Mobile: Story = {
  decorators: [() => ({ template: '<div class="w-80"><story /></div>' })],
}
