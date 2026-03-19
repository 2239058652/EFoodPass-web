import request from '@/utils/request'
import type { ApiResponse, PageResult, PermissionForm, PermissionItem, PermissionQuery } from '@/types'

export const getPermissionList = (params: PermissionQuery | Record<string, never>) => request<ApiResponse<PageResult<PermissionItem>>>({ url: '/system/permission/list', method: 'get', params })
export const getPermissionDetail = (id: number) => request<ApiResponse<PermissionItem>>({ url: `/system/permission/${id}`, method: 'get' })
export const createPermission = (data: Partial<PermissionForm>) => request<ApiResponse>({ url: '/system/permission', method: 'post', data })
export const updatePermission = (data: Partial<PermissionForm>) => request<ApiResponse>({ url: '/system/permission', method: 'put', data })
export const updatePermissionStatus = (data: { permissionId: number; status: number }) => request<ApiResponse>({ url: '/system/permission/status', method: 'put', data })
export const deletePermission = (id: number) => request<ApiResponse>({ url: `/system/permission/${id}`, method: 'delete' })
