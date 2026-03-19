import request from '@/utils/request'
import type { ApiResponse, FoodCategoryForm, FoodCategoryItem, FoodCategoryQuery, PageResult } from '@/types'

export const getFoodCategoryList = (params: FoodCategoryQuery) => request<ApiResponse<PageResult<FoodCategoryItem>>>({ url: '/food/category/list', method: 'get', params })
export const getFoodCategoryDetail = (id: number) => request<ApiResponse<FoodCategoryItem>>({ url: `/food/category/${id}`, method: 'get' })
export const createFoodCategory = (data: Partial<FoodCategoryForm>) => request<ApiResponse>({ url: '/food/category', method: 'post', data })
export const updateFoodCategory = (data: Partial<FoodCategoryForm>) => request<ApiResponse>({ url: '/food/category', method: 'put', data })
export const updateFoodCategoryStatus = (data: { categoryId: number; status: number }) => request<ApiResponse>({ url: '/food/category/status', method: 'put', data })
export const deleteFoodCategory = (id: number) => request<ApiResponse>({ url: `/food/category/${id}`, method: 'delete' })
