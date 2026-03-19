import request from '@/utils/request'
import type { ApiResponse, OrderDailyAmount, OrderStatOverview, OrderStatusCount, OrderTopItem } from '@/types'

export const getOrderStatOverview = () => request<ApiResponse<OrderStatOverview>>({ url: '/food/order/stat/overview', method: 'get' })
export const getOrderStatusCount = () => request<ApiResponse<OrderStatusCount[]>>({ url: '/food/order/stat/status-count', method: 'get' })
export const getOrderTopItem = () => request<ApiResponse<OrderTopItem[]>>({ url: '/food/order/stat/top-item', method: 'get' })
export const getOrderDailyAmount = () => request<ApiResponse<OrderDailyAmount[]>>({ url: '/food/order/stat/daily-amount', method: 'get' })
