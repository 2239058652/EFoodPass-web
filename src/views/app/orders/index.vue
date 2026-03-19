<template>
  <el-card class="page-card page-hero gradient-blue" shadow="never">
    <div class="page-hero__title">我的订单</div>
    <div class="page-hero__desc">本页使用 <code>GET /app/order/list</code>，后端会根据 token 自动识别当前用户，不需要前端选择 userId。</div>
  </el-card>

  <el-card class="page-card" shadow="never">
    <el-form :model="queryForm" inline class="filter-form">
      <div class="toolbar">
        <el-form-item label="订单编号"><el-input v-model="queryForm.orderNo" placeholder="支持模糊查询" clearable /></el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="queryForm.orderStatus" placeholder="全部状态" clearable style="width: 160px">
            <el-option v-for="item in ORDER_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </div>
      <div class="toolbar">
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-form>
  </el-card>

  <div class="order-card-list">
    <el-card v-for="item in list" :key="item.id" class="page-card order-card" shadow="never">
      <div class="order-card__head">
        <div>
          <div class="order-card__title">{{ item.orderNo }}</div>
          <div class="order-card__meta">创建时间：{{ item.createdAt || '-' }}</div>
        </div>
        <el-tag :type="getOrderStatusTagType(item.orderStatus)" class="status-pill">{{ getOrderStatusLabel(item.orderStatus) }}</el-tag>
      </div>
      <div class="order-card__body">
        <div>金额：<strong>￥{{ money(item.totalAmount) }}</strong></div>
        <div>备注：{{ item.remark || '-' }}</div>
      </div>
      <div class="order-card__footer">
        <el-button text bg @click="router.push(`/app/orders/${item.id}`)">查看详情</el-button>
        <el-button v-if="item.orderStatus === 10" text bg type="danger" @click="handleCancel(item.id)">取消订单</el-button>
      </div>
    </el-card>
  </div>

  <div style="display:flex; justify-content:flex-end; margin-top: 18px">
    <el-pagination background layout="total, sizes, prev, pager, next, jumper" v-model:current-page="queryForm.pageNum" v-model:page-size="queryForm.pageSize" :page-sizes="[10,20,50]" :total="total" @size-change="getList" @current-change="getList" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { cancelMyOrder, getMyOrderList } from '@/api/appOrder'
import { ORDER_STATUS_OPTIONS, getOrderStatusLabel, getOrderStatusTagType } from '@/utils/constants'
import type { FoodOrderListItem } from '@/types'

const router = useRouter()
const total = ref(0)
const list = ref<FoodOrderListItem[]>([])
const queryForm = reactive({ orderNo: '', orderStatus: undefined as number | undefined, pageNum: 1, pageSize: 10 })
const money = (value: number | string | undefined) => Number(value || 0).toFixed(2)

async function getList() {
  const res = await getMyOrderList(queryForm)
  list.value = res.data?.records || []
  total.value = res.data?.total || 0
}
function handleSearch() { queryForm.pageNum = 1; getList() }
function handleReset() { queryForm.orderNo = ''; queryForm.orderStatus = undefined; queryForm.pageNum = 1; queryForm.pageSize = 10; getList() }
async function handleCancel(id: number) { await ElMessageBox.confirm('确认取消这个订单？', '提示', { type: 'warning' }); await cancelMyOrder(id); ElMessage.success('订单已取消'); getList() }
onMounted(getList)
</script>

<style scoped>
.order-card-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 18px; }
.order-card__head, .order-card__footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.order-card__title { font-size: 18px; font-weight: 700; }
.order-card__meta, .order-card__body { color: var(--text-secondary); }
.order-card__body { margin-top: 14px; display: grid; gap: 8px; }
.order-card__footer { margin-top: 16px; }
@media (max-width: 900px) { .order-card-list { grid-template-columns: 1fr; } }
</style>
