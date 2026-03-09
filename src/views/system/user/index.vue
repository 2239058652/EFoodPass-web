<template>
  <el-card class="page-card" shadow="never">
    <el-form :model="queryForm" inline>
      <el-form-item label="用户名"><el-input v-model="queryForm.username" placeholder="支持模糊查询" clearable /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryForm.status" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="item in STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <div class="toolbar">
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button v-if="hasPermission('system:user:add')" type="success" @click="openCreate">新增用户</el-button>
      </div>
    </el-form>
  </el-card>

  <el-card class="page-card" shadow="never">
    <el-table :data="tableData" border v-loading="loading">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="username" label="用户名" min-width="140" />
      <el-table-column prop="nickname" label="昵称" min-width="140" />
      <el-table-column prop="phone" label="手机号" min-width="140" />
      <el-table-column label="角色编码" min-width="180">
        <template #default="{ row }"><el-tag v-for="code in row.roleCodes || []" :key="code" size="small" style="margin-right: 6px">{{ code }}</el-tag></template>
      </el-table-column>
      <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ getStatusLabel(row.status) }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="420" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row.id)">编辑</el-button>
          <el-button link type="primary" @click="openAssignRole(row.id)">分配角色</el-button>
          <el-button link type="warning" @click="openResetPassword(row.id)">重置密码</el-button>
          <el-button v-if="hasPermission('system:user:update')" link type="primary" @click="changeStatus(row)">{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
          <el-button v-if="hasPermission('system:user:delete')" link type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div style="display:flex; justify-content:flex-end; margin-top: 16px">
      <el-pagination background layout="total, sizes, prev, pager, next, jumper" v-model:current-page="queryForm.pageNum" v-model:page-size="queryForm.pageSize" :page-sizes="[10,20,50]" :total="total" @size-change="getList" @current-change="getList" />
    </div>
  </el-card>

  <el-dialog v-model="editVisible" :title="formMode === 'create' ? '新增用户' : '编辑用户'" width="520px">
    <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="90px">
      <el-form-item label="用户名" prop="username" v-if="formMode === 'create'"><el-input v-model="editForm.username" /></el-form-item>
      <el-form-item label="密码" prop="password" v-if="formMode === 'create'"><el-input v-model="editForm.password" type="password" show-password /></el-form-item>
      <el-form-item label="昵称" prop="nickname"><el-input v-model="editForm.nickname" /></el-form-item>
      <el-form-item label="手机号" prop="phone"><el-input v-model="editForm.phone" /></el-form-item>
      <el-form-item label="状态" prop="status"><el-radio-group v-model="editForm.status"><el-radio :value="1">启用</el-radio><el-radio :value="0">禁用</el-radio></el-radio-group></el-form-item>
    </el-form>
    <template #footer><el-button @click="editVisible = false">取消</el-button><el-button type="primary" :loading="submitLoading" @click="submitEdit">确定</el-button></template>
  </el-dialog>

  <el-dialog v-model="roleVisible" title="分配角色" width="520px">
    <el-form label-width="90px">
      <el-form-item label="用户ID"><span>{{ roleForm.userId }}</span></el-form-item>
      <el-form-item label="角色选择"><el-checkbox-group v-model="roleForm.roleIds"><el-checkbox v-for="item in allRoles" :key="item.id" :value="item.id" :label="item.roleName + ' (' + item.roleCode + ')'" /></el-checkbox-group></el-form-item>
    </el-form>
    <template #footer><el-button @click="roleVisible = false">取消</el-button><el-button type="primary" :loading="submitLoading" @click="submitRoleAssign">确定</el-button></template>
  </el-dialog>

  <el-dialog v-model="passwordVisible" title="重置密码" width="420px">
    <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="90px">
      <el-form-item label="用户ID"><span>{{ passwordForm.userId }}</span></el-form-item>
      <el-form-item label="新密码" prop="newPassword"><el-input v-model="passwordForm.newPassword" type="password" show-password /></el-form-item>
    </el-form>
    <template #footer><el-button @click="passwordVisible = false">取消</el-button><el-button type="primary" :loading="submitLoading" @click="submitPasswordReset">确定</el-button></template>
  </el-dialog>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { assignUserRole, createUser, deleteUser, getUserDetail, getUserList, resetUserPassword, updateUser, updateUserStatus } from '@/api/user'
import { getRoleList } from '@/api/role'
import { getStatusLabel, STATUS_OPTIONS } from '@/utils/constants'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const total = ref(0)
const allRoles = ref([])
const queryForm = reactive({ username: '', status: undefined, pageNum: 1, pageSize: 10 })
const formMode = ref('create')
const editVisible = ref(false)
const editFormRef = ref()
const editForm = reactive({ id: undefined, username: '', password: '', nickname: '', phone: '', status: 1 })
const editRules = { username: [{ required: true, message: '请输入用户名', trigger: 'blur' }], password: [{ required: true, message: '请输入密码', trigger: 'blur' }], nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }], status: [{ required: true, message: '请选择状态', trigger: 'change' }] }
const roleVisible = ref(false)
const roleForm = reactive({ userId: undefined, roleIds: [] })
const passwordVisible = ref(false)
const passwordFormRef = ref()
const passwordForm = reactive({ userId: undefined, newPassword: '' })
const passwordRules = { newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }] }

