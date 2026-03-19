<template>
  <el-card class="page-card page-hero gradient-blue" shadow="never">
    <div class="page-hero__title">EFoodPass 仪表盘</div>
    <div class="page-hero__desc">当前前端严格按后端源码生成，包含管理端和用户端订单页两套区域。登录流程基于 <code>POST /auth/login</code> 与 <code>GET /auth/me</code>，权限显隐基于 permissionCodes。</div>
    <div class="page-hero__meta">
      <div class="hero-badge">管理端</div>
      <div class="hero-badge">用户端订单页</div>
      <div class="hero-badge">Result / PageResult</div>
    </div>
  </el-card>

  <div class="metric-grid">
    <div class="metric-card">
      <div class="metric-card__label">当前用户</div>
      <div class="metric-card__value">{{ authStore.userInfo?.nickname || authStore.userInfo?.username || '-' }}</div>
      <div class="metric-card__note">用户ID：{{ authStore.userInfo?.userId || '-' }}</div>
    </div>
    <div class="metric-card" v-if="overview">
      <div class="metric-card__label">总订单数</div>
      <div class="metric-card__value">{{ overview.totalOrderCount }}</div>
      <div class="metric-card__note">待确认 {{ overview.pendingOrderCount }} / 制作中 {{ overview.processingOrderCount }}</div>
    </div>
    <div class="metric-card" v-if="overview">
      <div class="metric-card__label">累计金额</div>
      <div class="metric-card__value">￥{{ money(overview.totalAmount) }}</div>
      <div class="metric-card__note">已完成金额 ￥{{ money(overview.completedAmount) }}</div>
    </div>
    <div class="metric-card">
      <div class="metric-card__label">权限数量</div>
      <div class="metric-card__value">{{ authStore.userInfo?.permissionCodes?.length || 0 }}</div>
      <div class="metric-card__note">前端菜单和按钮均据此显隐</div>
    </div>
  </div>

  <div class="info-grid" style="margin-top: 18px">
    <el-card class="page-card welcome-panel" shadow="never">
      <div class="panel-title">后端已对齐的功能区</div>
      <div class="welcome-panel__text">
        系统管理：用户、角色、权限。<br />
        业务管理：分类、菜品、订单、订单统计、库存日志。<br />
        用户端：我的订单、订单详情、创建订单。
      </div>
      <div class="chip-list">
        <RouterLink v-for="link in quickLinks" :key="link.path" :to="link.path" class="soft-chip">{{ link.label }}</RouterLink>
      </div>
    </el-card>

    <el-card class="page-card" shadow="never">
      <div class="panel-title">当前角色</div>
      <div class="chip-list" style="margin-top: 14px">
        <div v-for="code in authStore.userInfo?.roleCodes || []" :key="code" class="soft-chip warm-chip">{{ code }}</div>
      </div>
      <div class="panel-desc" style="margin-top: 18px">如果当前用户拥有 <code>food:order:stat</code> 权限，仪表盘会直接读取订单统计接口。</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getOrderStatOverview } from '@/api/orderStat'
import type { OrderStatOverview } from '@/types'

const authStore = useAuthStore()
const overview = ref<OrderStatOverview | null>(null)

const quickLinks = computed(() => {
  const perms = authStore.userInfo?.permissionCodes || []
  const items = [
    { path: '/admin/system/users', label: '用户管理', perm: 'system:user:list' },
    { path: '/admin/system/roles', label: '角色管理', perm: 'system:role:list' },
    { path: '/admin/system/permissions', label: '权限管理', perm: 'system:permission:list' },
    { path: '/admin/food/categories', label: '分类管理', perm: 'food:category:list' },
    { path: '/admin/food/items', label: '菜品管理', perm: 'food:item:list' },
    { path: '/admin/food/orders', label: '订单管理', perm: 'food:order:list' },
    { path: '/admin/food/order-stat', label: '订单统计', perm: 'food:order:stat' },
    { path: '/admin/food/stock-logs', label: '库存日志', perm: 'food:stock-log:list' },
    { path: '/app/orders', label: '我的订单' },
    { path: '/app/order/create', label: '创建订单' }
  ]
  return items.filter((item) => !item.perm || perms.includes(item.perm))
})

function money(value: number | string | undefined): string {
  return Number(value || 0).toFixed(2)
}

onMounted(async () => {
  if (!authStore.hasPermission('food:order:stat')) return
  try {
    const res = await getOrderStatOverview()
    overview.value = res.data
  } catch {
    overview.value = null
  }
})
</script>
