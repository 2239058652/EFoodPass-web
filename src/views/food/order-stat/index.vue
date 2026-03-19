<template>
  <el-card class="page-card page-hero gradient-blue" shadow="never">
    <div class="page-hero__title">订单统计</div>
    <div class="page-hero__desc">页面只复用后端已经存在的统计接口：<code>/overview</code>、<code>/status-count</code>、<code>/top-item</code>、<code>/daily-amount</code>。</div>
  </el-card>

  <div class="metric-grid" v-if="overview">
    <div class="metric-card"><div class="metric-card__label">总订单</div><div class="metric-card__value">{{ overview.totalOrderCount }}</div><div class="metric-card__note">全部订单数</div></div>
    <div class="metric-card"><div class="metric-card__label">待确认</div><div class="metric-card__value">{{ overview.pendingOrderCount }}</div><div class="metric-card__note">待处理订单</div></div>
    <div class="metric-card"><div class="metric-card__label">制作中</div><div class="metric-card__value">{{ overview.processingOrderCount }}</div><div class="metric-card__note">进行中订单</div></div>
    <div class="metric-card"><div class="metric-card__label">总金额</div><div class="metric-card__value">￥{{ money(overview.totalAmount) }}</div><div class="metric-card__note">已完成金额 ￥{{ money(overview.completedAmount) }}</div></div>
  </div>

  <div class="info-grid" style="margin-top: 18px">
    <el-card class="page-card" shadow="never">
      <div class="section-head"><div class="section-head-left"><div class="panel-title">状态分布</div><div class="panel-desc">数据来自 <code>GET /food/order/stat/status-count</code></div></div></div>
      <div v-for="item in statusCount" :key="item.orderStatus" class="stat-bar-row">
        <div class="stat-bar-row__label">{{ getOrderStatusLabel(item.orderStatus) }}</div>
        <div class="stat-bar-row__track"><div class="stat-bar-row__fill" :style="{ width: `${statusPercent(item.orderCount)}%` }"></div></div>
        <div class="stat-bar-row__value">{{ item.orderCount }}</div>
      </div>
    </el-card>

    <el-card class="page-card" shadow="never">
      <div class="section-head"><div class="section-head-left"><div class="panel-title">热销菜品</div><div class="panel-desc">数据来自 <code>GET /food/order/stat/top-item</code></div></div></div>
      <el-table :data="topItems" class="soft-table">
        <el-table-column prop="foodName" label="菜品" min-width="150" />
        <el-table-column prop="totalQuantity" label="销量" width="90" />
        <el-table-column label="金额" width="110"><template #default="{ row }">￥{{ money(row.totalAmount) }}</template></el-table-column>
      </el-table>
    </el-card>
  </div>

  <el-card class="page-card" shadow="never" style="margin-top: 18px">
    <div class="section-head"><div class="section-head-left"><div class="panel-title">每日金额</div><div class="panel-desc">数据来自 <code>GET /food/order/stat/daily-amount</code></div></div></div>
    <div v-for="item in dailyAmounts" :key="item.statDate" class="stat-bar-row">
      <div class="stat-bar-row__label">{{ item.statDate }}</div>
      <div class="stat-bar-row__track"><div class="stat-bar-row__fill stat-bar-row__fill--warm" :style="{ width: `${amountPercent(item.totalAmount)}%` }"></div></div>
      <div class="stat-bar-row__value">￥{{ money(item.totalAmount) }}</div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getOrderDailyAmount, getOrderStatOverview, getOrderStatusCount, getOrderTopItem } from '@/api/orderStat'
import { getOrderStatusLabel } from '@/utils/constants'
import type { OrderDailyAmount, OrderStatOverview, OrderStatusCount, OrderTopItem } from '@/types'

const overview = ref<OrderStatOverview | null>(null)
const statusCount = ref<OrderStatusCount[]>([])
const topItems = ref<OrderTopItem[]>([])
const dailyAmounts = ref<OrderDailyAmount[]>([])

const money = (value: number | string | undefined) => Number(value || 0).toFixed(2)
const statusMax = () => Math.max(...statusCount.value.map((item) => item.orderCount), 1)
const amountMax = () => Math.max(...dailyAmounts.value.map((item) => Number(item.totalAmount || 0)), 1)
const statusPercent = (count: number) => Math.max(8, Math.round((count / statusMax()) * 100))
const amountPercent = (amount: number | string) => Math.max(8, Math.round((Number(amount || 0) / amountMax()) * 100))

onMounted(async () => {
  const [overviewRes, statusRes, topRes, dailyRes] = await Promise.all([
    getOrderStatOverview(),
    getOrderStatusCount(),
    getOrderTopItem(),
    getOrderDailyAmount()
  ])
  overview.value = overviewRes.data
  statusCount.value = overviewRes.data ? statusRes.data : []
  topItems.value = topRes.data || []
  dailyAmounts.value = dailyRes.data || []
})
</script>

<style scoped>
.stat-bar-row { display: grid; grid-template-columns: 100px 1fr 90px; gap: 12px; align-items: center; margin-bottom: 14px; }
.stat-bar-row__label, .stat-bar-row__value { color: var(--text-secondary); font-size: 13px; }
.stat-bar-row__track { height: 10px; border-radius: 999px; background: rgba(148, 163, 184, 0.15); overflow: hidden; }
.stat-bar-row__fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #5b8cff, #69d5b1); }
.stat-bar-row__fill--warm { background: linear-gradient(90deg, #ffb56b, #ff8f6b); }
</style>
