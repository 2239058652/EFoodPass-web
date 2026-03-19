<template>
  <el-card class="page-card page-hero gradient-warm" shadow="never">
    <div class="page-hero__title">角色管理</div>
    <div class="page-hero__desc">角色是权限汇聚的核心层。你可以在这里维护角色编码、状态，并统一分配权限集合。</div>
    <div class="page-hero__meta">
      <div class="hero-badge">角色编码</div>
      <div class="hero-badge">权限分配</div>
      <div class="hero-badge">状态管理</div>
    </div>
  </el-card>

  <el-card class="page-card" shadow="never">
    <div class="section-head">
      <div class="section-head-left">
        <div class="panel-title">筛选条件</div>
        <div class="panel-desc">支持角色编码模糊查询和状态筛选。</div>
      </div>
    </div>
    <el-form :model="queryForm" inline class="filter-form">
      <div class="toolbar">
        <el-form-item label="角色编码"><el-input v-model="queryForm.roleCode" placeholder="支持模糊查询" clearable /></el-form-item>
        <el-form-item label="状态"><el-select v-model="queryForm.status" placeholder="全部" clearable style="width: 140px"><el-option v-for="item in STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
      </div>
      <div class="toolbar">
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button v-if="hasPermission('system:role:add')" type="success" @click="openCreate">新增角色</el-button>
      </div>
    </el-form>
  </el-card>

  <el-card class="page-card" shadow="never">
    <div class="section-head">
      <div class="section-head-left">
        <div class="panel-title">角色列表</div>
        <div class="panel-desc">当前页面兼容后端普通列表和分页返回两种结构，后续后端升级分页时前端不用再大改。</div>
      </div>
    </div>
    <el-table :data="tableData" class="soft-table" v-loading="loading">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="roleCode" label="角色编码" min-width="180" />
      <el-table-column prop="roleName" label="角色名称" min-width="180" />
      <el-table-column label="权限数" width="100"><template #default="{ row }">{{ row.permissionIds?.length || 0 }}</template></el-table-column>
      <el-table-column label="状态" width="110"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'" class="status-pill">{{ getStatusLabel(row.status) }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="340" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row.id)">编辑</el-button>
          <el-button link type="primary" @click="openAssignPermission(row.id)">分配权限</el-button>
          <el-button v-if="hasPermission('system:role:update')" link type="primary" @click="changeStatus(row)">{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
          <el-button v-if="hasPermission('system:role:delete')" link type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="showPagination" style="display:flex; justify-content:flex-end; margin-top: 18px">
      <el-pagination background layout="total, sizes, prev, pager, next, jumper" v-model:current-page="queryForm.pageNum" v-model:page-size="queryForm.pageSize" :page-sizes="[10,20,50]" :total="total" @size-change="getList" @current-change="getList" />
    </div>
  </el-card>

  <el-dialog v-model="editVisible" :title="formMode === 'create' ? '新增角色' : '编辑角色'" width="560px">
    <div class="dialog-note">建议角色编码使用稳定、可读的英文标识，避免频繁修改。</div>
    <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="90px">
      <el-form-item label="角色编码" prop="roleCode" v-if="formMode === 'create'"><el-input v-model="editForm.roleCode" /></el-form-item>
      <el-form-item label="角色名称" prop="roleName"><el-input v-model="editForm.roleName" /></el-form-item>
      <el-form-item label="状态" prop="status"><el-radio-group v-model="editForm.status"><el-radio :value="1">启用</el-radio><el-radio :value="0">禁用</el-radio></el-radio-group></el-form-item>
    </el-form>
    <template #footer><el-button @click="editVisible = false">取消</el-button><el-button type="primary" :loading="submitLoading" @click="submitEdit">确定</el-button></template>
  </el-dialog>

  <el-dialog v-model="permissionVisible" title="分配权限" width="600px">
    <div class="dialog-note">提交后会同步更新角色与权限的关联关系。</div>
    <el-form label-width="90px">
      <el-form-item label="角色ID"><span>{{ permissionForm.roleId }}</span></el-form-item>
      <el-form-item label="权限选择"><el-checkbox-group v-model="permissionForm.permissionIds"><el-checkbox v-for="item in allPermissions" :key="item.id" :value="item.id" :label="item.permName + ' (' + item.permCode + ')'" /></el-checkbox-group></el-form-item>
    </el-form>
    <template #footer><el-button @click="permissionVisible = false">取消</el-button><el-button type="primary" :loading="submitLoading" @click="submitPermissionAssign">确定</el-button></template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { ApiResponse, PageResult, PermissionItem, RoleForm, RoleItem, RoleQuery } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { assignRolePermission, createRole, deleteRole, getRoleDetail, getRoleList, updateRole, updateRoleStatus } from '@/api/role'
import { getPermissionList } from '@/api/permission'
import { getStatusLabel, STATUS_OPTIONS } from '@/utils/constants'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<RoleItem[]>([])
const allPermissions = ref<PermissionItem[]>([])
const total = ref(0)
const queryForm = reactive<RoleQuery>({ roleCode: '', status: undefined, pageNum: 1, pageSize: 10 })
const formMode = ref('create')
const editVisible = ref(false)
const editFormRef = ref<FormInstance>()
const editForm = reactive<RoleForm>({ id: undefined, roleCode: '', roleName: '', status: 1 })
const editRules: FormRules<RoleForm> = { roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }], roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }], status: [{ required: true, message: '请选择状态', trigger: 'change' }] }
const permissionVisible = ref(false)
const permissionForm = reactive<{ roleId?: number; permissionIds: number[] }>({ roleId: undefined, permissionIds: [] })
const hasPermission = (code: string): boolean => authStore.hasPermission(code)
const showPagination = computed(() => total.value > 0)

