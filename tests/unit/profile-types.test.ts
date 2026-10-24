import { describe, expect, it } from 'vitest'
import { validateProfileUpdateInput } from '../../layers/mongulu/app/types/profile'

describe('validateProfileUpdateInput', () => {
  it('accepts valid input', () => {
    expect(validateProfileUpdateInput({
      role: 'mentor',
      yearsOfExperience: 10,
      linkedinUrl: 'https://www.linkedin.com/in/someone',
      skills: ['ts', 'vue'],
    })).toEqual({ valid: true, errors: [] })
  })

  it('accepts empty object and null linkedinUrl', () => {
    expect(validateProfileUpdateInput({}).valid).toBe(true)
    expect(validateProfileUpdateInput({ linkedinUrl: null }).valid).toBe(true)
    expect(validateProfileUpdateInput({ linkedinUrl: 'https://linkedin.com/in/x' }).valid).toBe(true)
  })

  it('rejects non-object input', () => {
    for (const bad of [null, 'x', 3, []]) {
      expect(validateProfileUpdateInput(bad)).toEqual({ valid: false, errors: ['input must be an object'] })
    }
  })

  it('rejects invalid role', () => {
    const r = validateProfileUpdateInput({ role: 'admin' })
    expect(r.valid).toBe(false)
    expect(r.errors[0]).toContain('role')
  })

  it('rejects invalid years of experience', () => {
    for (const y of [-1, 71, 1.5, '5', Number.NaN]) {
      const r = validateProfileUpdateInput({ yearsOfExperience: y })
      expect(r.valid).toBe(false)
      expect(r.errors[0]).toContain('yearsOfExperience')
    }
    expect(validateProfileUpdateInput({ yearsOfExperience: 0 }).valid).toBe(true)
    expect(validateProfileUpdateInput({ yearsOfExperience: 70 }).valid).toBe(true)
  })

  it('rejects invalid linkedin URLs', () => {
    for (const u of ['http://linkedin.com/in/x', 'https://example.com/in/x', 'https://evil-linkedin.com/x', 'not a url', 42]) {
      const r = validateProfileUpdateInput({ linkedinUrl: u })
      expect(r.valid).toBe(false)
      expect(r.errors[0]).toContain('linkedinUrl')
    }
  })

  it('accepts case-insensitive and trailing-slash linkedin URLs', () => {
    for (const u of ['HTTPS://WWW.LinkedIn.com/in/x', 'https://linkedin.com', 'https://fr.linkedin.com/']) {
      expect(validateProfileUpdateInput({ linkedinUrl: u }).valid).toBe(true)
    }
  })

  it('validates text field lengths', () => {
    for (const k of ['headline', 'companyOrSchool']) {
      expect(validateProfileUpdateInput({ [k]: 'a'.repeat(120) }).valid).toBe(true)
      expect(validateProfileUpdateInput({ [k]: 'a'.repeat(121) }).errors[0]).toContain(k)
      expect(validateProfileUpdateInput({ [k]: 5 }).errors[0]).toContain(k)
    }
    expect(validateProfileUpdateInput({ bio: 'a'.repeat(1000) }).valid).toBe(true)
    expect(validateProfileUpdateInput({ bio: null }).valid).toBe(true)
    expect(validateProfileUpdateInput({ bio: 'a'.repeat(1001) }).errors[0]).toContain('bio')
    expect(validateProfileUpdateInput({ resumeUrl: 'a'.repeat(500) }).valid).toBe(true)
    expect(validateProfileUpdateInput({ resumeUrl: null }).valid).toBe(true)
    expect(validateProfileUpdateInput({ resumeUrl: 'a'.repeat(501) }).errors[0]).toContain('resumeUrl')
    expect(validateProfileUpdateInput({ resumeUrl: 3 }).errors[0]).toContain('resumeUrl')
    // Astral characters (code points vs utf-16 code units)
    expect(validateProfileUpdateInput({ headline: '👋'.repeat(120) }).valid).toBe(true)
    expect(validateProfileUpdateInput({ headline: '👋'.repeat(121) }).valid).toBe(false)
  })

  it('validates isOnboarded as boolean', () => {
    expect(validateProfileUpdateInput({ isOnboarded: true }).valid).toBe(true)
    expect(validateProfileUpdateInput({ isOnboarded: false }).valid).toBe(true)
    expect(validateProfileUpdateInput({ isOnboarded: 'true' as never }).valid).toBe(false)
    expect(validateProfileUpdateInput({ isOnboarded: 1 as never }).valid).toBe(false)
  })

  it('enforces skills count and length limits', () => {
    expect(validateProfileUpdateInput({ skills: Array.from({ length: 30 }, () => 'a') }).valid).toBe(true)
    expect(validateProfileUpdateInput({ skills: Array.from({ length: 31 }, () => 'a') }).valid).toBe(false)
    expect(validateProfileUpdateInput({ skills: ['a'.repeat(51)] }).valid).toBe(false)
  })

  it('rejects invalid skills', () => {
    for (const s of ['ts', ['ts', ''], ['  '], [1]]) {
      const r = validateProfileUpdateInput({ skills: s })
      expect(r.valid).toBe(false)
      expect(r.errors[0]).toContain('skills')
    }
    expect(validateProfileUpdateInput({ skills: [] }).valid).toBe(true)
  })

  it('collects multiple errors', () => {
    expect(validateProfileUpdateInput({ role: 'x', skills: 'y' }).errors).toHaveLength(2)
  })
})
