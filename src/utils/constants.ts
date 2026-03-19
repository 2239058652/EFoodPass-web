import type { OptionItem } from '@/types'

export const STATUS_OPTIONS: OptionItem[] = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 }
]

export const PERMISSION_TYPE_OPTIONS: OptionItem[] = [
  { label: '目录', value: 1 },
  { label: '菜单', value: 2 },
  { label: '接口', value: 3 }
]

export const PERMISSION_TYPE_MAP: Record<number, string> =
  Object.fromEntries(PERMISSION_TYPE_OPTIONS.map((item) => [Number(item.value), item.label]))

export const FOOD_ON_SALE_OPTIONS: OptionItem[] = [
  { label: '上架', value: 1 },
  { label: '下架', value: 0 }
]

export const ORDER_STATUS_OPTIONS: OptionItem[] = [
  { label: '待确认', value: 10 },
  { label: '制作中', value: 20 },
  { label: '已完成', value: 30 },
  { label: '已取消', value: 40 }
]

export const STOCK_CHANGE_TYPE_OPTIONS: OptionItem[] = [
  { label: '下单扣减', value: 1 },
  { label: '取消回补', value: 2 },
  { label: '后台调整', value: 3 }
]

export function getStatusLabel(value?: number): string {
  return STATUS_OPTIONS.find((item) => item.value === value)?.label || '-'
}

export function getPermissionTypeLabel(value?: number): string {
  return PERMISSION_TYPE_OPTIONS.find((item) => item.value === value)?.label || '-'
}

export function getFoodOnSaleLabel(value?: number): string {
  return FOOD_ON_SALE_OPTIONS.find((item) => item.value === value)?.label || '-'
}

export function getOrderStatusLabel(value?: number): string {
  return ORDER_STATUS_OPTIONS.find((item) => item.value === value)?.label || '-'
}

export function getStockChangeTypeLabel(value?: number): string {
  return STOCK_CHANGE_TYPE_OPTIONS.find((item) => item.value === value)?.label || '-'
}

export function getOrderStatusTagType(value?: number): 'warning' | 'primary' | 'success' | 'info' {
  if (value === 10) return 'warning'
  if (value === 20) return 'primary'
  if (value === 30) return 'success'
  return 'info'
}
