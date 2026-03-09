const TOKEN_KEY = 'efoodpass_token'
const USER_KEY = 'efoodpass_user'

export function getToken() { return localStorage.getItem(TOKEN_KEY) || '' }
export function setToken(token) { localStorage.setItem(TOKEN_KEY, token) }
export function removeToken() { localStorage.removeItem(TOKEN_KEY) }
export function getCachedUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}
export function setCachedUser(user) { localStorage.setItem(USER_KEY, JSON.stringify(user || null)) }
export function removeCachedUser() { localStorage.removeItem(USER_KEY) }
export function clearAuth() { removeToken(); removeCachedUser() }
