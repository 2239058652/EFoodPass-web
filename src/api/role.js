import request from '@/utils/request'
export const getRoleList = (params) => request({ url: '/system/role/list', method: 'get', params })
export const getRoleDetail = (id) => request({ url: `/system/role/${id}`, method: 'get' })
export const createRole = (data) => request({ url: '/system/role', method: 'post', data })
export const updateRole = (data) => request({ url: '/system/role', method: 'put', data })
export const updateRoleStatus = (data) => request({ url: '/system/role/status', method: 'put', data })
export const assignRolePermission = (data) => request({ url: '/system/role/assign-permission', method: 'post', data })
export const deleteRole = (id) => request({ url: `/system/role/${id}`, method: 'delete' })
