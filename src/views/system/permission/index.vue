<template>
  <el-card class="page-card page-hero gradient-blue" shadow="never">
    <div class="page-hero__title">权限管理</div>
    <div class="page-hero__desc">维护权限编码、权限类型、请求路径与方法，为后端接口鉴权和页面能力控制提供统一基础。</div>
    <div class="page-hero__meta">
      <div class="hero-badge">接口权限</div>
      <div class="hero-badge">按钮权限</div>
      <div class="hero-badge">状态控制</div>
    </div>
  </el-card>

  <el-card class="page-card" shadow="never">
    <div class="section-head">
      <div class="section-head-left">
        <div class="panel-title">筛选条件</div>
        <div class="panel-desc">支持权限编码模糊查询和状态筛选。</div>
      </div>
    </div>
    <el-form :model="queryForm" inline class="filter-form">
      <div class="toolbar">
        <el-form-item label="权限编码"><el-input v-model="queryForm.permCode" placeholder="支持模糊查询"
            clearable /></el-form-item>
        <el-form-item label="状态"><el-select v-model="queryForm.status" placeholder="全部" clearable
            style="width: 140px"><el-option v-for="item in STATUS_OPTIONS" :key="item.value" :label="item.label"
              :value="item.value" /></el-select></el-form-item>
      </div>
      <div class="toolbar">
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button v-if="hasPermission('system:permission:add')" type="success" @click="openCreate">新增权限</el-button>
      </div>
    </el-form>
  </el-card>

  <el-card class="page-card" shadow="never">
    <div class="section-head">
      <div class="section-head-left">
        <div class="panel-title">权限列表</div>
        <div class="panel-desc">权限类型、请求路径与请求方法集中展示，同时兼容后端当前普通列表和后续分页改造。</div>
      </div>
    </div>
    <el-table :data="tableData" class="soft-table" v-loading="loading">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="permCode" label="权限编码" min-width="180" />
      <el-table-column prop="permName" label="权限名称" min-width="160" />
      <el-table-column label="权限类型" width="120">
        <template #default="{ row }"><el-tag class="code-pill">{{ PERMISSION_TYPE_MAP[row.permType] || '-'
            }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="path" label="请求路径" min-width="220" />
      <el-table-column prop="method" label="请求方法" width="120" />
      <el-table-column label="状态" width="110"><template #default="{ row }"><el-tag
            :type="row.status === 1 ? 'success' : 'info'" class="status-pill">{{ getStatusLabel(row.status)
            }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="320" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row.id)">编辑</el-button>
          <el-button v-if="hasPermission('system:permission:update')" link type="primary" @click="changeStatus(row)">{{
            row.status === 1 ? '禁用' : '启用' }}</el-button>
          <el-button v-if="hasPermission('system:permission:delete')" link type="danger"
            @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="showPagination" style="display:flex; justify-content:flex-end; margin-top: 18px">
      <el-pagination background layout="total, sizes, prev, pager, next, jumper"
        v-model:current-page="queryForm.pageNum" v-model:page-size="queryForm.pageSize" :page-sizes="[10, 20, 50]"
        :total="total" @size-change="getList" @current-change="getList" />
    </div>
  </el-card>

  <el-dialog v-model="editVisible" :title="formMode === 'create' ? '新增权限' : '编辑权限'" width="620px">
    <div class="dialog-note">权限编码建议长期稳定，权限类型与请求路径需要与后端鉴权规则一致。</div>
    <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="96px">
      <el-form-item label="权限编码" prop="permCode" v-if="formMode === 'create'"><el-input
          v-model="editForm.permCode" /></el-form-item>
      <el-form-item label="权限名称" prop="permName"><el-input v-model="editForm.permName" /></el-form-item>
      <el-form-item label="权限类型" prop="permType">
        <el-select v-model="editForm.permType" class="w-100">
          <el-option v-for="item in PERMISSION_TYPE_OPTIONS" :key="item.value" :label="item.label"
            :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="请求路径"><el-input v-model="editForm.path" placeholder="例如 /system/user/list" /></el-form-item>
      <el-form-item label="请求方法"><el-input v-model="editForm.method" placeholder="例如 GET / POST / PUT" /></el-form-item>
      <el-form-item label="状态" prop="status"><el-radio-group v-model="editForm.status"><el-radio
            :value="1">启用</el-radio><el-radio :value="0">禁用</el-radio></el-radio-group></el-form-item>
    </el-form>
    <template #footer><el-button @click="editVisible = false">取消</el-button><el-button type="primary"
        :loading="submitLoading" @click="submitEdit">确定</el-button></template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { ApiResponse, PageResult, PermissionForm, PermissionItem, PermissionQuery } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createPermission, deletePermission, getPermissionDetail, getPermissionList, updatePermission, updatePermissionStatus } from '@/api/permission'
