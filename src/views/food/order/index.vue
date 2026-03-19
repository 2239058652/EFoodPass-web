<template>
  <el-card class="page-card page-hero gradient-warm" shadow="never">
    <div class="page-hero__title">订单管理</div>
    <div class="page-hero__desc">对应后端 <code>/food/order</code> 模块，真实状态流为 10 待确认、20 制作中、30 已完成、40 已取消。页面操作按钮严格按状态渲染。</div>
    <div class="page-hero__meta">
      <div class="hero-badge">创建订单</div>
      <div class="hero-badge">处理 / 完成 / 取消</div>
      <div class="hero-badge">详情抽屉</div>
    </div>
  </el-card>

  <el-card class="page-card" shadow="never">
    <div class="section-head">
      <div class="section-head-left">
        <div class="panel-title">筛选条件</div>
        <div class="panel-desc">支持订单编号、下单用户ID、订单状态分页查询。</div>
      </div>
    </div>
    <el-form :model="queryForm" inline class="filter-form">
      <div class="toolbar">
        <el-form-item label="订单编号"><el-input v-model="queryForm.orderNo" placeholder="支持模糊查询" clearable /></el-form-item>
        <el-form-item label="用户ID"><el-input-number v-model="queryForm.userId" :min="1" controls-position="right" /></el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="queryForm.orderStatus" placeholder="全部状态" clearable style="width: 160px">
            <el-option v-for="item in ORDER_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </div>
      <div class="toolbar">
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button v-if="hasPermission('food:order:add')" type="success" @click="openCreate">创建订单</el-button>
      </div>
    </el-form>
  </el-card>

  <el-card class="page-card" shadow="never">
    <div class="section-head">
      <div class="section-head-left">
        <div class="panel-title">订单列表</div>
        <div class="panel-desc">当前共 {{ total }} 条记录。</div>
      </div>
    </div>
    <el-table :data="tableData" class="soft-table" v-loading="loading">
      <el-table-column prop="id" label="ID" width="86" />
      <el-table-column prop="orderNo" label="订单编号" min-width="180" />
      <el-table-column prop="userId" label="用户ID" width="100" />
      <el-table-column label="金额" width="120"><template #default="{ row }">￥{{ money(row.totalAmount) }}</template></el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }"><el-tag :type="getOrderStatusTagType(row.orderStatus)" class="status-pill">{{ getOrderStatusLabel(row.orderStatus) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="创建时间" min-width="170" />
      <el-table-column label="操作" width="340" fixed="right">
        <template #default="{ row }">
          <el-button v-if="hasPermission('food:order:detail')" link type="info" @click="openDetail(row.id)">详情</el-button>
          <el-button v-if="canProcess(row)" link type="primary" @click="handleProcess(row.id)">开始制作</el-button>
          <el-button v-if="canComplete(row)" link type="success" @click="handleComplete(row.id)">完成</el-button>
          <el-button v-if="canCancel(row)" link type="danger" @click="handleCancel(row.id)">取消</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div style="display:flex; justify-content:flex-end; margin-top: 18px">
      <el-pagination background layout="total, sizes, prev, pager, next, jumper" v-model:current-page="queryForm.pageNum" v-model:page-size="queryForm.pageSize" :page-sizes="[10,20,50]" :total="total" @size-change="getList" @current-change="getList" />
    </div>
  </el-card>

  <el-dialog v-model="createVisible" title="创建订单" width="760px">
    <div class="dialog-note">管理端创建订单对应 <code>POST /food/order</code>，请求体包含 <code>userId</code>、<code>remark</code>、<code>items</code>。</div>
    <el-form label-width="100px">
      <el-form-item label="下单用户ID"><el-input-number v-model="createForm.userId" :min="1" class="w-100" /></el-form-item>
      <el-form-item label="订单备注"><el-input v-model="createForm.remark" type="textarea" :rows="3" /></el-form-item>
    </el-form>
    <div class="section-head" style="margin-top: 10px">
      <div class="section-head-left">
        <div class="panel-title" style="font-size: 16px">订单明细</div>
        <div class="panel-desc">明细项严格使用 foodItemId 与 quantity。</div>
      </div>
      <el-button type="primary" plain @click="addItemRow">新增明细</el-button>
    </div>
    <div v-for="item in createItems" :key="item.id" class="order-item-row">
      <el-select v-model="item.foodItemId" placeholder="选择菜品" style="width: 320px">
        <el-option v-for="food in foodOptions" :key="food.id" :label="`${food.name}（￥${money(food.price)}）`" :value="food.id" />
      </el-select>
      <el-input-number v-model="item.quantity" :min="1" />
      <el-button text type="danger" @click="removeItemRow(item.id)">删除</el-button>
    </div>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="submitCreate">提交订单</el-button>
    </template>
  </el-dialog>

  <el-drawer v-model="detailVisible" title="订单详情" size="560px">
    <el-descriptions :column="1" border v-if="detailData">
      <el-descriptions-item label="订单ID">{{ detailData.id }}</el-descriptions-item>
      <el-descriptions-item label="订单编号">{{ detailData.orderNo }}</el-descriptions-item>
      <el-descriptions-item label="用户ID">{{ detailData.userId }}</el-descriptions-item>
      <el-descriptions-item label="订单状态">{{ getOrderStatusLabel(detailData.orderStatus) }}</el-descriptions-item>
      <el-descriptions-item label="总金额">￥{{ money(detailData.totalAmount) }}</el-descriptions-item>
      <el-descriptions-item label="备注">{{ detailData.remark || '-' }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ detailData.createdAt || '-' }}</el-descriptions-item>
      <el-descriptions-item label="更新时间">{{ detailData.updatedAt || '-' }}</el-descriptions-item>
    </el-descriptions>
    <el-table :data="detailData?.items || []" class="soft-table" style="margin-top: 16px">
      <el-table-column prop="foodNameSnapshot" label="菜品" min-width="160" />
      <el-table-column label="单价" width="100"><template #default="{ row }">￥{{ money(row.priceSnapshot) }}</template></el-table-column>
      <el-table-column prop="quantity" label="数量" width="80" />
      <el-table-column label="金额" width="100"><template #default="{ row }">￥{{ money(row.amount) }}</template></el-table-column>
    </el-table>
  </el-drawer>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getFoodOrderDetail, getFoodOrderList, createFoodOrder, processFoodOrder, completeFoodOrder, cancelFoodOrder } from '@/api/order'
