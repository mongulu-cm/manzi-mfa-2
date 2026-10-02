import type { StorybookConfig } from '@storybook-vue/nuxt'

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|js)'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook-vue/nuxt',
    options: {},
  },
}

export default config
