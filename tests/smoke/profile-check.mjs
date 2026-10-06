import assert from 'node:assert/strict'

function assertProvidedField(values, initialProvider, field) {
  const provided = initialProvider[`provider_has_${field}`]
  assert.equal(typeof provided, 'boolean', 'La présence des données fournisseur doit être connue')
  if (!provided) return
  assert.equal(values[`has_${field}`], true, `La donnée ${field} fournie doit être conservée`)
  if (initialProvider === values) {
    assert.equal(values[`matches_${field}`], true, `La donnée ${field} doit correspondre à LinkedIn`)
  }
}

export function assertAccountProfile(values, initialProvider = values) {
  assert.equal(values?.unique_account, true, 'Un seul compte Auth doit exister')
  assert.equal(values.unique_profile, true, 'Un seul profil doit exister')
  for (const field of ['name', 'photo', 'email']) {
    assertProvidedField(values, initialProvider, field)
  }
  assert.match(values.profile_fingerprint ?? '', /^[a-f0-9]{64}$/, 'La capture initiale du profil doit être vérifiable')
  assert.equal(values.profile_fingerprint, initialProvider.profile_fingerprint, 'Le profil initial doit rester identique')
}
