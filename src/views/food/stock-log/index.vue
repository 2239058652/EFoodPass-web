<template>
  <el-card class="page-card page-hero gradient-warm" shadow="never">
    <div class="page-hero__title">库存流水</div>
    <div class="page-hero__desc">
      对接后端 <code>/food/stock-log/list</code>，用于查看菜品库存变动记录。当前后端提供了按菜品和变动类型分页查询的能力，适合排查库存变化来源。
    </div>
    <div class="page-hero__meta">
      <div class="hero-badge">分页查询</div>
      <div class="hero-badge">按菜品筛选</div>
      <div class="hero-badge">按变动类型筛选</div>
    </div>
  </el-card>

  <el-card class="page-card" shadow="never">
    <div class="section-head">
      <div class="section-head-left">
        <div class="panel-title">筛选条件</div>
        <div class="panel-desc">支持按菜品与库存变动类型检索。</div>
      </div>
    </div>

    <el-form :model="queryForm" inline class="filter-form">
      <div class="toolbar">
        <el-form-item label="菜品名称">
          <el-select v-model="queryForm.foodItemId" placeholder="全部菜品" clearable filterable style="width: 220px">
            <el-option v-for="item in itemOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="变动类型">
          <el-select v-model="queryForm.changeType" placeholder="全部类型" clearable style="width: 180px">
            <el-option v-for="item in STOCK_CHANGE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </div>
      <div class="toolbar">
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-form>
  </el-card>

  <el-card class="page-card" shadow="never">
    <div class="section-head">
      <div class="section-head-left">
        <div class="panel-title">库存流水列表</div>
        <div class="panel-desc">当前共 {{ total }} 条库存变动记录。</div>
      </div>
    </div>

    <el-table :data="tableData" class="soft-table" v-loading="loading">
      <el-table-column prop="id" label="ID" width="88" />
      <el-table-column prop="foodItemName" label="菜品名称" min-width="160" />
      <el-table-column label="变动类型" width="140">
        <template #default="{ row }">
          <el-tag :type="getChangeTagType(row.changeType)" class="status-pill">
            {{ getStockChangeTypeLabel(row.changeType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="变动数量" width="120">
        <template #default="{ row }">
          <span :class="row.changeAmount >= 0 ? 'num-positive' : 'num-negative'">
            {{ row.changeAmount > 0 ? `+${row.changeAmount}` : row.changeAmount }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="beforeStock" label="变动前库存" width="120" />
      <el-table-column prop="afterStock" label="变动后库存" width="120" />
      <el-table-column prop="bizId" label="业务ID" width="120" />
      <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="创建时间" min-width="180" />
    </el-table>

    <div style="display:flex; justify-content:flex-end; margin-top: 18px">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        v-model:current-page="queryForm.pageNum"
        v-model:page-size="queryForm.pageSize"
        :page-sizes="[10,20,50]"
        :total="total"
        @size-change="getList"
        @current-change="getList"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { getFoodItemList } from '@/api/foodItem'
import { getFoodStockLogList } from '@/api/foodStockLog'
import type { FoodItemItem, FoodStockLogItem, FoodStockLogQuery } from '@/types'
import { STOCK_CHANGE_TYPE_OPTIONS, getStockChangeTypeLabel } from '@/utils/constants'

const loading = ref(false)
const total = ref(0)
const tableData = ref<FoodStockLogItem[]>([])
const itemOptions = ref<FoodItemItem[]>([])
const queryForm = reactive<FoodStockLogQuery>({
  foodItemId: undefined,
  changeType: undefined,
  pageNum: 1,
  pageSize: 10
})

function getChangeTagType(changeType?: number): 'success' | 'warning' | 'danger' | 'info' {
  if (changeType === 1) return 'danger'
  if (changeType === 2) return 'success'
  if (changeType === 3) return 'warning'
  return 'info'
}

async function loadItemOptions() {
  const res = await getFoodItemList({ name: '', categoryId: undefined, isOnSale: undefined, pageNum: 1, pageSize: 200 })
  itemOptions.value = res.data?.records || []
}

async function getList() {
  loading.value = true
  try {
    const res = await getFoodStockLogList(queryForm)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryForm.pageNum = 1
  getList()
}

function handleReset() {
  queryForm.foodItemId = undefined
  queryForm.changeType = undefined
  queryForm.pageNum = 1
  queryForm.pageSize = 10
  getList()
}

onMounted(async () => {
  await Promise.all([loadItemOptions(), getList()])
})
</script>

<style scoped>
.num-positive {
  color: #1f9d73;
  font-weight: 700;
}
.num-negative {
  color: #df5f5f;
  font-weight: 700;
}
.page-hero code {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.55);
  color: #6c4e2c;
}
</style>
