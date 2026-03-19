import request from '@/utils/request'
import type { ApiResponse, PageResult, RoleForm, RoleItem, RoleQuery } from '@/types'

export const getRoleList = (params: RoleQuery | Record<string, never>) => request<ApiResponse<PageResult<RoleItem>>>({ url: '/system/role/list', method: 'get', params })
export const getRoleDetail = (id: number) => request<ApiResponse<RoleItem>>({ url: `/system/role/${id}`, method: 'get' })
export const createRole = (data: Partial<RoleForm>) => request<ApiResponse>({ url: '/system/role', method: 'post', data })
export const updateRole = (data: Partial<RoleForm>) => request<ApiResponse>({ url: '/system/role', method: 'put', data })
export const updateRoleStatus = (data: { roleId: number; status: number }) => request<ApiResponse>({ url: '/system/role/status', method: 'put', data })
export const assignRolePermission = (data: { roleId: number; permissionIds: number[] }) => request<ApiResponse>({ url: '/system/role/assign-permission', method: 'post', data })
export const deleteRole = (id: number) => request<ApiResponse>({ url: `/system/role/${id}`, method: 'delete' })
