export const STATUS_OPTIONS = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 }
]

export const PERMISSION_TYPE_OPTIONS = [
  { label: '目录', value: 1 },
  { label: '菜单', value: 2 },
  { label: '接口', value: 3 }
]

export function getStatusLabel(value) {
  return STATUS_OPTIONS.find((item) => item.value === value)?.label || '-'
}

export function getPermissionTypeLabel(value) {
  return PERMISSION_TYPE_OPTIONS.find((item) => item.value === value)?.label || '-'
}