function normalizeListResponse<T>(payload: ApiResponse<T[] | PageResult<T>>): { list: T[]; total: number } {
  if (Array.isArray(payload.data)) {
    return { list: payload.data, total: 0 }
  }
  return { list: payload.data?.records || [], total: payload.data?.total || 0 }
}

async function loadPermissions() {
  const res = await getPermissionList({ pageNum: 1, pageSize: 999 })
  allPermissions.value = Array.isArray(res.data) ? res.data : res.data?.records || []
}
async function getList() {
  loading.value = true
  try {
    const res = await getRoleList(queryForm)
    const normalized = normalizeListResponse(res)
    tableData.value = normalized.list
    total.value = normalized.total
  } finally {
    loading.value = false
  }
}
function handleSearch() { queryForm.pageNum = 1; getList() }
function handleReset() { queryForm.roleCode = ''; queryForm.status = undefined; queryForm.pageNum = 1; queryForm.pageSize = 10; getList() }
function resetEditForm() { Object.assign(editForm, { id: undefined, roleCode: '', roleName: '', status: 1 }) }
function openCreate() { formMode.value = 'create'; resetEditForm(); editVisible.value = true }
async function openEdit(id: number): Promise<void> { formMode.value = 'edit'; resetEditForm(); const res = await getRoleDetail(id); Object.assign(editForm, { id: res.data.id, roleName: res.data.roleName, status: res.data.status }); editVisible.value = true }
function submitEdit(): void { editFormRef.value?.validate(async (valid: boolean) => { if (!valid) return; submitLoading.value = true; try { if (formMode.value === 'create') { await createRole({ roleCode: editForm.roleCode, roleName: editForm.roleName, status: editForm.status }); ElMessage.success('新增成功') } else { await updateRole({ id: editForm.id, roleName: editForm.roleName, status: editForm.status }); ElMessage.success('更新成功') } editVisible.value = false; getList() } finally { submitLoading.value = false } }) }
async function openAssignPermission(id: number): Promise<void> { await loadPermissions(); const res = await getRoleDetail(id); permissionForm.roleId = id; permissionForm.permissionIds = res.data.permissionIds || []; permissionVisible.value = true }
async function submitPermissionAssign() { submitLoading.value = true; try { await assignRolePermission(permissionForm); ElMessage.success('分配成功'); permissionVisible.value = false } finally { submitLoading.value = false } }
async function changeStatus(row: RoleItem): Promise<void> { await updateRoleStatus({ roleId: row.id, status: row.status === 1 ? 0 : 1 }); ElMessage.success('状态已更新'); getList() }
async function handleDelete(id: number): Promise<void> { await ElMessageBox.confirm('确认删除该角色？', '提示', { type: 'warning' }); await deleteRole(id); ElMessage.success('删除成功'); getList() }
onMounted(async () => { await Promise.all([loadPermissions(), getList()]) })
</script>
