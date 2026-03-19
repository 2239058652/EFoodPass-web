import { defineStore } from 'pinia'
import { getCurrentUser, login } from '@/api/auth'
import { clearAuth, getCachedUser, getToken, setCachedUser, setToken } from '@/utils/auth'
import type { LoginForm, UserProfile } from '@/types'

interface AuthState {
  token: string
  userInfo: UserProfile | null
  loaded: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: getToken(),
    userInfo: getCachedUser(),
    loaded: !!getCachedUser()
  }),
  getters: {
    permissionCodes: (state): string[] => state.userInfo?.permissionCodes || [],
    roleCodes: (state): string[] => state.userInfo?.roleCodes || [],
    isLoggedIn: (state): boolean => !!state.token
  },
  actions: {
    async loginByPassword(form: LoginForm) {
      const res = await login(form)
      this.token = res.data.token
      setToken(res.data.token)
      await this.fetchProfile()
      return res.data
    },
    async fetchProfile() {
      const res = await getCurrentUser()
      this.userInfo = res.data
      this.loaded = true
      setCachedUser(res.data)
      return res.data
    },
    hasPermission(code: string): boolean {
      return this.permissionCodes.includes(code)
    },
    logout(): void {
      this.token = ''
      this.userInfo = null
      this.loaded = false
      clearAuth()
    }
  }
})
