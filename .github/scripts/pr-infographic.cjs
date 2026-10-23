const STATUS = 'Infographie de la PR'

function proseLines(markdown) {
  const lines = []
  let fence = null
  for (const line of markdown.replace(/<!--[\s\S]*?-->/g, '').split('\n')) {
    const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    if (delimiter) {
      if (!fence) fence = delimiter[1]
      else if (delimiter[1][0] === fence[0] && delimiter[1].length >= fence.length && !delimiter[2].trim()) fence = null
      continue
    }
    if (!fence && !/^( {4}|\t)/.test(line)) lines.push(line.replace(/`[^`\n]*`/g, ''))
  }
  return lines
}

function infographicUrls(markdown = '') {
  const urls = []
  let inSection = false
  let level = 0
  for (const line of proseLines(markdown)) {
    const heading = line.match(/^(#{1,6})\s+(.+)/)
    if (heading) {
      if (/^Infographie\b/i.test(heading[2])) {
        inSection = true
        level = heading[1].length
      }
      else if (heading[1].length <= level) inSection = false
    }
    if (!inSection) continue
    for (const match of line.matchAll(/!\[[^\]]*\]\(<?(https:\/\/[^\s)>]+)>?(?:\s+"[^"]*")?\)|<img\b[^>]*\bsrc=["'](https:\/\/[^"']+)["'][^>]*>/gi)) {
      urls.push(match[1] || match[2])
    }
  }
  return [...new Set(urls)]
}

function trustedUrl(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false
    if (['raw.githubusercontent.com', 'user-images.githubusercontent.com', 'objects.githubusercontent.com'].includes(url.hostname)) return true
    return url.hostname === 'github.com' && (url.pathname.startsWith('/user-attachments/assets/') || /^\/[^/]+\/[^/]+\/blob\//.test(url.pathname))
  }
  catch { return false }
}

async function hasImageSignature(response) {
  // Lire seulement la signature, sans charger une pièce jointe entière.
  const reader = response.body?.getReader()
  if (!reader) return false
  const bytes = []
  try {
    while (bytes.length < 12) {
      const { done, value: chunk } = await reader.read()
      if (done) break
      bytes.push(...chunk.subarray(0, 12 - bytes.length))
    }
  }
  finally { await reader.cancel() }
  const header = Buffer.from(bytes)
  return header.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
    || header.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))
    || (header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WEBP')
}

async function verifyImage(value, fetchImage = globalThis.fetch) {
  let url = value
  for (let redirects = 0; redirects < 4; redirects++) {
    if (!trustedUrl(url)) return false
    const response = await fetchImage(url, { redirect: 'manual', signal: AbortSignal.timeout(10_000) })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel()
      const location = response.headers.get('location')
      if (!location) return false
      url = new URL(location, url).href
      continue
    }
    if (!response.ok || !/^image\/(png|jpeg|webp)\b/i.test(response.headers.get('content-type') || '')) {
      await response.body?.cancel()
      return false
    }
    return hasImageSignature(response)
  }
  return false
}

async function prHasInfographic(github, owner, repo, pr, verify) {
  const comments = await github.paginate(github.rest.issues.listComments, { owner, repo, issue_number: pr.number, per_page: 100 })
  const urls = [...new Set([pr.body, ...comments.map(c => c.body)].flatMap(body => infographicUrls(body || '')))]
  let unavailable = false
  for (const url of urls) {
    try {
      if (await verify(url)) return true
    }
    catch { unavailable = true }
  }
  if (unavailable) throw new Error('Vérification d’image temporairement indisponible.')
  return false
}

async function checkPullRequest({ github, context, verify = verifyImage }) {
  const { owner, repo } = context.repo
  const pull_number = Number(context.payload.pull_request?.number || context.payload.issue?.number || context.payload.inputs?.pull_request)
  if (!Number.isSafeInteger(pull_number) || pull_number < 1) throw new Error('Numéro de PR manquant ou invalide.')
  const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number })
  if (pr.base.ref !== 'main' || pr.state !== 'open') return 'skipped'
  const publish = (state, description) => github.rest.repos.createCommitStatus({
    owner, repo, sha: pr.head.sha, context: STATUS, state, description,
    target_url: `https://github.com/${owner}/${repo}/actions/runs/${context.runId}`,
  })
  await publish('pending', 'Recherche de l’infographie dans la description et les commentaires.')
  try {
    // Les statuts sont partagés par SHA : un Draft ne doit pas valider une
    // autre PR Ready portant exactement le même commit.
    const associated = await github.paginate(github.rest.repos.listPullRequestsAssociatedWithCommit, { owner, repo, commit_sha: pr.head.sha, per_page: 100 })
    const ready = [...new Map([...associated, pr].map(item => [item.number, item])).values()]
      .filter(item => item.state === 'open' && item.base.ref === 'main' && item.head.sha === pr.head.sha && !item.draft)
    if (!ready.length) {
      await publish('pending', 'Brouillon : contrôle obligatoire au passage en Ready.')
      return 'pending'
    }
    for (const candidate of ready) {
      // Auteur retourné par GitHub, jamais le titre, la branche ou l’acteur du run.
      if (candidate.user?.login === 'dependabot[bot]') continue
      if (!await prHasInfographic(github, owner, repo, candidate, verify)) {
        await publish('failure', 'Chaque PR Ready de ce commit doit afficher une section « Infographie » avec une image accessible.')
        return 'failure'
      }
    }
    await publish('success', 'Infographie vérifiée pour les PR Ready ; Dependabot est exempté.')
    return 'success'
  }
  catch {
    await publish('error', 'Impossible de vérifier l’infographie. Relancer le contrôle.')
    return 'error'
  }
}

module.exports = { infographicUrls, verifyImage, checkPullRequest }
