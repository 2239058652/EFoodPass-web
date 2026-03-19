import request from '@/utils/request'
import type { ApiResponse, FoodOrderCreateForm, FoodOrderDetail, FoodOrderListItem, FoodOrderQuery, PageResult } from '@/types'

export const getMyOrderList = (params: Omit<FoodOrderQuery, 'userId'>) => request<ApiResponse<PageResult<FoodOrderListItem>>>({ url: '/app/order/list', method: 'get', params })
export const getMyOrderDetail = (id: number) => request<ApiResponse<FoodOrderDetail>>({ url: `/app/order/${id}`, method: 'get' })
export const createMyOrder = (data: Pick<FoodOrderCreateForm, 'remark' | 'items'>) => request<ApiResponse>({ url: '/app/order', method: 'post', data })
export const cancelMyOrder = (id: number) => request<ApiResponse>({ url: `/app/order/cancel/${id}`, method: 'put' })
