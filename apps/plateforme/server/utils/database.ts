import type { SupabaseClient } from '@supabase/supabase-js'
import {
  validateProfileUpdateInput,
  type MentorPublicProfile,
  type Profile,
  type ProfileUpdateInput,
} from '../../../../layers/mongulu/app/types/profile'

interface ProfileRow {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: Profile['role']
  headline: string | null
  company_or_school: string | null
  years_of_experience: number | null
  linkedin_url: string | null
  skills: string[] | null
  bio: string | null
  resume_url: string | null
  is_onboarded: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    headline: row.headline,
    companyOrSchool: row.company_or_school,
    yearsOfExperience: row.years_of_experience,
    linkedinUrl: row.linkedin_url,
    skills: row.skills ?? [],
    bio: row.bio,
    resumeUrl: row.resume_url,
    isOnboarded: row.is_onboarded,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toMentor(row: Pick<ProfileRow, 'id' | 'display_name' | 'avatar_url' | 'headline' | 'company_or_school' | 'years_of_experience' | 'skills' | 'bio'>): MentorPublicProfile {
  return {
    id: row.id,
    displayName: row.display_name ?? '',
    avatarUrl: row.avatar_url,
    headline: row.headline ?? '',
    companyOrSchool: row.company_or_school ?? '',
    yearsOfExperience: row.years_of_experience ?? 0,
    skills: row.skills ?? [],
    bio: row.bio,
  }
}

// Les messages d'erreur sont volontairement génériques : aucun détail SQL n'est exposé.
export async function fetchUserProfile(client: SupabaseClient, userId: string): Promise<Profile> {
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw new Error('Unable to load profile')
  if (!data) throw new Error('Profile not found')
  return toProfile(data as ProfileRow)
}

export async function updateUserProfile(
  client: SupabaseClient, userId: string, input: ProfileUpdateInput,
): Promise<Profile> {
  const validation = validateProfileUpdateInput(input)
  if (!validation.valid) throw new Error(`Invalid profile input: ${validation.errors.join('; ')}`)

  const columns: Record<string, unknown> = {
    role: input.role,
    headline: input.headline,
    company_or_school: input.companyOrSchool,
    years_of_experience: input.yearsOfExperience,
    linkedin_url: input.linkedinUrl,
    skills: input.skills,
    bio: input.bio,
    resume_url: input.resumeUrl,
    is_onboarded: input.isOnboarded,
  }
  const payload: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(columns)) {
    if (value !== undefined) payload[key] = value
  }
  if (Object.keys(payload).length === 0) {
    return fetchUserProfile(client, userId)
  }

  const { data, error } = await client.from('profiles').update(payload).eq('id', userId).select().single()
  if (error || !data) throw new Error('Unable to update profile')
  return toProfile(data as ProfileRow)
}

export async function fetchActiveMentors(client: SupabaseClient): Promise<MentorPublicProfile[]> {
  const { data, error } = await client.from('profiles')
    .select('id, display_name, avatar_url, headline, company_or_school, years_of_experience, skills, bio')
    .eq('role', 'mentor').eq('is_active', true).eq('is_onboarded', true)
  if (error) throw new Error('Unable to load mentors')
  return ((data ?? []) as Pick<ProfileRow, 'id' | 'display_name' | 'avatar_url' | 'headline' | 'company_or_school' | 'years_of_experience' | 'skills' | 'bio'>[]).map(toMentor)
}