import { getStatusLabel, PERMISSION_TYPE_MAP, PERMISSION_TYPE_OPTIONS, STATUS_OPTIONS } from '@/utils/constants'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<PermissionItem[]>([])
const total = ref(0)
const queryForm = reactive<PermissionQuery>({ permCode: '', status: undefined, pageNum: 1, pageSize: 10 })
const formMode = ref('create')
const editVisible = ref(false)
const editFormRef = ref<FormInstance>()
const editForm = reactive<PermissionForm>({ id: undefined, permCode: '', permName: '', permType: 3, path: '', method: '', status: 1 })
const editRules: FormRules<PermissionForm> = { permCode: [{ required: true, message: '请输入权限编码', trigger: 'blur' }], permName: [{ required: true, message: '请输入权限名称', trigger: 'blur' }], permType: [{ required: true, message: '请选择权限类型', trigger: 'change' }], status: [{ required: true, message: '请选择状态', trigger: 'change' }] }
const hasPermission = (code: string): boolean => authStore.hasPermission(code)
const showPagination = computed(() => total.value > 0)

function normalizeListResponse<T>(payload: ApiResponse<T[] | PageResult<T>>): { list: T[]; total: number } {
  if (Array.isArray(payload.data)) {
    return { list: payload.data, total: 0 }
  }
  return { list: payload.data?.records || [], total: payload.data?.total || 0 }
}

async function getList() {
  loading.value = true
  try {
    const res = await getPermissionList(queryForm)
    const normalized = normalizeListResponse(res)
    tableData.value = normalized.list
    total.value = normalized.total
  } finally {
    loading.value = false
  }
}
function handleSearch() { queryForm.pageNum = 1; getList() }
function handleReset() { queryForm.permCode = ''; queryForm.status = undefined; queryForm.pageNum = 1; queryForm.pageSize = 10; getList() }
function resetEditForm() { Object.assign(editForm, { id: undefined, permCode: '', permName: '', permType: 3, path: '', method: '', status: 1 }) }
function openCreate() { formMode.value = 'create'; resetEditForm(); editVisible.value = true }
async function openEdit(id: number): Promise<void> { formMode.value = 'edit'; resetEditForm(); const res = await getPermissionDetail(id); Object.assign(editForm, { id: res.data.id, permName: res.data.permName, permType: res.data.permType, path: res.data.path, method: res.data.method, status: res.data.status }); editVisible.value = true }
function submitEdit(): void { editFormRef.value?.validate(async (valid: boolean) => { if (!valid) return; submitLoading.value = true; try { if (formMode.value === 'create') { await createPermission({ permCode: editForm.permCode, permName: editForm.permName, permType: editForm.permType, path: editForm.path, method: editForm.method, status: editForm.status }); ElMessage.success('新增成功') } else { await updatePermission({ id: editForm.id, permName: editForm.permName, permType: editForm.permType, path: editForm.path, method: editForm.method, status: editForm.status }); ElMessage.success('更新成功') } editVisible.value = false; getList() } finally { submitLoading.value = false } }) }
async function changeStatus(row: PermissionItem): Promise<void> { await updatePermissionStatus({ permissionId: row.id, status: row.status === 1 ? 0 : 1 }); ElMessage.success('状态已更新'); getList() }
async function handleDelete(id: number): Promise<void> { await ElMessageBox.confirm('确认删除该权限？', '提示', { type: 'warning' }); await deletePermission(id); ElMessage.success('删除成功'); getList() }
onMounted(getList)
</script>
