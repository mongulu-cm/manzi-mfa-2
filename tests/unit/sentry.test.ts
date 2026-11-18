import assert from 'node:assert/strict'
import { test } from 'vitest'
import { filterSentryError, sentryPrivacyOptions } from '../../layers/mongulu/monitoring/privacy'

test('removes request secrets and user data while preserving diagnostic stacks and release', () => {
  const exception = { values: [{ type: 'Error', value: 'Operation failed', stacktrace: { frames: [{ filename: 'app.vue', lineno: 12 }] } }] }
  const expectedException = structuredClone(exception)
  const result = filterSentryError({
    release: 'commit123',
    environment: 'preview',
    exception,
    user: { email: 'private@example.com' },
    extra: { password: 'secret' },
    breadcrumbs: [{ message: 'private form contents' }],
    request: { method: 'POST', url: 'https://example.com/api?token=secret#private', headers: { authorization: 'secret' }, data: 'private', cookies: 'secret' },
    contexts: { nuxt: { method: 'POST', path: '/api?token=secret', propsData: { password: 'secret' } }, trace: { trace_id: 'abc', span_id: 'def' } },
    transaction: 'POST /api?token=secret',
  }, {})
  assert.ok(result)
  assert.equal(JSON.stringify(result).includes('secret'), false)
  assert.equal(JSON.stringify(result).includes('private'), false)
  assert.deepEqual(result.exception, expectedException)
  assert.equal(result.release, 'commit123')
  assert.equal(result.contexts?.trace?.trace_id, 'abc')
})

test('filters expected failures but retains server failures and unexpected exceptions', () => {
  for (const statusCode of [400, 401, 403, 404, 409, 422, 429]) {
    assert.equal(filterSentryError({}, { originalException: { statusCode } }), null)
  }
  assert.equal(filterSentryError({}, { originalException: { name: 'AbortError' } }), null)
  assert.deepEqual(filterSentryError({}, { originalException: { statusCode: 500 } }), {})
  assert.deepEqual(filterSentryError({}, { originalException: new Error('Unexpected') }), {})
})

test('disables automatic sensitive data collection', () => {
  const options = sentryPrivacyOptions()
  assert.equal(options.dataCollection.userInfo, false)
  assert.equal(options.dataCollection.cookies, false)
  assert.equal(options.dataCollection.httpHeaders, false)
  assert.deepEqual(options.dataCollection.httpBodies, [])
  assert.equal(options.dataCollection.urlQueryParams, false)
  assert.equal(options.dataCollection.stackFrameVariables, false)
  assert.equal(options.dataCollection.databaseQueryData, false)
  assert.equal(options.dataCollection.queues, false)
  assert.deepEqual(options.dataCollection.graphQL, { document: false, variables: false })
  assert.deepEqual(options.dataCollection.genAI, { inputs: false, outputs: false })
  assert.deepEqual(options.dataCollection.mcp, { inputs: false, outputs: false })
  assert.equal(options.enableLogs, false)
  assert.equal(options.maxBreadcrumbs, 0)
})

test('scrubs credentials embedded in exception messages and stack URLs', () => {
  const result = filterSentryError({
    message: 'Failed for private@example.com token=secret',
    logentry: { message: 'private', params: ['private'] },
    exception: { values: [{
      value: 'GET https://example.com/auth?code=secret#private Bearer private password=secret',
      stacktrace: { frames: [{ filename: 'https://example.com/app.js?token=secret', vars: { password: 'secret' } }, {}] },
    }, {}] },
  }, { originalException: 'message' })
  assert.ok(result)
  assert.equal(JSON.stringify(result).includes('secret'), false)
  assert.equal(JSON.stringify(result).includes('private'), false)
  assert.equal(result.exception?.values?.[0]?.stacktrace?.frames?.[0]?.filename, 'https://example.com/app.js')
})

test('scrubs quoted and prefixed credentials and credentials in every URL field', () => {
  const url = 'https://private:canary-sensitive@example.com/app.js?access_token=canary-sensitive'
  const result = filterSentryError({
    message: `access_token=canary-sensitive refresh_token=canary-sensitive {"password":"canary-sensitive with spaces","client_secret":"canary-sensitive"} api-token='canary-sensitive value'`,
    request: { url },
    transaction: `GET ${url}`,
    contexts: { nuxt: { path: url } },
    exception: { values: [{ stacktrace: { frames: [{ filename: url, abs_path: url }] } }] },
  }, {})
  assert.ok(result)
  assert.equal(JSON.stringify(result).includes('canary-sensitive'), false)
  assert.equal(JSON.stringify(result).includes('private'), false)
  assert.equal(result.request?.url, 'https://[Filtered]@example.com/app.js')
  assert.equal(result.exception?.values?.[0]?.stacktrace?.frames?.[0]?.abs_path, result.request?.url)
})
