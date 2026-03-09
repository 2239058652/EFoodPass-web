import request from '@/utils/request'
export const getUserList = (params) => request({ url: '/system/user/list', method: 'get', params })
export const getUserDetail = (id) => request({ url: `/system/user/${id}`, method: 'get' })
export const createUser = (data) => request({ url: '/system/user', method: 'post', data })
export const updateUser = (data) => request({ url: '/system/user', method: 'put', data })
export const updateUserStatus = (data) => request({ url: '/system/user/status', method: 'put', data })
export const assignUserRole = (data) => request({ url: '/system/user/assign-role', method: 'post', data })
export const resetUserPassword = (data) => request({ url: '/system/user/reset-password', method: 'put', data })
export const deleteUser = (id) => request({ url: `/system/user/${id}`, method: 'delete' })
