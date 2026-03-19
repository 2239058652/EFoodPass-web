import request from '@/utils/request'
import type { ApiResponse, FoodOrderCreateForm, FoodOrderDetail, FoodOrderListItem, FoodOrderQuery, PageResult } from '@/types'

export const getFoodOrderList = (params: FoodOrderQuery) => request<ApiResponse<PageResult<FoodOrderListItem>>>({ url: '/food/order/list', method: 'get', params })
export const getFoodOrderDetail = (id: number) => request<ApiResponse<FoodOrderDetail>>({ url: `/food/order/${id}`, method: 'get' })
export const createFoodOrder = (data: FoodOrderCreateForm) => request<ApiResponse>({ url: '/food/order', method: 'post', data })
export const processFoodOrder = (orderId: number) => request<ApiResponse>({ url: '/food/order/process', method: 'put', data: { orderId } })
export const cancelFoodOrder = (orderId: number) => request<ApiResponse>({ url: '/food/order/cancel', method: 'put', data: { orderId } })
export const completeFoodOrder = (orderId: number) => request<ApiResponse>({ url: '/food/order/complete', method: 'put', data: { orderId } })
