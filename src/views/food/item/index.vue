<template>
  <el-card class="page-card page-hero gradient-blue" shadow="never">
    <div class="page-hero__title">菜品管理</div>
    <div class="page-hero__desc">严格对应后端 <code>/food/item</code> 模块。新增/编辑、上下架、调整库存已拆成独立动作，避免把不同语义混成一个更新流程。</div>
    <div class="page-hero__meta">
      <div class="hero-badge">新增 / 编辑</div>
      <div class="hero-badge">上下架</div>
      <div class="hero-badge">调整库存</div>
    </div>
  </el-card>

  <el-card class="page-card" shadow="never">
    <div class="section-head">
      <div class="section-head-left">
        <div class="panel-title">筛选条件</div>
        <div class="panel-desc">支持菜品名称、所属分类和上下架状态筛选。</div>
      </div>
    </div>
    <el-form :model="queryForm" inline class="filter-form">
      <div class="toolbar">
        <el-form-item label="菜品名称"><el-input v-model="queryForm.name" placeholder="支持模糊查询" clearable /></el-form-item>
        <el-form-item label="分类">
          <el-select v-model="queryForm.categoryId" placeholder="全部分类" clearable style="width: 180px">
            <el-option v-for="item in categoryOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="上下架">
          <el-select v-model="queryForm.isOnSale" placeholder="全部" clearable style="width: 140px">
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
          </el-select>
        </el-form-item>
      </div>
      <div class="toolbar">
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button v-if="hasPermission('food:item:add')" type="success" @click="openCreate">新增菜品</el-button>
      </div>
    </el-form>
  </el-card>

  <el-card class="page-card" shadow="never">
    <div class="section-head">
      <div class="section-head-left">
        <div class="panel-title">菜品列表</div>
        <div class="panel-desc">当前共 {{ total }} 条菜品记录。</div>
      </div>
    </div>
    <el-table :data="tableData" class="soft-table" v-loading="loading">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="name" label="菜品名称" min-width="160" />
      <el-table-column prop="categoryName" label="所属分类" min-width="140" />
      <el-table-column label="价格" width="120">
        <template #default="{ row }">￥{{ Number(row.price || 0).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="100" />
      <el-table-column label="上下架" width="120">
        <template #default="{ row }"><el-tag :type="row.isOnSale === 1 ? 'success' : 'info'" class="status-pill">{{ row.isOnSale === 1 ? '上架' : '下架' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
      <el-table-column label="操作" width="420" fixed="right">
        <template #default="{ row }">
          <el-button v-if="hasPermission('food:item:detail')" link type="info" @click="openDetail(row.id)">详情</el-button>
          <el-button v-if="hasPermission('food:item:update')" link type="primary" @click="openEdit(row.id)">编辑</el-button>
          <el-button v-if="hasPermission('food:item:update-on-sale')" link type="warning" @click="changeOnSale(row)">{{ row.isOnSale === 1 ? '下架' : '上架' }}</el-button>
          <el-button v-if="hasPermission('food:item:update-stock')" link type="success" @click="openStock(row)">调整库存</el-button>
          <el-button v-if="hasPermission('food:item:delete')" link type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div style="display:flex; justify-content:flex-end; margin-top: 18px">
      <el-pagination background layout="total, sizes, prev, pager, next, jumper" v-model:current-page="queryForm.pageNum" v-model:page-size="queryForm.pageSize" :page-sizes="[10,20,50]" :total="total" @size-change="getList" @current-change="getList" />
    </div>
  </el-card>

  <el-dialog v-model="editVisible" :title="formMode === 'create' ? '新增菜品' : '编辑菜品'" width="620px">
    <div class="dialog-note">创建和基础编辑对应后端 <code>POST /food/item</code> 与 <code>PUT /food/item</code>。</div>
    <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
      <el-form-item label="所属分类" prop="categoryId">
        <el-select v-model="editForm.categoryId" placeholder="请选择分类" class="w-100">
          <el-option v-for="item in categoryOptions" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="菜品名称" prop="name"><el-input v-model="editForm.name" /></el-form-item>
      <el-form-item label="价格" prop="price"><el-input-number v-model="editForm.price" :min="0" :precision="2" class="w-100" /></el-form-item>
      <el-form-item label="库存" prop="stock"><el-input-number v-model="editForm.stock" :min="0" class="w-100" /></el-form-item>
      <el-form-item label="上下架" prop="isOnSale"><el-radio-group v-model="editForm.isOnSale"><el-radio :value="1">上架</el-radio><el-radio :value="0">下架</el-radio></el-radio-group></el-form-item>
      <el-form-item label="描述"><el-input v-model="editForm.description" type="textarea" :rows="4" maxlength="200" show-word-limit /></el-form-item>
    </el-form>
    <template #footer><el-button @click="editVisible = false">取消</el-button><el-button type="primary" :loading="submitLoading" @click="submitEdit">确定</el-button></template>
  </el-dialog>

  <el-dialog v-model="stockVisible" title="调整库存" width="520px">
    <div class="dialog-note">该动作单独调用 <code>PUT /food/item/stock</code>，请求字段为 <code>itemId</code>、<code>stock</code>、<code>remark</code>。</div>
    <el-form ref="stockFormRef" :model="stockForm" :rules="stockRules" label-width="92px">
      <el-form-item label="菜品名称"><el-input :model-value="stockTargetName" disabled /></el-form-item>
      <el-form-item label="新库存" prop="stock"><el-input-number v-model="stockForm.stock" :min="0" class="w-100" /></el-form-item>
      <el-form-item label="备注"><el-input v-model="stockForm.remark" type="textarea" :rows="4" maxlength="200" show-word-limit /></el-form-item>
    </el-form>
    <template #footer><el-button @click="stockVisible = false">取消</el-button><el-button type="primary" :loading="stockLoading" @click="submitStock">提交</el-button></template>
  </el-dialog>

  <el-drawer v-model="detailVisible" title="菜品详情" size="460px">
    <el-descriptions :column="1" border v-if="detailData">
      <el-descriptions-item label="ID">{{ detailData.id }}</el-descriptions-item>
      <el-descriptions-item label="分类">{{ detailData.categoryName }}</el-descriptions-item>
      <el-descriptions-item label="名称">{{ detailData.name }}</el-descriptions-item>
      <el-descriptions-item label="价格">￥{{ Number(detailData.price || 0).toFixed(2) }}</el-descriptions-item>
      <el-descriptions-item label="库存">{{ detailData.stock }}</el-descriptions-item>
      <el-descriptions-item label="上下架">{{ detailData.isOnSale === 1 ? '上架' : '下架' }}</el-descriptions-item>
      <el-descriptions-item label="描述">{{ detailData.description || '-' }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ detailData.createdAt || '-' }}</el-descriptions-item>
      <el-descriptions-item label="更新时间">{{ detailData.updatedAt || '-' }}</el-descriptions-item>
    </el-descriptions>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { createFoodItem, deleteFoodItem, getFoodItemDetail, getFoodItemList, updateFoodItem, updateFoodItemOnSale, updateFoodItemStock } from '@/api/foodItem'
