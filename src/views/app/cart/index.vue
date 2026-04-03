<template>
  <div class="cart-page">
    <el-card class="page-card page-hero gradient-warm" shadow="never">
      <div class="page-hero__title">购物车</div>
      <div class="page-hero__desc">
        当前后端没有单独的购物车接口，因此这里使用前端本地购物车；提交时仍然走现有
        <code>POST /app/order</code> 创建订单。
      </div>
      <div class="page-hero__meta">
        <div class="hero-badge">前端本地购物车</div>
        <div class="hero-badge">沿用现有下单接口</div>
        <div class="hero-badge">支持数量调整</div>
        <div class="hero-badge">支持清空与结算</div>
      </div>
    </el-card>

    <el-card class="page-card" shadow="never" v-if="dependencyWarning">
      <div class="dialog-note">{{ dependencyWarning }}</div>
    </el-card>

    <el-card class="page-card" shadow="never" v-if="cartStore.isEmpty">
      <el-empty description="购物车还是空的，先去选菜吧。">
        <el-button type="primary" @click="router.push('/app/order/create')">去选菜</el-button>
      </el-empty>
    </el-card>

    <template v-else>
      <el-card class="page-card" shadow="never">
        <div class="section-head">
          <div class="section-head-left">
            <div class="panel-title">购物车明细</div>
            <div class="panel-desc">
              当前共 {{ cartStore.totalCount }} 件商品，合计 ￥{{ money(cartStore.totalAmount) }}。
            </div>
          </div>
          <div class="cart-actions">
            <el-button @click="router.push('/app/order/create')">继续选菜</el-button>
            <el-button type="danger" plain @click="handleClearCart">清空购物车</el-button>
          </div>
        </div>

        <el-table :data="cartStore.items" class="soft-table" border>
          <el-table-column label="菜品名称" min-width="220">
            <template #default="{ row }">
              <div class="food-name">{{ row.name }}</div>
              <div class="food-desc" v-if="row.description">{{ row.description }}</div>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120">
            <template #default="{ row }">￥{{ money(row.price) }}</template>
          </el-table-column>
          <el-table-column label="库存" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="row.stock > 0 ? 'success' : 'danger'">{{ row.stock }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="180">
            <template #default="{ row }">
              <el-input-number
                :model-value="row.quantity"
                :min="1"
                :max="row.stock > 0 ? row.stock : row.quantity"
                @update:model-value="handleQuantityChange(row.foodItemId, $event)"
              />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="140">
            <template #default="{ row }">￥{{ money(Number(row.price || 0) * row.quantity) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="110" fixed="right">
            <template #default="{ row }">
              <el-button text type="danger" @click="cartStore.removeItem(row.foodItemId)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="stock-note" v-if="hasUnavailableItem">
          当前购物车中存在库存为 0 的菜品，请确认后再提交。
        </div>
      </el-card>

      <el-card class="page-card" shadow="never">
        <div class="panel-title">提交订单</div>
        <div class="panel-desc">会将当前购物车中的商品转换为 <code>items: [{ foodItemId, quantity }]</code> 提交。</div>

        <el-form label-width="90px" style="margin-top: 18px">
          <el-form-item label="订单备注">
            <el-input v-model="remark" type="textarea" :rows="4" maxlength="200" show-word-limit />
          </el-form-item>
        </el-form>

        <div class="checkout-bar">
          <div class="checkout-bar__summary">
            <div>商品数量：<strong>{{ cartStore.totalCount }}</strong></div>
            <div>订单金额：<strong>￥{{ money(cartStore.totalAmount) }}</strong></div>
          </div>
          <el-button type="primary" :loading="submitting" @click="submitOrder">提交订单</el-button>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createMyOrder } from '@/api/appOrder'
import { getFoodItemList } from '@/api/foodItem'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()
const remark = ref('')
const submitting = ref(false)
const dependencyWarning = ref('')

const hasUnavailableItem = computed(() => cartStore.items.some((item) => item.stock <= 0 || item.quantity > item.stock))

function money(value: number | string | undefined): string {
  return Number(value || 0).toFixed(2)
}

function handleQuantityChange(foodItemId: number, value: number | undefined): void {
  cartStore.updateQuantity(foodItemId, Number(value || 1))
}

async function loadLatestFoods(): Promise<void> {
  try {
    const res = await getFoodItemList({ name: '', categoryId: undefined, isOnSale: 1, pageNum: 1, pageSize: 200 })
    const records = res.data?.records || []
    cartStore.syncItems(records)
  } catch {
    dependencyWarning.value = '当前无法重新获取最新菜品库存，购物车仍使用本地已缓存的菜品信息。'
  }
}

async function handleClearCart(): Promise<void> {
  try {
    await ElMessageBox.confirm('确认清空当前购物车吗？', '清空购物车', {
      type: 'warning',
      confirmButtonText: '清空',
      cancelButtonText: '取消'
    })
    cartStore.clear()
    ElMessage.success('购物车已清空')
  } catch {
    // ignore cancel
  }
}

async function submitOrder(): Promise<void> {
  if (cartStore.isEmpty) {
    ElMessage.warning('购物车为空，无法提交订单')
    return
  }
  if (hasUnavailableItem.value) {
    ElMessage.warning('购物车中存在库存异常的菜品，请先调整后再提交')
    return
  }

  submitting.value = true
  try {
    await createMyOrder({
      remark: remark.value || '',
      items: cartStore.items.map((item) => ({
        foodItemId: item.foodItemId,
        quantity: item.quantity
      }))
    })
    cartStore.clear()
    remark.value = ''
    ElMessage.success('订单创建成功')
    router.push('/app/orders')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await loadLatestFoods()
})
</script>

<style scoped>
.cart-page { display: flex; flex-direction: column; gap: 18px; }
.cart-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.food-name { font-weight: 700; }
.food-desc { margin-top: 6px; color: var(--text-secondary); line-height: 1.6; font-size: 12px; }
.stock-note {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 115, 115, 0.12);
  color: #b54747;
  font-size: 13px;
  line-height: 1.7;
}
.checkout-bar {
  margin-top: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.checkout-bar__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  color: var(--text-main);
}
@media (max-width: 768px) {
  .checkout-bar { align-items: flex-start; }
}
</style>
