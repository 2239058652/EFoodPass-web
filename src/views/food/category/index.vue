<template>
  <el-card class="page-card page-hero gradient-warm" shadow="never">
    <div class="page-hero__title">分类管理</div>
    <div class="page-hero__desc">对应后端 <code>/food/category</code> 模块，用于维护家庭点餐系统里的菜品分类，支持分页、状态切换和基础信息维护。</div>
    <div class="page-hero__meta">
      <div class="hero-badge">分页查询</div>
      <div class="hero-badge">状态管理</div>
      <div class="hero-badge">温和轻科技风格</div>
    </div>
  </el-card>

  <el-card class="page-card" shadow="never">
    <div class="section-head">
      <div class="section-head-left">
        <div class="panel-title">筛选条件</div>
        <div class="panel-desc">按分类名称和启用状态筛选。</div>
      </div>
    </div>
    <el-form :model="queryForm" inline class="filter-form">
      <div class="toolbar">
        <el-form-item label="分类名称"><el-input v-model="queryForm.name" placeholder="支持模糊查询" clearable /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="item in STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </div>
      <div class="toolbar">
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button v-if="hasPermission('food:category:add')" type="success" @click="openCreate">新增分类</el-button>
      </div>
    </el-form>
  </el-card>

  <el-card class="page-card" shadow="never">
    <div class="section-head">
      <div class="section-head-left">
        <div class="panel-title">分类列表</div>
        <div class="panel-desc">当前共 {{ total }} 条分类记录。</div>
      </div>
    </div>
    <el-table :data="tableData" class="soft-table" v-loading="loading">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="name" label="分类名称" min-width="200" />
      <el-table-column prop="sortNo" label="排序号" width="120" />
      <el-table-column label="状态" width="120">
        <template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'" class="status-pill">{{ getStatusLabel(row.status) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" min-width="180" />
      <el-table-column label="操作" width="320" fixed="right">
        <template #default="{ row }">
          <el-button v-if="hasPermission('food:category:update')" link type="primary" @click="openEdit(row.id)">编辑</el-button>
          <el-button v-if="hasPermission('food:category:update-status')" link type="warning" @click="changeStatus(row)">{{ row.status === 1 ? '停用' : '启用' }}</el-button>
          <el-button v-if="hasPermission('food:category:delete')" link type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div style="display:flex; justify-content:flex-end; margin-top: 18px">
      <el-pagination background layout="total, sizes, prev, pager, next, jumper" v-model:current-page="queryForm.pageNum" v-model:page-size="queryForm.pageSize" :page-sizes="[10,20,50]" :total="total" @size-change="getList" @current-change="getList" />
    </div>
  </el-card>

  <el-dialog v-model="editVisible" :title="formMode === 'create' ? '新增分类' : '编辑分类'" width="520px">
    <div class="dialog-note">分类名称和排序号会直接影响菜品维护时的选择体验。</div>
    <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="90px">
      <el-form-item label="分类名称" prop="name"><el-input v-model="editForm.name" /></el-form-item>
      <el-form-item label="排序号" prop="sortNo"><el-input-number v-model="editForm.sortNo" :min="0" class="w-100" /></el-form-item>
      <el-form-item label="状态" prop="status"><el-radio-group v-model="editForm.status"><el-radio :value="1">启用</el-radio><el-radio :value="0">停用</el-radio></el-radio-group></el-form-item>
    </el-form>
    <template #footer><el-button @click="editVisible = false">取消</el-button><el-button type="primary" :loading="submitLoading" @click="submitEdit">确定</el-button></template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { createFoodCategory, deleteFoodCategory, getFoodCategoryDetail, getFoodCategoryList, updateFoodCategory, updateFoodCategoryStatus } from '@/api/foodCategory'
import { useAuthStore } from '@/stores/auth'
import type { FoodCategoryForm, FoodCategoryItem, FoodCategoryQuery } from '@/types'
import { getStatusLabel, STATUS_OPTIONS } from '@/utils/constants'

const authStore = useAuthStore()
const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<FoodCategoryItem[]>([])
const total = ref(0)
const editVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editFormRef = ref<FormInstance>()
const queryForm = reactive<FoodCategoryQuery>({ name: '', status: undefined, pageNum: 1, pageSize: 10 })
const editForm = reactive<FoodCategoryForm>({ id: undefined, name: '', sortNo: 0, status: 1 })
const editRules: FormRules<FoodCategoryForm> = { name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }], status: [{ required: true, message: '请选择状态', trigger: 'change' }] }

const hasPermission = (code: string): boolean => authStore.hasPermission(code)

async function getList() {
  loading.value = true
  try {
    const res = await getFoodCategoryList(queryForm)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}
function handleSearch() { queryForm.pageNum = 1; getList() }
function handleReset() { queryForm.name = ''; queryForm.status = undefined; queryForm.pageNum = 1; queryForm.pageSize = 10; getList() }
function resetEditForm() { Object.assign(editForm, { id: undefined, name: '', sortNo: 0, status: 1 }) }
function openCreate() { formMode.value = 'create'; resetEditForm(); editVisible.value = true }
async function openEdit(id: number) { const res = await getFoodCategoryDetail(id); formMode.value = 'edit'; Object.assign(editForm, res.data); editVisible.value = true }
function submitEdit() {
  editFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    submitLoading.value = true
    try {
      if (formMode.value === 'create') { await createFoodCategory(editForm); ElMessage.success('分类新增成功') }
      else { await updateFoodCategory(editForm); ElMessage.success('分类更新成功') }
      editVisible.value = false
      getList()
    } finally { submitLoading.value = false }
  })
}
async function changeStatus(row: FoodCategoryItem) { await updateFoodCategoryStatus({ categoryId: row.id, status: row.status === 1 ? 0 : 1 }); ElMessage.success('状态已更新'); getList() }
async function handleDelete(id: number) { await ElMessageBox.confirm('确认删除该分类？', '提示', { type: 'warning' }); await deleteFoodCategory(id); ElMessage.success('删除成功'); getList() }
onMounted(getList)
</script>
