import request from '@/utils/request'
import type { ApiResponse } from '@/types'

export const getAdminDashboard = () => request<ApiResponse<string>>({ url: '/admin/dashboard', method: 'get' })
export const getAdminDashboardByAuthority = () => request<ApiResponse<string>>({ url: '/admin/dashboard2', method: 'get' })
