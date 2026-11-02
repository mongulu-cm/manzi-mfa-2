import { describe, expect, it } from 'vitest'
import { interviewResources } from '../../apps/vitrine/app/data/interview-resources'
import {
  RESOURCE_CATEGORIES, groupByCategory, resourceDomain, validateResources,
} from '../../apps/vitrine/app/utils/interview-resources'
import type { InterviewResource } from '../../apps/vitrine/app/utils/interview-resources'

const base: InterviewResource = {
  id: 'exemple',
  title: 'Exemple',
  description: 'Une ressource d’exemple.',
  url: 'https://example.test/guide',
  category: 'methode',
  language: 'fr',
}

describe('ressources d’entretien', () => {
  it('valide la sélection publiée', () => {
    expect(validateResources(interviewResources)).toBe(interviewResources)
    expect(interviewResources).toHaveLength(9)
  })

  it.each([
    ['identifiant invalide', { id: 'Pas Un Slug' }, 'identifiant invalide'],
    ['identifiant absent', { id: undefined }, 'identifiant invalide'],
    ['URL absente', { url: undefined }, 'URL invalide'],
    ['langue héritée', { language: 'toString' }, 'langue inconnue'],
    ['titre vide', { title: '  ' }, 'titre manquant'],
    ['description vide', { description: '' }, 'description manquante'],
    ['catégorie inconnue', { category: 'ia' }, 'catégorie inconnue'],
    ['langue inconnue', { language: 'de' }, 'langue inconnue'],
    ['URL invalide', { url: 'pas une url' }, 'URL invalide'],
    ['URL non HTTPS', { url: 'http://example.test/' }, 'URL non HTTPS'],
    ['URL avec identifiants', { url: 'https://user:secret@example.test/' }, 'URL avec identifiants'],
    ['paramètre utm', { url: 'https://example.test/?utm_source=manzi' }, 'paramètre de suivi'],
    ['paramètre ref', { url: 'https://example.test/?ref=manzi' }, 'paramètre de suivi'],
  ])('refuse une ressource avec %s', (_, change, message) => {
    const invalid = { ...base, ...change } as InterviewResource
    expect(() => validateResources([invalid])).toThrow(message)
  })

  it('signale un titre manquant sans planter sur la détection des doublons', () => {
    expect(() => validateResources([{ ...base, title: undefined as unknown as string }])).toThrow('titre manquant')
  })

  it('nomme la ressource fautive même sans identifiant', () => {
    expect(() => validateResources([{ ...base, id: '' }])).toThrow('(sans identifiant) : identifiant invalide')
  })

  it.each([
    ['identifiant', { url: 'https://example.test/autre', title: 'Autre' }],
    ['URL', { id: 'autre', title: 'Autre' }],
    ['titre, sans tenir compte de la casse', { id: 'autre', url: 'https://example.test/autre', title: 'EXEMPLE' }],
  ])('refuse un doublon d’%s', (_, change) => {
    expect(() => validateResources([base, { ...base, ...change }])).toThrow('doublon')
  })

  it('accepte des paramètres d’URL sans suivi', () => {
    expect(() => validateResources([{ ...base, url: 'https://example.test/?lang=fr' }])).not.toThrow()
  })

  it('affiche le domaine sans www', () => {
    expect(resourceDomain('https://www.pramp.com/')).toBe('pramp.com')
    expect(resourceDomain('https://github.com/donnemartin/system-design-primer')).toBe('github.com')
  })

  it('groupe par catégorie dans l’ordre défini, sans catégorie vide', () => {
    const groups = groupByCategory([
      { ...base, id: 'b', category: 'pratique' },
      { ...base, id: 'a', category: 'methode' },
    ])
    expect(groups.map(group => [group.category, group.label, group.resources.map(resource => resource.id)])).toEqual([
      ['methode', 'Méthode', ['a']],
      ['pratique', 'Pratique', ['b']],
    ])
    expect(groupByCategory(interviewResources).map(group => group.category)).toEqual([...RESOURCE_CATEGORIES])
  })
})
