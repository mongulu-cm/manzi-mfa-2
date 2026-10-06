import assert from 'node:assert/strict'

export function assertAccountProfile(values, initialProvider = values) {
  assert.equal(values?.unique_account, true, 'Un seul compte Auth doit exister')
  assert.equal(values.unique_profile, true, 'Un seul profil doit exister')
  for (const field of ['name', 'photo', 'email']) {
    const provided = initialProvider[`provider_has_${field}`]
    assert.equal(typeof provided, 'boolean', 'La présence des données fournisseur doit être connue')
    if (provided) assert.equal(values[`has_${field}`], true, `La donnée ${field} fournie doit être conservée`)
  }
}
