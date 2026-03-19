export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  records: T[]
  total: number
  pageNum?: number
  pageSize?: number
}

export interface LoginForm {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  userId: number
  username: string
  nickname: string
}

export interface UserProfile {
  userId: number
  username: string
  nickname: string
  roleCodes: string[]
  permissionCodes: string[]
}

export interface RouteMetaExt {
  public?: boolean
  title?: string
  permission?: string
  section?: 'admin' | 'app'
}

export interface OptionItem<T = number> {
  label: string
  value: T
}

export interface UserItem {
  id: number
  username: string
  nickname: string
  phone?: string
  status: number
  roleIds?: number[]
  roleCodes?: string[]
}

export interface UserQuery {
  username: string
  status?: number
  pageNum: number
  pageSize: number
}

export interface UserForm {
  id?: number
  username: string
  password: string
  nickname: string
  phone: string
  status: number
}

export interface RoleItem {
  id: number
  roleCode: string
  roleName: string
  status: number
  permissionIds?: number[]
}

export interface RoleQuery {
  roleCode: string
  status?: number
  pageNum?: number
  pageSize?: number
}

export interface RoleForm {
  id?: number
  roleCode: string
  roleName: string
  status: number
}

export interface PermissionItem {
  id: number
  permCode: string
  permName: string
  permType: number
  path?: string
  method?: string
  status: number
}

export interface PermissionQuery {
  permCode: string
  status?: number
  pageNum?: number
  pageSize?: number
}

export interface PermissionForm {
  id?: number
  permCode: string
  permName: string
  permType: number
  path?: string
  method?: string
  status: number
}

export interface FoodCategoryItem {
  id: number
  name: string
  sortNo?: number
  status: number
  createdAt?: string
  updatedAt?: string
}

export interface FoodCategoryQuery {
  name: string
  status?: number
  pageNum: number
  pageSize: number
}

export interface FoodCategoryForm {
  id?: number
  name: string
  sortNo?: number
  status: number
}

export interface FoodItemItem {
  id: number
  categoryId: number
  categoryName?: string
  name: string
  price: number | string
  stock: number
  isOnSale: number
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface FoodItemQuery {
  name: string
  categoryId?: number
  isOnSale?: number
  pageNum: number
  pageSize: number
}

export interface FoodItemForm {
  id?: number
  categoryId?: number
  name: string
  price: number | string
  stock: number
  isOnSale: number
  description: string
}

export interface FoodItemStockForm {
  itemId: number
  stock: number
  remark?: string
}

export interface FoodOrderItemForm {
  foodItemId: number
  quantity: number
}

export interface FoodOrderItem {
  foodItemId: number
  foodNameSnapshot: string
  priceSnapshot: number | string
  quantity: number
  amount: number | string
}

export interface FoodOrderItemOption extends FoodOrderItemForm {
  foodName?: string
  price?: number | string
}

export interface FoodOrderItemForCreate {
  foodItemId: number
  quantity: number
}

export interface FoodOrderItemEditable extends FoodOrderItemForCreate {
  id: string
}

export interface FoodOrderItemRequest {
  foodItemId: number
  quantity: number
}

export interface FoodOrderQuery {
  orderNo: string
  userId?: number
  orderStatus?: number
  pageNum: number
  pageSize: number
}

export interface FoodOrderItemResponse {
  foodItemId: number
  foodNameSnapshot: string
  priceSnapshot: number | string
  quantity: number
  amount: number | string
}

export interface FoodOrderItemCreateRequest {
  foodItemId: number
  quantity: number
}

export interface FoodOrderCreateForm {
  userId?: number
  remark?: string
  items: FoodOrderItemCreateRequest[]
}

export interface FoodOrderItemSnapshot {
  foodItemId: number
  foodNameSnapshot: string
  priceSnapshot: number | string
  quantity: number
  amount: number | string
}

export interface FoodOrderItemLine extends FoodOrderItemSnapshot {}

export interface FoodOrderItemBrief extends FoodOrderItemSnapshot {}

export interface FoodOrderItemEntity extends FoodOrderItemSnapshot {}

export interface FoodOrderItemDisplay extends FoodOrderItemSnapshot {}

export interface FoodOrderItemInfo extends FoodOrderItemSnapshot {}

export interface FoodOrderItemView extends FoodOrderItemSnapshot {}

export interface FoodOrderItemData extends FoodOrderItemSnapshot {}

export interface FoodOrderItemModel extends FoodOrderItemSnapshot {}

export interface FoodOrderItemPayload {
  foodItemId: number
  quantity: number
}

export interface FoodOrderItemState extends FoodOrderItemPayload {}

export interface FoodOrderItemCard extends FoodOrderItemSnapshot {}

export interface FoodOrderListItem {
  id: number
  orderNo: string
  userId: number
  totalAmount: number | string
  orderStatus: number
  remark?: string
  createdAt?: string
}

export interface FoodOrderDetail {
  id: number
  orderNo: string
  userId: number
  totalAmount: number | string
  orderStatus: number
  remark?: string
  createdAt?: string
  updatedAt?: string
  items: FoodOrderItemSnapshot[]
}

export interface OrderStatOverview {
  totalOrderCount: number
  pendingOrderCount: number
  processingOrderCount: number
  completedOrderCount: number
  canceledOrderCount: number
  totalAmount: number | string
  completedAmount: number | string
}

export interface OrderStatusCount {
  orderStatus: number
  orderCount: number
}

export interface OrderTopItem {
  foodItemId: number
  foodName: string
  totalQuantity: number
  totalAmount: number | string
}

export interface OrderDailyAmount {
  statDate: string
  totalAmount: number | string
}

export interface FoodStockLogItem {
  id: number
  foodItemId: number
  foodItemName?: string
  changeType: number
  changeAmount: number
  beforeStock: number
  afterStock: number
  bizId?: number
  remark?: string
  createdAt?: string
}

export interface FoodStockLogQuery {
  foodItemId?: number
  changeType?: number
  pageNum: number
  pageSize: number
}
