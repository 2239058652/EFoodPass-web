import request from '@/utils/request'
import type { ApiResponse, FoodItemForm, FoodItemItem, FoodItemQuery, FoodItemStockForm, PageResult } from '@/types'

export const getFoodItemList = (params: FoodItemQuery) => request<ApiResponse<PageResult<FoodItemItem>>>({ url: '/food/item/list', method: 'get', params })
export const getFoodItemDetail = (id: number) => request<ApiResponse<FoodItemItem>>({ url: `/food/item/${id}`, method: 'get' })
export const createFoodItem = (data: Partial<FoodItemForm>) => request<ApiResponse>({ url: '/food/item', method: 'post', data })
export const updateFoodItem = (data: Partial<FoodItemForm>) => request<ApiResponse>({ url: '/food/item', method: 'put', data })
export const updateFoodItemOnSale = (data: { itemId: number; isOnSale: number }) => request<ApiResponse>({ url: '/food/item/on-sale', method: 'put', data })
export const updateFoodItemStock = (data: FoodItemStockForm) => request<ApiResponse>({ url: '/food/item/stock', method: 'put', data })
export const deleteFoodItem = (id: number) => request<ApiResponse>({ url: `/food/item/${id}`, method: 'delete' })
