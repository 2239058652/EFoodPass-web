import axios, { type AxiosError, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { clearAuth, getToken } from './auth'
import type { ApiResponse } from '@/types'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_API || '/api',
  timeout: 15000
})

service.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    if (typeof res?.code === 'undefined') return response.data
    if (res.code === 200) return res
    ElMessage.error(res.message || '请求失败')
    if (res.code === 401) {
      clearAuth()
      router.replace('/login')
    }
    return Promise.reject(res)
  },
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message || '网络异常'
    if (status === 401) {
      clearAuth()
      router.replace('/login')
    }
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default service
