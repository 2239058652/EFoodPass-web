import request from '@/utils/request'
import type { ApiResponse, PageResult, UserForm, UserItem, UserQuery } from '@/types'

export const getUserList = (params: UserQuery) => request<ApiResponse<PageResult<UserItem>>>({ url: '/system/user/list', method: 'get', params })
export const getUserDetail = (id: number) => request<ApiResponse<UserItem>>({ url: `/system/user/${id}`, method: 'get' })
export const createUser = (data: Partial<UserForm>) => request<ApiResponse>({ url: '/system/user', method: 'post', data })
export const updateUser = (data: Partial<UserForm>) => request<ApiResponse>({ url: '/system/user', method: 'put', data })
export const updateUserStatus = (data: { userId: number; status: number }) => request<ApiResponse>({ url: '/system/user/status', method: 'put', data })
export const assignUserRole = (data: { userId: number; roleIds: number[] }) => request<ApiResponse>({ url: '/system/user/assign-role', method: 'post', data })
export const resetUserPassword = (data: { userId: number; newPassword: string }) => request<ApiResponse>({ url: '/system/user/reset-password', method: 'put', data })
export const deleteUser = (id: number) => request<ApiResponse>({ url: `/system/user/${id}`, method: 'delete' })
