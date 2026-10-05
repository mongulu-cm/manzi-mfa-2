import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook-vue/nuxt'

const config: StorybookConfig = {
  stories: [
    '../layers/*/stories/**/*.stories.@(ts|js)',
    '../apps/*/stories/**/*.stories.@(ts|js)',
  ],
  staticDirs: ['../layers/mongulu/public'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook-vue/nuxt',
    options: {},
  },
  core: {
    builder: {
      name: '@storybook/builder-vite',
      options: { viteConfigPath: fileURLToPath(new URL('./vite.config.ts', import.meta.url)) },
    },
  },
}

export default config