const hasPermission = (code) => authStore.hasPermission(code)
async function loadRoles() { const res = await getRoleList({}); allRoles.value = Array.isArray(res.data) ? res.data : res.data?.records || [] }
async function getList() { loading.value = true; try { const res = await getUserList(queryForm); tableData.value = res.data?.records || []; total.value = res.data?.total || 0 } finally { loading.value = false } }
function handleSearch() { queryForm.pageNum = 1; getList() }
function handleReset() { queryForm.username = ''; queryForm.status = undefined; queryForm.pageNum = 1; queryForm.pageSize = 10; getList() }
function resetEditForm() { Object.assign(editForm, { id: undefined, username: '', password: '', nickname: '', phone: '', status: 1 }) }
function openCreate() { formMode.value = 'create'; resetEditForm(); editVisible.value = true }
async function openEdit(id) { formMode.value = 'edit'; resetEditForm(); const res = await getUserDetail(id); Object.assign(editForm, { id: res.data.id, nickname: res.data.nickname, phone: res.data.phone, status: res.data.status }); editVisible.value = true }
function submitEdit() { editFormRef.value.validate(async (valid) => { if (!valid) return; submitLoading.value = true; try { if (formMode.value === 'create') { await createUser({ username: editForm.username, password: editForm.password, nickname: editForm.nickname, phone: editForm.phone, status: editForm.status }); ElMessage.success('新增成功') } else { await updateUser({ id: editForm.id, nickname: editForm.nickname, phone: editForm.phone, status: editForm.status }); ElMessage.success('更新成功') } editVisible.value = false; getList() } finally { submitLoading.value = false } }) }
async function openAssignRole(id) { await loadRoles(); const res = await getUserDetail(id); roleForm.userId = id; roleForm.roleIds = res.data.roleIds || []; roleVisible.value = true }
async function submitRoleAssign() { submitLoading.value = true; try { await assignUserRole({ userId: roleForm.userId, roleIds: roleForm.roleIds }); ElMessage.success('分配成功'); roleVisible.value = false; getList() } finally { submitLoading.value = false } }
function openResetPassword(id) { passwordForm.userId = id; passwordForm.newPassword = ''; passwordVisible.value = true }
function submitPasswordReset() { passwordFormRef.value.validate(async (valid) => { if (!valid) return; submitLoading.value = true; try { await resetUserPassword(passwordForm); ElMessage.success('密码已重置'); passwordVisible.value = false } finally { submitLoading.value = false } }) }
async function changeStatus(row) { await updateUserStatus({ userId: row.id, status: row.status === 1 ? 0 : 1 }); ElMessage.success('状态已更新'); getList() }
async function handleDelete(id) { await ElMessageBox.confirm('确认删除该用户？', '提示', { type: 'warning' }); await deleteUser(id); ElMessage.success('删除成功'); getList() }
onMounted(async () => { await Promise.all([loadRoles(), getList()]) })
</script>