import { getFoodCategoryList } from '@/api/foodCategory'
import { useAuthStore } from '@/stores/auth'
import type { FoodCategoryItem, FoodItemForm, FoodItemItem, FoodItemQuery, FoodItemStockForm } from '@/types'

const authStore = useAuthStore()
const loading = ref(false)
const submitLoading = ref(false)
const stockLoading = ref(false)
const tableData = ref<FoodItemItem[]>([])
const total = ref(0)
const categoryOptions = ref<FoodCategoryItem[]>([])
const editVisible = ref(false)
const stockVisible = ref(false)
const detailVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const detailData = ref<FoodItemItem | null>(null)
const editFormRef = ref<FormInstance>()
const stockFormRef = ref<FormInstance>()
const stockTargetName = ref('')
const queryForm = reactive<FoodItemQuery>({ name: '', categoryId: undefined, isOnSale: undefined, pageNum: 1, pageSize: 10 })
const editForm = reactive<FoodItemForm>({ id: undefined, categoryId: undefined, name: '', price: 0, stock: 0, isOnSale: 1, description: '' })
const stockForm = reactive<FoodItemStockForm>({ itemId: 0, stock: 0, remark: '' })
const editRules: FormRules<FoodItemForm> = { categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }], name: [{ required: true, message: '请输入菜品名称', trigger: 'blur' }], price: [{ required: true, message: '请输入价格', trigger: 'change' }], stock: [{ required: true, message: '请输入库存', trigger: 'change' }], isOnSale: [{ required: true, message: '请选择上下架状态', trigger: 'change' }] }
const stockRules: FormRules<FoodItemStockForm> = { stock: [{ required: true, message: '请输入库存', trigger: 'change' }] }

const hasPermission = (code: string): boolean => authStore.hasPermission(code)

async function loadCategories() { const res = await getFoodCategoryList({ name: '', status: 1, pageNum: 1, pageSize: 200 }); categoryOptions.value = res.data?.records || [] }
async function getList() {
  loading.value = true
  try {
    const res = await getFoodItemList(queryForm)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}
function handleSearch() { queryForm.pageNum = 1; getList() }
function handleReset() { queryForm.name = ''; queryForm.categoryId = undefined; queryForm.isOnSale = undefined; queryForm.pageNum = 1; queryForm.pageSize = 10; getList() }
function resetEditForm() { Object.assign(editForm, { id: undefined, categoryId: undefined, name: '', price: 0, stock: 0, isOnSale: 1, description: '' }) }
function openCreate() { formMode.value = 'create'; resetEditForm(); editVisible.value = true }
async function openEdit(id: number) { const res = await getFoodItemDetail(id); formMode.value = 'edit'; Object.assign(editForm, res.data); editVisible.value = true }
async function openDetail(id: number) { const res = await getFoodItemDetail(id); detailData.value = res.data; detailVisible.value = true }
function openStock(row: FoodItemItem) { stockForm.itemId = row.id; stockForm.stock = row.stock; stockForm.remark = ''; stockTargetName.value = row.name; stockVisible.value = true }
function submitEdit() {
  editFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    submitLoading.value = true
    try {
      if (formMode.value === 'create') { await createFoodItem(editForm); ElMessage.success('菜品新增成功') }
      else { await updateFoodItem(editForm); ElMessage.success('菜品更新成功') }
      editVisible.value = false
      getList()
    } finally { submitLoading.value = false }
  })
}
function submitStock() {
  stockFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    stockLoading.value = true
    try {
      await updateFoodItemStock(stockForm)
      ElMessage.success('库存调整成功')
      stockVisible.value = false
      getList()
    } finally {
      stockLoading.value = false
    }
  })
}
async function changeOnSale(row: FoodItemItem) { await updateFoodItemOnSale({ itemId: row.id, isOnSale: row.isOnSale === 1 ? 0 : 1 }); ElMessage.success('上下架状态已更新'); getList() }
async function handleDelete(id: number) { await ElMessageBox.confirm('确认删除该菜品？', '提示', { type: 'warning' }); await deleteFoodItem(id); ElMessage.success('删除成功'); getList() }
onMounted(async () => { await Promise.all([loadCategories(), getList()]) })
</script>
