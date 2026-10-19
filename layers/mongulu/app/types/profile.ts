export type UserRole = 'mentor' | 'mentee'

export interface Profile {
  id: string
  displayName: string | null
  avatarUrl: string | null
  role: UserRole | null
  headline: string | null
  companyOrSchool: string | null
  yearsOfExperience: number | null
  linkedinUrl: string | null
  skills: string[]
  bio: string | null
  resumeUrl: string | null
  isOnboarded: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MentorPublicProfile {
  id: string
  displayName: string
  avatarUrl: string | null
  headline: string
  companyOrSchool: string
  yearsOfExperience: number
  skills: string[]
  bio: string | null
}

export interface ProfileUpdateInput {
  role?: UserRole
  headline?: string
  companyOrSchool?: string
  yearsOfExperience?: number
  linkedinUrl?: string | null
  skills?: string[]
  bio?: string | null
  resumeUrl?: string | null
  isOnboarded?: boolean
}

const ROLES: readonly string[] = ['mentor', 'mentee']

function isLinkedinUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
      && (url.hostname === 'linkedin.com' || url.hostname.endsWith('.linkedin.com'))
  }
  catch {
    return false
  }
}

export function validateProfileUpdateInput(input: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { valid: false, errors: ['input must be an object'] }
  }
  const data = input as Record<string, unknown>

  if (data.role !== undefined && !ROLES.includes(data.role as string)) {
    errors.push('role must be "mentor" or "mentee"')
  }
  if (data.yearsOfExperience !== undefined) {
    const y = data.yearsOfExperience
    if (typeof y !== 'number' || !Number.isInteger(y) || y < 0 || y > 70) {
      errors.push('yearsOfExperience must be an integer between 0 and 70')
    }
  }
  if (data.linkedinUrl !== undefined && data.linkedinUrl !== null && !isLinkedinUrl(data.linkedinUrl)) {
    errors.push('linkedinUrl must be an https URL on linkedin.com')
  }
  if (data.skills !== undefined) {
    const s = data.skills
    if (!Array.isArray(s) || s.some(x => typeof x !== 'string' || x.trim() === '')) {
      errors.push('skills must be an array of non-empty strings')
    }
  }
  return { valid: errors.length === 0, errors }
}
