import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { getToken } from '@/utils/auth'
import type { RouteMetaExt } from '@/types'

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'Login', component: () => import('@/views/login/index.vue'), meta: { public: true, title: '登录' } },
  {
    path: '/admin',
    component: () => import('@/layout/AppLayout.vue'),
    redirect: '/admin/dashboard',
    meta: { section: 'admin' },
    children: [
      { path: 'dashboard', name: 'AdminDashboard', component: () => import('@/views/dashboard/index.vue'), meta: { title: '仪表盘' } },
      { path: 'system/users', name: 'SystemUser', component: () => import('@/views/system/user/index.vue'), meta: { title: '用户管理', permission: 'system:user:list' } },
      { path: 'system/roles', name: 'SystemRole', component: () => import('@/views/system/role/index.vue'), meta: { title: '角色管理', permission: 'system:role:list' } },
      { path: 'system/permissions', name: 'SystemPermission', component: () => import('@/views/system/permission/index.vue'), meta: { title: '权限管理', permission: 'system:permission:list' } },
      { path: 'food/categories', name: 'FoodCategory', component: () => import('@/views/food/category/index.vue'), meta: { title: '分类管理', permission: 'food:category:list' } },
      { path: 'food/items', name: 'FoodItem', component: () => import('@/views/food/item/index.vue'), meta: { title: '菜品管理', permission: 'food:item:list' } },
      { path: 'food/orders', name: 'FoodOrder', component: () => import('@/views/food/order/index.vue'), meta: { title: '订单管理', permission: 'food:order:list' } },
      { path: 'food/order-stat', name: 'FoodOrderStat', component: () => import('@/views/food/order-stat/index.vue'), meta: { title: '订单统计', permission: 'food:order:stat' } },
      { path: 'food/stock-logs', name: 'FoodStockLog', component: () => import('@/views/food/stock-log/index.vue'), meta: { title: '库存日志', permission: 'food:stock-log:list' } }
    ]
  },
  {
    path: '/app',
    component: () => import('@/layout/AppUserLayout.vue'),
    redirect: '/app/orders',
    meta: { section: 'app' },
    children: [
      { path: 'orders', name: 'AppOrders', component: () => import('@/views/app/orders/index.vue'), meta: { title: '我的订单' } },
      { path: 'orders/:id', name: 'AppOrderDetail', component: () => import('@/views/app/orders/detail.vue'), meta: { title: '订单详情' } },
      { path: 'order/create', name: 'AppOrderCreate', component: () => import('@/views/app/order/create.vue'), meta: { title: '创建订单' } }
    ]
  },
  { path: '/', redirect: '/admin/dashboard' }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const token = getToken()
  const meta = (to.meta || {}) as RouteMetaExt

  if (meta.public) {
    if (token && to.path === '/login') return '/admin/dashboard'
    return true
  }

  if (!token) return '/login'

  if (!authStore.loaded) {
    try {
      await authStore.fetchProfile()
    } catch {
      authStore.logout()
      return '/login'
    }
  }

  if (meta.section === 'admin' && meta.permission && !authStore.hasPermission(meta.permission)) {
    ElMessage.error('无权限访问该页面')
    return '/admin/dashboard'
  }

  return true
})

export default router