import { getFoodItemList } from '@/api/foodItem'
import { useAuthStore } from '@/stores/auth'
import { ORDER_STATUS_OPTIONS, getOrderStatusLabel, getOrderStatusTagType } from '@/utils/constants'
import type { FoodItemItem, FoodOrderCreateForm, FoodOrderDetail, FoodOrderListItem, FoodOrderQuery } from '@/types'

const authStore = useAuthStore()
const loading = ref(false)
const submitLoading = ref(false)
const total = ref(0)
const tableData = ref<FoodOrderListItem[]>([])
const detailVisible = ref(false)
const createVisible = ref(false)
const detailData = ref<FoodOrderDetail | null>(null)
const foodOptions = ref<FoodItemItem[]>([])
const createItems = ref<{ id: string; foodItemId: number | undefined; quantity: number }[]>([])
const queryForm = reactive<FoodOrderQuery>({ orderNo: '', userId: undefined, orderStatus: undefined, pageNum: 1, pageSize: 10 })
const createForm = reactive<FoodOrderCreateForm>({ userId: undefined, remark: '', items: [] })

const hasPermission = (code: string) => authStore.hasPermission(code)
const money = (value: number | string | undefined) => Number(value || 0).toFixed(2)
const canProcess = (row: FoodOrderListItem) => hasPermission('food:order:process') && row.orderStatus === 10
const canComplete = (row: FoodOrderListItem) => hasPermission('food:order:complete') && row.orderStatus === 20
const canCancel = (row: FoodOrderListItem) => hasPermission('food:order:cancel') && [10, 20].includes(row.orderStatus)

function addItemRow() { createItems.value.push({ id: Math.random().toString(36).slice(2), foodItemId: undefined, quantity: 1 }) }
function removeItemRow(id: string) { createItems.value = createItems.value.filter((item) => item.id !== id) }
function openCreate() { createForm.userId = undefined; createForm.remark = ''; createItems.value = []; addItemRow(); createVisible.value = true }
function handleSearch() { queryForm.pageNum = 1; getList() }
function handleReset() { queryForm.orderNo = ''; queryForm.userId = undefined; queryForm.orderStatus = undefined; queryForm.pageNum = 1; queryForm.pageSize = 10; getList() }

async function getList() {
  loading.value = true
  try {
    const res = await getFoodOrderList(queryForm)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

async function loadFoodOptions() {
  try {
    const res = await getFoodItemList({ name: '', categoryId: undefined, isOnSale: 1, pageNum: 1, pageSize: 200 })
    foodOptions.value = res.data?.records || []
  } catch {
    foodOptions.value = []
  }
}

async function openDetail(id: number) {
  const res = await getFoodOrderDetail(id)
  detailData.value = res.data
  detailVisible.value = true
}

async function handleProcess(id: number) { await ElMessageBox.confirm('确认将该订单流转为制作中？', '提示', { type: 'warning' }); await processFoodOrder(id); ElMessage.success('订单已开始制作'); getList() }
async function handleComplete(id: number) { await ElMessageBox.confirm('确认完成该订单？', '提示', { type: 'warning' }); await completeFoodOrder(id); ElMessage.success('订单已完成'); getList() }
async function handleCancel(id: number) { await ElMessageBox.confirm('确认取消该订单？', '提示', { type: 'warning' }); await cancelFoodOrder(id); ElMessage.success('订单已取消'); getList() }

async function submitCreate() {
  if (!createForm.userId) return ElMessage.warning('请输入下单用户ID')
  const items = createItems.value.filter((item) => item.foodItemId && item.quantity > 0).map((item) => ({ foodItemId: Number(item.foodItemId), quantity: item.quantity }))
  if (!items.length) return ElMessage.warning('请至少添加一个订单明细')
  submitLoading.value = true
  try {
    await createFoodOrder({ userId: Number(createForm.userId), remark: createForm.remark || '', items })
    ElMessage.success('订单创建成功')
    createVisible.value = false
    getList()
  } finally {
    submitLoading.value = false
  }
}

onMounted(async () => { await Promise.all([getList(), loadFoodOptions()]) })
</script>

<style scoped>
.order-item-row { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
</style>
