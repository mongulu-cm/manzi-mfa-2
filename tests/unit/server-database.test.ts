import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  fetchActiveMentors, fetchUserProfile, updateUserProfile,
} from '../../apps/plateforme/server/utils/database'

const row = {
  id: 'u1', display_name: 'Ada', avatar_url: null, role: 'mentor', headline: 'Eng',
  company_or_school: 'ACME', years_of_experience: 5, linkedin_url: null, skills: ['ts'],
  bio: null, resume_url: null, is_onboarded: true, is_active: true,
  created_at: 'c', updated_at: 'u',
}

// Chaîne thenable : toute méthode renvoie la chaîne, l'await résout `result`.
function mockClient(result: { data: unknown, error: unknown }) {
  const calls: Record<string, unknown[][]> = {}
  const chain: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'update', 'maybeSingle', 'single']) {
    chain[m] = vi.fn((...args: unknown[]) => { (calls[m] ??= []).push(args); return chain })
  }
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  const client = { from: vi.fn(() => chain) } as unknown as SupabaseClient
  return { client, calls }
}

describe('fetchUserProfile', () => {
  it('maps a row to Profile', async () => {
    const { client } = mockClient({ data: row, error: null })
    const p = await fetchUserProfile(client, 'u1')
    expect(p).toMatchObject({ id: 'u1', displayName: 'Ada', companyOrSchool: 'ACME', yearsOfExperience: 5, isOnboarded: true, skills: ['ts'] })
  })
  it('defaults null skills to an empty array', async () => {
    const { client } = mockClient({ data: { ...row, skills: null }, error: null })
    expect((await fetchUserProfile(client, 'u1')).skills).toEqual([])
  })
  it('throws a clean error on DB error', async () => {
    const { client } = mockClient({ data: null, error: { message: 'secret sql' } })
    await expect(fetchUserProfile(client, 'u1')).rejects.toThrow('Unable to load profile')
  })
  it('throws when not found', async () => {
    const { client } = mockClient({ data: null, error: null })
    await expect(fetchUserProfile(client, 'u1')).rejects.toThrow('Profile not found')
  })
})

describe('updateUserProfile', () => {
  it('maps fields to snake_case and returns the profile', async () => {
    const { client, calls } = mockClient({ data: row, error: null })
    const p = await updateUserProfile(client, 'u1', {
      role: 'mentor', headline: 'Eng', companyOrSchool: 'ACME', yearsOfExperience: 5,
      linkedinUrl: 'https://www.linkedin.com/in/x', skills: ['ts'], bio: 'b', resumeUrl: 'r', isOnboarded: true,
    })
    const payload = calls.update![0]![0] as Record<string, unknown>
    expect(payload).toMatchObject({
      role: 'mentor', headline: 'Eng', company_or_school: 'ACME', years_of_experience: 5,
      linkedin_url: 'https://www.linkedin.com/in/x', skills: ['ts'], bio: 'b', resume_url: 'r', is_onboarded: true,
    })
    expect(typeof payload.updated_at).toBe('string')
    expect(calls.eq![0]).toEqual(['id', 'u1'])
    expect(p.id).toBe('u1')
  })
  it('omits undefined fields', async () => {
    const { client, calls } = mockClient({ data: row, error: null })
    await updateUserProfile(client, 'u1', { headline: 'x' })
    expect(Object.keys(calls.update![0]![0] as object).sort()).toEqual(['headline', 'updated_at'])
  })
  it('throws on validation failure without calling the DB', async () => {
    const { client } = mockClient({ data: row, error: null })
    await expect(updateUserProfile(client, 'u1', { yearsOfExperience: -1 })).rejects.toThrow(/Invalid profile input: yearsOfExperience/)
    expect(client.from).not.toHaveBeenCalled()
  })
  it('throws a clean error on DB error', async () => {
    const { client } = mockClient({ data: null, error: { message: 'secret' } })
    await expect(updateUserProfile(client, 'u1', { headline: 'x' })).rejects.toThrow('Unable to update profile')
  })
})

describe('fetchActiveMentors', () => {
  it('filters and maps mentors', async () => {
    const { client, calls } = mockClient({ data: [row, { ...row, id: 'u2', display_name: null, headline: null, company_or_school: null, years_of_experience: null, skills: null }], error: null })
    const m = await fetchActiveMentors(client)
    expect(calls.eq).toEqual([['role', 'mentor'], ['is_active', true], ['is_onboarded', true]])
    expect(m[0]).toMatchObject({ id: 'u1', displayName: 'Ada', headline: 'Eng' })
    expect(m[1]).toMatchObject({ displayName: '', headline: '', companyOrSchool: '', yearsOfExperience: 0, skills: [] })
  })
  it('returns [] when data is null', async () => {
    const { client } = mockClient({ data: null, error: null })
    expect(await fetchActiveMentors(client)).toEqual([])
  })
  it('throws a clean error on DB error', async () => {
    const { client } = mockClient({ data: null, error: { message: 'x' } })
    await expect(fetchActiveMentors(client)).rejects.toThrow('Unable to load mentors')
  })
})
