import request from '@/utils/request'
import type { ApiResponse, LoginForm, LoginResponse, UserProfile } from '@/types'

export function login(data: LoginForm) {
  return request<ApiResponse<LoginResponse>>({ url: '/auth/login', method: 'post', data })
}

export function getCurrentUser() {
  return request<ApiResponse<UserProfile>>({ url: '/auth/me', method: 'get' })
}
