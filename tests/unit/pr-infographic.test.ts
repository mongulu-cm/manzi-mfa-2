import { createRequire } from 'node:module'
import { expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const { infographicUrls, verifyImage, checkPullRequest } = require('../../.github/scripts/pr-infographic.cjs')

const imageUrl = 'https://raw.githubusercontent.com/mongulu-cm/manzi-mfa-2/abc/infographic.png'
const infographic = `### Infographie\n\n![Résumé généré](${imageUrl})`

it('accepte une infographie Markdown ou HTML dans une section dédiée', () => {
  expect(infographicUrls(infographic)).toEqual([imageUrl])
  expect(infographicUrls(`## Infographie\n<img src="${imageUrl}" alt="Résumé">`)).toEqual([imageUrl])
})

it('ignore badges, liens simples, exemples de code, commentaires HTML et images hors section', () => {
  for (const text of [
    `![Badge](${imageUrl})`,
    `## Infographie\n[Image](${imageUrl})`,
    `## Infographie\n\`\`\`md\n![Exemple](${imageUrl})\n\`\`\``,
    `\`\`\`md\n## Infographie\n![Exemple](${imageUrl})`,
    `## Infographie\n\n    ![Exemple](${imageUrl})`,
    `## Infographie\n<!-- ![Exemple](${imageUrl}) -->`,
    `## Infographie\nÀ venir\n## Tests\n![Autre image](${imageUrl})`,
  ]) expect(infographicUrls(text)).toEqual([])
})

it('refuse les hôtes arbitraires et les URL avec des identifiants', async () => {
  const fetch = vi.fn()
  expect(await verifyImage('https://example.com/image.png', fetch)).toBe(false)
  expect(await verifyImage('https://secret@raw.githubusercontent.com/a.png', fetch)).toBe(false)
  expect(await verifyImage('not-a-url', fetch)).toBe(false)
  expect(await verifyImage('http://raw.githubusercontent.com/a.png', fetch)).toBe(false)
  expect(fetch).not.toHaveBeenCalled()
})

it('accepte JPEG et WebP ainsi que les pièces jointes GitHub et leurs redirections permises', async () => {
  expect(await verifyImage('https://github.com/user-attachments/assets/example', async () => new Response(Buffer.from('ffd8ff000000', 'hex'), { headers: { 'content-type': 'image/jpeg' } }))).toBe(true)
  const fetch = vi.fn()
    .mockResolvedValueOnce(new Response('redirect', { status: 302, headers: { location: imageUrl } }))
    .mockResolvedValueOnce(new Response('RIFF0000WEBP', { headers: { 'content-type': 'image/webp' } }))
  expect(await verifyImage('https://github.com/owner/repo/blob/main/image.webp?raw=true', fetch)).toBe(true)
  expect(fetch).toHaveBeenCalledTimes(2)
})

it('borne les redirections et refuse les réponses sans destination ou sans corps', async () => {
  expect(await verifyImage(imageUrl, async () => new Response(null, { status: 302 }))).toBe(false)
  const loop = vi.fn(async () => new Response(null, { status: 302, headers: { location: imageUrl } }))
  expect(await verifyImage(imageUrl, loop)).toBe(false)
  expect(loop).toHaveBeenCalledTimes(4)
  expect(await verifyImage(imageUrl, async () => new Response(null, { headers: { 'content-type': 'image/png' } }))).toBe(false)
})

it('vérifie une vraie image et refuse une page HTML ou une redirection externe', async () => {
  const png = Buffer.from('89504e470d0a1a0a0000000000000000', 'hex')
  expect(await verifyImage(imageUrl, async () => new Response(png, { headers: { 'content-type': 'image/png' } }))).toBe(true)
  expect(await verifyImage(imageUrl, async () => new Response('<html>404</html>'))).toBe(false)
  expect(await verifyImage(imageUrl, async () => new Response(png, { status: 404 }))).toBe(false)
  expect(await verifyImage(imageUrl, async () => new Response('not an image', { headers: { 'content-type': 'image/png' } }))).toBe(false)
  const redirect = vi.fn(async () => new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/image' } }))
  expect(await verifyImage(imageUrl, redirect)).toBe(false)
  expect(redirect).toHaveBeenCalledTimes(1)
})

function fixture({ draft = false, body = '', comments = [] as { body: string }[], base = 'main', related = [] as Record<string, unknown>[] } = {}) {
  const statuses: { state: string, sha: string }[] = []
  const associated = vi.fn()
  const github = {
    rest: {
      pulls: { get: vi.fn(async () => ({ data: { number: 40, state: 'open', draft, body, base: { ref: base }, head: { sha: 'current-head' } } })) },
      issues: { listComments: vi.fn() },
      repos: {
        listPullRequestsAssociatedWithCommit: associated,
        createCommitStatus: vi.fn(async (status: { state: string, sha: string }) => { statuses.push(status) }),
      },
    },
    paginate: vi.fn(async (method: unknown) => method === associated ? related : comments),
  }
  return { github, statuses, context: { repo: { owner: 'mongulu-cm', repo: 'manzi-mfa-2' }, payload: { issue: { number: 40 } }, runId: 123 } }
}

it('bloque une PR Ready sans image puis valide un ajout en commentaire, sur le SHA courant', async () => {
  const missing = fixture()
  expect(await checkPullRequest(missing)).toBe('failure')
  expect(missing.statuses.map(s => s.state)).toEqual(['pending', 'failure'])
  const added = fixture({ comments: [{ body: infographic }] })
  expect(await checkPullRequest({ ...added, verify: async () => true })).toBe('success')
  expect(added.statuses.at(-1)).toMatchObject({ state: 'success', sha: 'current-head' })
})

it('redevient bloquant après suppression de la dernière image', async () => {
  const removed = fixture({ comments: [{ body: '### Infographie\nImage supprimée' }] })
  expect(await checkPullRequest(removed)).toBe('failure')
})

it('vérifie aussi la description et refuse un lien d’image inaccessible', async () => {
  expect(await checkPullRequest({ ...fixture({ body: infographic }), verify: async () => true })).toBe('success')
  expect(await checkPullRequest({ ...fixture({ body: infographic }), verify: async () => false })).toBe('failure')
})

it('continue après une erreur réseau si une autre infographie est valide', async () => {
  const source = fixture({ body: `${infographic}\n![Autre image](${imageUrl}?v=2)` })
  const verify = vi.fn().mockRejectedValueOnce(new Error('network-error')).mockResolvedValueOnce(true)
  expect(await checkPullRequest({ ...source, verify })).toBe('success')
  expect(verify).toHaveBeenCalledTimes(2)
})

it('signale une erreur technique si aucun candidat ne peut être vérifié', async () => {
  const source = fixture({ body: infographic })
  const verify = async () => {
    throw new Error('private-network-detail')
  }
  expect(await checkPullRequest({ ...source, verify })).toBe('error')
})

it('résout le numéro depuis les événements PR et les relances manuelles, et refuse un numéro invalide', async () => {
  const fromPr = fixture({ draft: true })
  await checkPullRequest({ ...fromPr, context: { ...fromPr.context, payload: { pull_request: { number: 40 } } } })
  const manual = fixture({ draft: true })
  await checkPullRequest({ ...manual, context: { ...manual.context, payload: { inputs: { pull_request: '40' } } } })
  expect(manual.github.rest.pulls.get).toHaveBeenCalledWith(expect.objectContaining({ pull_number: 40 }))
  await expect(checkPullRequest({ ...fixture(), context: { repo: fromPr.context.repo, payload: {}, runId: 123 } })).rejects.toThrow('Numéro de PR')
})

it('reporte le contrôle des brouillons et ignore les autres branches cibles', async () => {
  const draft = fixture({ draft: true })
  expect(await checkPullRequest(draft)).toBe('pending')
  expect(draft.statuses.at(-1)).toMatchObject({ state: 'pending' })
  const other = fixture({ base: 'develop' })
  expect(await checkPullRequest(other)).toBe('skipped')
  expect(other.statuses).toEqual([])
})

it('un Draft au même SHA ne peut pas valider une PR Ready sans image', async () => {
  const shared = fixture({ draft: true, related: [{
    number: 41, state: 'open', draft: false, body: '', base: { ref: 'main' }, head: { sha: 'current-head' },
  }] })
  expect(await checkPullRequest({ ...shared, verify: async () => true })).toBe('failure')
  expect(shared.statuses.at(-1)).toMatchObject({ state: 'failure' })
})

it('chaque PR Ready partageant le SHA doit afficher son image', async () => {
  const shared = fixture({ body: infographic, related: [{
    number: 41, state: 'open', draft: false, body: '', base: { ref: 'main' }, head: { sha: 'current-head' },
  }] })
  expect(await checkPullRequest({ ...shared, verify: async () => true })).toBe('failure')
})

it('rend une erreur API visible sans exposer son contenu', async () => {
  const source = fixture()
  source.github.paginate.mockRejectedValue(new Error('secret-provider-detail'))
  expect(await checkPullRequest(source)).toBe('error')
  expect(source.statuses.at(-1)).toMatchObject({ state: 'error', sha: 'current-head' })
  expect(JSON.stringify(source.statuses)).not.toContain('secret-provider-detail')
})
