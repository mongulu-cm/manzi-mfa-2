import { beforeAll } from 'vitest'
import { setProjectAnnotations } from '@storybook/vue3'
// Initialise le payload avant de charger les modules Nuxt dans le navigateur Vitest.
import 'virtual:nuxt-runtime-config'
import * as projectAnnotations from './preview'

// L'iframe Vitest ne reçoit pas preview-head.html.
window.__NUXT_COLOR_MODE__ = {
  preference: 'light',
  value: 'light',
  getColorScheme: () => 'light',
  addColorScheme: () => {},
  removeColorScheme: () => {},
}

const nuxtAnnotations = await import('@storybook-vue/nuxt/preview')
const project = setProjectAnnotations([
  nuxtAnnotations,
  projectAnnotations,
  {
    // Le preset Nuxt associe son contexte à l'identifiant du canvas ;
    // les stories portables de Vitest créent un canvas sans identifiant.
    beforeEach: ({ canvasElement }) => {
      canvasElement.id ||= 'storybook-root'
    },
  },
])

beforeAll(project.beforeAll)
