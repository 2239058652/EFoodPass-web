import { defineStore } from 'pinia'
import { getCurrentUser, login } from '@/api/auth'
import { clearAuth, getCachedUser, getToken, setCachedUser, setToken } from '@/utils/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getToken(),
    userInfo: getCachedUser(),
    loaded: !!getCachedUser()
  }),
  getters: {
    permissionCodes: (state) => state.userInfo?.permissionCodes || [],
    roleCodes: (state) => state.userInfo?.roleCodes || [],
    isLoggedIn: (state) => !!state.token
  },
  actions: {
    async loginByPassword(form) {
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
    hasPermission(code) { return this.permissionCodes.includes(code) },
    logout() { this.token = ''; this.userInfo = null; this.loaded = false; clearAuth() }
  }
})
