import { basename, dirname, isAbsolute, relative, resolve } from 'node:path'

export function normalizeSourcePaths(map, filename, repository) {
  const sourceRoot = resolve(dirname(filename), map.sourceRoot || '.')
  map.sources = map.sources.map((source) => {
    const path = relative(repository, resolve(sourceRoot, source))
    return path.startsWith('..') || isAbsolute(path) ? `external/${basename(source)}` : path.replaceAll('\\', '/')
  })
  // Le contexte du code est déjà inclus dans sourcesContent. Aucun chemin de machine.
  map.sourceRoot = ''
  return map
}
