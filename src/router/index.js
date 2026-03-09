import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { getToken } from '@/utils/auth'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/login/index.vue'), meta: { public: true, title: '登录' } },
  {
    path: '/',
    component: () => import('@/layout/AppLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/index.vue'), meta: { title: '工作台' } },
      { path: 'system/user', name: 'SystemUser', component: () => import('@/views/system/user/index.vue'), meta: { title: '用户管理', permission: 'system:user:list' } },
      { path: 'system/role', name: 'SystemRole', component: () => import('@/views/system/role/index.vue'), meta: { title: '角色管理', permission: 'system:role:list' } },
      { path: 'system/permission', name: 'SystemPermission', component: () => import('@/views/system/permission/index.vue'), meta: { title: '权限管理', permission: 'system:permission:list' } }
    ]
  }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const token = getToken()

  if (to.meta.public) {
    if (token && to.path === '/login') return '/'
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

  const permission = to.meta.permission
  if (permission && !authStore.hasPermission(permission)) {
    ElMessage.error('无权限访问该页面')
    return '/dashboard'
  }
  return true
})

export default router
