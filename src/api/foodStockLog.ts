import request from '@/utils/request'
import type { ApiResponse, FoodStockLogItem, FoodStockLogQuery, PageResult } from '@/types'

export const getFoodStockLogList = (params: FoodStockLogQuery) => request<ApiResponse<PageResult<FoodStockLogItem>>>({
  url: '/food/stock-log/list',
  method: 'get',
  params
})
