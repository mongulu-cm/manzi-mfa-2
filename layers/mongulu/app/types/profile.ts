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

// Aligné sur la contrainte SQL : ^https://([a-z0-9-]+\.)*linkedin\.com(/.*)?$ (insensible à la casse)
const LINKEDIN_URL_RE = /^https:\/\/([a-z0-9-]+\.)*linkedin\.com(\/.*)?$/i

function isLinkedinUrl(value: unknown): boolean {
  return typeof value === 'string' && LINKEDIN_URL_RE.test(value)
}

function isStringMax(value: unknown, max: number): boolean {
  return typeof value === 'string' && Array.from(value).length <= max
}

type FieldRule = [key: string, isValid: (value: unknown) => boolean, message: string, nullable?: boolean]

const isSkills = (s: unknown): boolean =>
  Array.isArray(s) && s.length <= 30 && s.every(x => typeof x === 'string' && x.trim() !== '' && Array.from(x).length <= 50)

const isYears = (y: unknown): boolean => typeof y === 'number' && Number.isInteger(y) && y >= 0 && y <= 70

const FIELD_RULES: FieldRule[] = [
  ['role', v => ROLES.includes(v as string), 'role must be "mentor" or "mentee"'],
  ['yearsOfExperience', isYears, 'yearsOfExperience must be an integer between 0 and 70'],
  ['linkedinUrl', isLinkedinUrl, 'linkedinUrl must be an https URL on linkedin.com', true],
  ['headline', v => isStringMax(v, 120), 'headline must be a string of at most 120 characters'],
  ['companyOrSchool', v => isStringMax(v, 120), 'companyOrSchool must be a string of at most 120 characters'],
  ['bio', v => isStringMax(v, 1000), 'bio must be a string of at most 1000 characters', true],
  ['resumeUrl', v => isStringMax(v, 500), 'resumeUrl must be a string of at most 500 characters or null', true],
  ['skills', isSkills, 'skills must be an array of at most 30 non-empty strings of at most 50 characters'],
  ['isOnboarded', v => typeof v === 'boolean', 'isOnboarded must be a boolean'],
]

export function validateProfileUpdateInput(input: unknown): { valid: boolean, errors: string[] } {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { valid: false, errors: ['input must be an object'] }
  }
  const data = input as Record<string, unknown>
  const errors = FIELD_RULES
    .filter(([key, isValid, , nullable]) => data[key] !== undefined && !(nullable && data[key] === null) && !isValid(data[key]))
    .map(([, , message]) => message)
  return { valid: errors.length === 0, errors }
}
