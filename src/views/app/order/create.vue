<template>
  <el-card class="page-card page-hero gradient-blue" shadow="never">
    <div class="page-hero__title">创建订单</div>
    <div class="page-hero__desc">本页提交到 <code>POST /app/order</code>。后端当前没有专门的用户端菜品浏览接口，因此这里尝试复用 <code>GET /food/item/list</code> 读取上架菜品；如果你的部署不给普通用户这个接口权限，就需要后端补充用户端菜品列表接口。</div>
  </el-card>

  <el-card class="page-card" shadow="never" v-if="dependencyWarning">
    <div class="dialog-note">{{ dependencyWarning }}</div>
  </el-card>

  <el-card class="page-card" shadow="never">
    <el-form label-width="90px">
      <el-form-item label="订单备注"><el-input v-model="remark" type="textarea" :rows="3" maxlength="200" show-word-limit /></el-form-item>
    </el-form>

    <div class="section-head">
      <div class="section-head-left">
        <div class="panel-title">选择菜品</div>
        <div class="panel-desc">请求体的订单项结构为 <code>items: [{ foodItemId, quantity }]</code>。</div>
      </div>
      <el-button type="primary" plain @click="addItemRow">新增明细</el-button>
    </div>

    <div v-for="item in items" :key="item.id" class="order-item-row">
      <el-select v-model="item.foodItemId" placeholder="选择菜品" style="width: 340px">
        <el-option v-for="food in foodOptions" :key="food.id" :label="`${food.name}（￥${money(food.price)}，库存 ${food.stock}）`" :value="food.id" />
      </el-select>
      <el-input-number v-model="item.quantity" :min="1" />
      <el-button text type="danger" @click="removeItemRow(item.id)">删除</el-button>
    </div>

    <div style="margin-top: 22px; display:flex; justify-content:flex-end; gap:12px">
      <el-button @click="resetForm">重置</el-button>
      <el-button type="primary" :loading="submitting" @click="submitOrder">提交订单</el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createMyOrder } from '@/api/appOrder'
import { getFoodItemList } from '@/api/foodItem'
import type { FoodItemItem } from '@/types'

const router = useRouter()
const remark = ref('')
const submitting = ref(false)
const dependencyWarning = ref('')
const foodOptions = ref<FoodItemItem[]>([])
const items = ref<{ id: string; foodItemId?: number; quantity: number }[]>([])
const money = (value: number | string | undefined) => Number(value || 0).toFixed(2)

function addItemRow() { items.value.push({ id: Math.random().toString(36).slice(2), foodItemId: undefined, quantity: 1 }) }
function removeItemRow(id: string) { items.value = items.value.filter((item) => item.id !== id) }
function resetForm() { remark.value = ''; items.value = []; addItemRow() }

async function loadItems() {
  try {
    const res = await getFoodItemList({ name: '', categoryId: undefined, isOnSale: 1, pageNum: 1, pageSize: 200 })
    foodOptions.value = res.data?.records || []
    if (!foodOptions.value.length) dependencyWarning.value = '当前已成功调用 /food/item/list，但没有查到可用于下单的上架菜品。'
  } catch {
    dependencyWarning.value = '后端当前没有公开的用户端菜品浏览接口。本页尝试复用 /food/item/list 时失败，请确认是否允许用户侧访问，或补充专用接口。'
  }
}

async function submitOrder() {
  const payload = items.value.filter((item) => item.foodItemId && item.quantity > 0).map((item) => ({ foodItemId: Number(item.foodItemId), quantity: item.quantity }))
  if (!payload.length) return ElMessage.warning('请至少选择一个菜品')
  submitting.value = true
  try {
    await createMyOrder({ remark: remark.value || '', items: payload })
    ElMessage.success('订单创建成功')
    router.push('/app/orders')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => { resetForm(); await loadItems() })
</script>

<style scoped>
.order-item-row { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
</style>
