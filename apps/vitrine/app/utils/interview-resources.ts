export const RESOURCE_CATEGORIES = [
  'methode',
  'entretiens-blancs',
  'algorithmique',
  'conception-systemes',
  'front-end',
  'pratique',
  'parcours',
] as const

export type ResourceCategory = typeof RESOURCE_CATEGORIES[number]
export type ResourceLanguage = 'fr' | 'en'

// Contrat d'affichage : F-013 fournira la même forme pour les ressources publiées.
export interface InterviewResource {
  id: string
  title: string
  description: string
  url: string
  category: ResourceCategory
  language: ResourceLanguage
}

export const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  'methode': 'Méthode',
  'entretiens-blancs': 'Entretiens blancs',
  'algorithmique': 'Algorithmique',
  'conception-systemes': 'Conception de systèmes',
  'front-end': 'Front-end',
  'pratique': 'Pratique',
  'parcours': 'Parcours',
}

export const LANGUAGE_LABELS: Record<ResourceLanguage, string> = {
  fr: 'En français',
  en: 'En anglais',
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const TRACKING_PARAMS = /^(?:utm_.+|ref|fbclid|gclid)$/i

function urlProblem(value: string): string | undefined {
  let url: URL
  try {
    url = new URL(value)
  }
  catch {
    return 'URL invalide'
  }
  if (url.protocol !== 'https:') return 'URL non HTTPS'
  if (url.username || url.password) return 'URL avec identifiants'
  if ([...url.searchParams.keys()].some(key => TRACKING_PARAMS.test(key))) return 'URL avec paramètre de suivi'
  return undefined
}

function resourceProblems(resource: InterviewResource): string[] {
  const problems: string[] = []
  if (!SLUG.test(resource.id)) problems.push('identifiant invalide')
  if (!resource.title?.trim()) problems.push('titre manquant')
  if (!resource.description?.trim()) problems.push('description manquante')
  if (!RESOURCE_CATEGORIES.includes(resource.category)) problems.push('catégorie inconnue')
  if (!(resource.language in LANGUAGE_LABELS)) problems.push('langue inconnue')
  const url = urlProblem(resource.url)
  if (url) problems.push(url)
  return problems
}

function duplicates(values: string[]): Set<string> {
  return new Set(values.filter((value, index) => values.indexOf(value) !== index))
}

// Refuse toute la liste au moindre défaut : une ressource invalide ne doit jamais être publiée.
export function validateResources(resources: InterviewResource[]): InterviewResource[] {
  const errors = resources.flatMap(resource =>
    resourceProblems(resource).map(problem => `${resource.id || '(sans identifiant)'} : ${problem}`))
  const repeated = [
    ...duplicates(resources.map(resource => resource.id)),
    ...duplicates(resources.map(resource => resource.url)),
    ...duplicates(resources.map(resource => resource.title.trim().toLowerCase())),
  ]
  errors.push(...repeated.map(value => `${value} : doublon`))
  if (errors.length) throw new Error(`Ressources invalides — ${errors.join(' ; ')}`)
  return resources
}

export function resourceDomain(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '')
}

export interface ResourceGroup {
  category: ResourceCategory
  label: string
  resources: InterviewResource[]
}

export function groupByCategory(resources: InterviewResource[]): ResourceGroup[] {
  return RESOURCE_CATEGORIES
    .map(category => ({
      category,
      label: CATEGORY_LABELS[category],
      resources: resources.filter(resource => resource.category === category),
    }))
    .filter(group => group.resources.length > 0)
}
