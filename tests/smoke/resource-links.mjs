import { interviewResources } from '../../apps/vitrine/app/data/interview-resources.ts'

// Vérification opt-in des liens publiés, hors CI : aucune requête réseau dans les tests automatiques.
// 401, 403 et 429 signalent souvent une protection anti-robot : à vérifier dans un navigateur.
const TO_CHECK = new Set([401, 403, 429])
const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

function classify(status) {
  if (status >= 200 && status < 400) return 'ok'
  return TO_CHECK.has(status) ? 'à vérifier' : 'cassé'
}

async function check({ id, url }) {
  try {
    const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': userAgent }, signal: AbortSignal.timeout(15_000) })
    return { id, url, status: response.status, result: classify(response.status) }
  }
  catch {
    return { id, url, status: 'réseau', result: 'cassé' }
  }
}

const results = await Promise.all(interviewResources.map(check))
for (const { id, url, status, result } of results) console.log(`${result.padEnd(10)} ${String(status).padEnd(6)} ${id} — ${url}`)
const broken = results.filter(({ result }) => result === 'cassé')
console.log(`\n${results.length} liens : ${results.length - broken.length} sans erreur bloquante, ${broken.length} cassé(s).`)
if (broken.length) process.exitCode = 1
