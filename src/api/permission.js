import request from '@/utils/request'
export const getPermissionList = (params) => request({ url: '/system/permission/list', method: 'get', params })
export const getPermissionDetail = (id) => request({ url: `/system/permission/${id}`, method: 'get' })
export const createPermission = (data) => request({ url: '/system/permission', method: 'post', data })
export const updatePermission = (data) => request({ url: '/system/permission', method: 'put', data })
export const updatePermissionStatus = (data) => request({ url: '/system/permission/status', method: 'put', data })
export const deletePermission = (id) => request({ url: `/system/permission/${id}`, method: 'delete' })
