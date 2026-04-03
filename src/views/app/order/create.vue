<template>
  <div class="order-create-page">
    <el-card class="page-card page-hero gradient-blue" shadow="never">
      <div class="page-hero__title">选菜下单</div>
      <div class="page-hero__desc">
        当前后端没有专门的购物车接口，因此这里先把菜品加入前端本地购物车，最后在购物车页统一提交到
        <code>POST /app/order</code>。
      </div>
      <div class="page-hero__meta">
        <div class="hero-badge">本地购物车</div>
        <div class="hero-badge">提交到现有订单接口</div>
        <div class="hero-badge">支持继续选菜</div>
      </div>
    </el-card>

    <el-card class="page-card" shadow="never" v-if="dependencyWarning">
      <div class="dialog-note">{{ dependencyWarning }}</div>
    </el-card>

    <el-card class="page-card" shadow="never">
      <div class="section-head">
        <div class="section-head-left">
          <div class="panel-title">购物车概览</div>
          <div class="panel-desc">
            当前购物车共 {{ cartStore.totalCount }} 件商品，金额 ￥{{ money(cartStore.totalAmount) }}。
          </div>
        </div>
        <div class="summary-actions">
          <el-button @click="cartStore.clear()" :disabled="cartStore.isEmpty">清空购物车</el-button>
          <el-button type="primary" @click="router.push('/app/cart')">去购物车</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="page-card" shadow="never">
      <div class="section-head">
        <div class="section-head-left">
          <div class="panel-title">选择菜品</div>
          <div class="panel-desc">如果普通用户无权访问 <code>GET /food/item/list</code>，这里会读取失败并给出提示。</div>
        </div>
        <div class="toolbar">
          <el-input v-model="keyword" placeholder="搜索菜品名称" clearable style="width: 240px" />
          <el-button @click="loadItems" :loading="loading">刷新菜品</el-button>
        </div>
      </div>

      <div v-if="loading" class="loading-box">
        <el-skeleton :rows="8" animated />
      </div>

      <template v-else>
        <div class="food-grid" v-if="filteredFoods.length">
          <div v-for="food in filteredFoods" :key="food.id" class="food-card">
            <div class="food-card__head">
              <div>
                <div class="food-card__title">{{ food.name }}</div>
                <div class="food-card__category" v-if="food.categoryName">{{ food.categoryName }}</div>
              </div>
              <el-tag :type="food.stock > 0 ? 'success' : 'danger'">{{ food.stock > 0 ? '可下单' : '缺货' }}</el-tag>
            </div>

            <div class="food-card__price">￥{{ money(food.price) }}</div>
            <div class="food-card__stock">库存：{{ food.stock }}</div>
            <div class="food-card__desc">{{ food.description || '暂无描述' }}</div>

            <div class="food-card__footer">
              <el-input-number v-model="qtyMap[food.id]" :min="1" :disabled="food.stock <= 0" />
              <el-button type="primary" :disabled="food.stock <= 0" @click="handleAddToCart(food)">加入购物车</el-button>
            </div>
          </div>
        </div>

        <el-empty v-else description="当前没有可展示的菜品" />
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getFoodItemList } from '@/api/foodItem'
import { useCartStore } from '@/stores/cart'
import type { FoodItemItem } from '@/types'

const router = useRouter()
const cartStore = useCartStore()

const loading = ref(false)
const dependencyWarning = ref('')
const keyword = ref('')
const foods = ref<FoodItemItem[]>([])
const qtyMap = ref<Record<number, number>>({})

function money(value: number | string | undefined): string {
  return Number(value || 0).toFixed(2)
}

const filteredFoods = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  if (!text) return foods.value
  return foods.value.filter((item) => item.name?.toLowerCase().includes(text))
})

function initQtyMap(): void {
  const map: Record<number, number> = {}
  foods.value.forEach((food) => {
    map[food.id] = qtyMap.value[food.id] || 1
  })
  qtyMap.value = map
}

async function loadItems(): Promise<void> {
  loading.value = true
  dependencyWarning.value = ''
  try {
    const res = await getFoodItemList({ name: '', categoryId: undefined, isOnSale: 1, pageNum: 1, pageSize: 200 })
    foods.value = res.data?.records || []
    initQtyMap()
    cartStore.syncItems(foods.value)
    if (!foods.value.length) {
      dependencyWarning.value = '当前已成功调用 /food/item/list，但没有查到可用于下单的上架菜品。'
    }
  } catch {
    foods.value = []
    dependencyWarning.value = '后端当前没有公开的用户端菜品浏览接口。本页尝试复用 /food/item/list 时失败，请确认是否允许用户侧访问，或补充专用接口。'
  } finally {
    loading.value = false
  }
}

function handleAddToCart(food: FoodItemItem): void {
  const quantity = Math.max(1, Number(qtyMap.value[food.id] || 1))
  const added = cartStore.addItem(food, quantity)
  if (added <= 0) {
    ElMessage.warning('当前菜品库存不足，无法加入购物车')
    return
  }
  qtyMap.value[food.id] = 1
  ElMessage.success(`已加入购物车：${food.name} × ${added}`)
}

onMounted(async () => {
  await loadItems()
})
</script>

<style scoped>
.order-create-page { display: flex; flex-direction: column; gap: 18px; }
.summary-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.loading-box { padding: 8px 4px; }
.food-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.food-card {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255,255,255,0.82);
  border: 1px solid rgba(148,163,184,0.14);
  box-shadow: var(--shadow-soft);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.food-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}
.food-card__title { font-size: 18px; font-weight: 800; }
.food-card__category { margin-top: 6px; color: var(--text-secondary); font-size: 12px; }
.food-card__price { font-size: 24px; font-weight: 800; color: var(--brand-deep); }
.food-card__stock { color: var(--text-secondary); font-size: 13px; }
.food-card__desc { color: var(--text-main); line-height: 1.7; min-height: 44px; white-space: pre-wrap; }
.food-card__footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
