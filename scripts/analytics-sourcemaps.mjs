import { basename, dirname, isAbsolute, relative, resolve } from 'node:path'
import { createHash } from 'node:crypto'

export function normalizeSourcePaths(map, filename, repository) {
  const sourceRoot = resolve(dirname(filename), map.sourceRoot || '.')
  map.sources = map.sources.map((source) => {
    const path = relative(repository, resolve(sourceRoot, source))
    const externalId = createHash('sha256').update(source).digest('hex').slice(0, 16)
    return path.startsWith('..') || isAbsolute(path) ? `external/${externalId}/${basename(source)}` : path.replaceAll('\\', '/')
  })
  // Le contexte du code est déjà inclus dans sourcesContent. Aucun chemin de machine.
  map.sourceRoot = ''
  return map
}
