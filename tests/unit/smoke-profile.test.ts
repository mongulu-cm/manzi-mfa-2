import { describe, expect, it } from 'vitest'
import { assertAccountProfile } from '../smoke/profile-check.mjs'

const complete = {
  unique_account: true, unique_profile: true,
  provider_has_name: true, provider_has_photo: true, provider_has_email: true,
  has_name: true, has_photo: true, has_email: true,
}

describe('validation du profil dans le smoke LinkedIn', () => {
  it('accepte les données fournisseur conservées', () => {
    expect(() => assertAccountProfile(complete)).not.toThrow()
  })

  it.each(['name', 'photo', 'email'])('refuse de perdre une donnée %s fournie', (field) => {
    expect(() => assertAccountProfile({ ...complete, [`has_${field}`]: false })).toThrow(`La donnée ${field} fournie doit être conservée`)
  })

  it.each(['name', 'photo', 'email'])('autorise une donnée %s facultative non fournie', (field) => {
    expect(() => assertAccountProfile({ ...complete, [`provider_has_${field}`]: false, [`has_${field}`]: false })).not.toThrow()
  })

  it.each(['unique_account', 'unique_profile'])('refuse un résultat sans %s', (field) => {
    expect(() => assertAccountProfile({ ...complete, [field]: false })).toThrow()
  })

  it('refuse un résultat fournisseur indéterminé', () => {
    expect(() => assertAccountProfile({ ...complete, provider_has_name: null })).toThrow('La présence des données fournisseur doit être connue')
  })

  it('conserve les attentes initiales après une reconnexion', () => {
    const initial = { ...complete, provider_has_photo: false, has_photo: false }
    const reconnected = { ...initial, provider_has_photo: true }
    expect(() => assertAccountProfile(reconnected, initial)).not.toThrow()
    expect(() => assertAccountProfile({ ...complete, provider_has_name: false, has_name: false }, complete)).toThrow('La donnée name fournie doit être conservée')
  })
})
