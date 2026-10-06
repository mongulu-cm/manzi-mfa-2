const localHosts = ['localhost', '127.0.0.1', '[::1]']
const localOnlyMessage = 'Ces fixtures doivent être exécutées uniquement sur une base locale jetable'

/** @param {string} value */
export function localDatabaseUrl(value = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres') {
  let url
  try {
    url = new URL(value)
  }
  catch {
    throw new Error(localOnlyMessage)
  }
  // libpq accepte des paramètres qui remplacent la cible décrite par le hostname.
  // Aucune querystring n'est nécessaire pour les fixtures locales.
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || !localHosts.includes(url.hostname)
    || /[\s?#]/.test(value)) {
    throw new Error(localOnlyMessage)
  }
  return url.href
}

/** @param {NodeJS.ProcessEnv} source */
export function localDatabaseEnvironment(source = process.env) {
  // PGHOSTADDR et PGSERVICE peuvent remplacer des paramètres absents de l'URI.
  return Object.fromEntries(Object.entries(source).filter(([name]) => !name.startsWith('PG')))
}
