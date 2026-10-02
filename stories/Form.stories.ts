import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, userEvent, within } from 'storybook/test'

const meta = {
  title: 'Components/Form',
} satisfies Meta

export default meta
type Story = StoryObj

export const TextInput: Story = {
  render: () => ({
    template: `
      <div style="max-width:320px;">
        <label class="field-label" for="sb-name">Ton prénom</label>
        <input id="sb-name" class="input" type="text" placeholder="Amina" />
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Ton prénom')
    await userEvent.type(input, 'Amina')
    await expect(input).toHaveValue('Amina')
  },
}

export const Textarea: Story = {
  render: () => ({
    template: `
      <div style="max-width:320px;">
        <label class="field-label" for="sb-msg">Ton objectif</label>
        <textarea id="sb-msg" class="input" placeholder="Devenir développeuse…"></textarea>
      </div>`,
  }),
}
