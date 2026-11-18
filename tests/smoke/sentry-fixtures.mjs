// Temporary local-only routes for the manual Sentry smoke test. Never commit the generated files.
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = new URL('../../', import.meta.url)
const page = `<script setup lang="ts">
function triggerClientError() {
  throw new Error('Manzi F-020 controlled browser error (source-map verification)')
}
</script>

<template>
  <button type="button" @click="triggerClientError">Verify browser error capture</button>
</template>
`
const handler = `export default defineEventHandler((event) => {
  const mode = getQuery(event).mode
  if (mode === 'ok') return { ok: true }
  if (mode === 'expected') throw createError({ statusCode: 401, statusMessage: 'Controlled unauthorized request' })
  throw new Error('Manzi F-020 controlled backend error (source-map verification)')
})
`
if (!['create', 'remove'].includes(process.argv[2])) throw new Error('Usage: node tests/smoke/sentry-fixtures.mjs create|remove')
for (const app of ['vitrine', 'plateforme']) {
  for (const [path, content] of [['app/pages/__sentry-verify.vue', page], ['server/api/__sentry-verify.get.ts', handler]]) {
    const file = new URL(`apps/${app}/${path}`, root)
    if (process.argv[2] === 'remove') await rm(file, { force: true })
    else {
      await mkdir(new URL('.', file), { recursive: true })
      await writeFile(file, content, { flag: 'wx' })
    }
    console.log(`${process.argv[2]} ${fileURLToPath(file)}`)
  }
}
