<template>
  <el-card class="page-card page-hero gradient-warm" shadow="never">
    <div class="page-hero__title">订单详情</div>
    <div class="page-hero__desc">详情接口使用 <code>GET /app/order/{id}</code>，订单项展示的是后端返回的快照字段。</div>
  </el-card>

  <el-card class="page-card" shadow="never" v-if="detail">
    <el-descriptions :column="2" border>
      <el-descriptions-item label="订单编号">{{ detail.orderNo }}</el-descriptions-item>
      <el-descriptions-item label="订单状态"><el-tag :type="getOrderStatusTagType(detail.orderStatus)">{{ getOrderStatusLabel(detail.orderStatus) }}</el-tag></el-descriptions-item>
      <el-descriptions-item label="订单金额">￥{{ money(detail.totalAmount) }}</el-descriptions-item>
      <el-descriptions-item label="用户ID">{{ detail.userId }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ detail.createdAt || '-' }}</el-descriptions-item>
      <el-descriptions-item label="更新时间">{{ detail.updatedAt || '-' }}</el-descriptions-item>
      <el-descriptions-item label="订单备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
    </el-descriptions>

    <el-table :data="detail.items || []" class="soft-table" style="margin-top: 18px">
      <el-table-column prop="foodNameSnapshot" label="菜品" min-width="160" />
      <el-table-column label="单价" width="100"><template #default="{ row }">￥{{ money(row.priceSnapshot) }}</template></el-table-column>
      <el-table-column prop="quantity" label="数量" width="80" />
      <el-table-column label="金额" width="100"><template #default="{ row }">￥{{ money(row.amount) }}</template></el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getMyOrderDetail } from '@/api/appOrder'
import { getOrderStatusLabel, getOrderStatusTagType } from '@/utils/constants'
import type { FoodOrderDetail } from '@/types'

const route = useRoute()
const detail = ref<FoodOrderDetail | null>(null)
const money = (value: number | string | undefined) => Number(value || 0).toFixed(2)

onMounted(async () => {
  const id = Number(route.params.id)
  const res = await getMyOrderDetail(id)
  detail.value = res.data
})
</script>
