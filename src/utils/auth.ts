import type { UserProfile } from '@/types'

const TOKEN_KEY = 'efoodpass_token'
const USER_KEY = 'efoodpass_user'

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getCachedUser(): UserProfile | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserProfile
  } catch {
    return null
  }
}

export function setCachedUser(user: UserProfile | null): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user || null))
}

export function removeCachedUser(): void {
  localStorage.removeItem(USER_KEY)
}

export function clearAuth(): void {
  removeToken()
  removeCachedUser()
}
