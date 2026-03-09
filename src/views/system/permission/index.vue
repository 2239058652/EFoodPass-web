<template>
  <el-card class="page-card" shadow="never">
    <el-form :model="queryForm" inline>
      <el-form-item label="权限编码"><el-input v-model="queryForm.permCode" placeholder="支持模糊查询" clearable /></el-form-item>
      <el-form-item label="状态"><el-select v-model="queryForm.status" placeholder="全部" clearable style="width: 140px"><el-option v-for="item in STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
      <div class="toolbar"><el-button type="primary" @click="getList">查询</el-button><el-button @click="handleReset">重置</el-button><el-button type="success" @click="openCreate">新增权限</el-button></div>
    </el-form>
  </el-card>
  <el-card class="page-card" shadow="never">
    <el-table :data="tableData" border v-loading="loading">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="permCode" label="权限编码" min-width="210" />
      <el-table-column prop="permName" label="权限名称" min-width="180" />
      <el-table-column label="类型" width="100"><template #default="{ row }">{{ getPermissionTypeLabel(row.permType) }}</template></el-table-column>
      <el-table-column prop="path" label="请求路径" min-width="180" />
      <el-table-column prop="method" label="请求方法" width="120" />
      <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ getStatusLabel(row.status) }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="320" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openEdit(row.id)">编辑</el-button><el-button link type="primary" @click="changeStatus(row)">{{ row.status === 1 ? '禁用' : '启用' }}</el-button><el-button link type="danger" @click="handleDelete(row.id)">删除</el-button></template></el-table-column>
    </el-table>
  </el-card>
  <el-dialog v-model="editVisible" :title="formMode === 'create' ? '新增权限' : '编辑权限'" width="520px">
    <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="90px">
      <el-form-item label="权限编码" prop="permCode" v-if="formMode === 'create'"><el-input v-model="editForm.permCode" /></el-form-item>
      <el-form-item label="权限名称" prop="permName"><el-input v-model="editForm.permName" /></el-form-item>
      <el-form-item label="权限类型" prop="permType"><el-select v-model="editForm.permType" class="w-100"><el-option v-for="item in PERMISSION_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
      <el-form-item label="请求路径" prop="path"><el-input v-model="editForm.path" /></el-form-item>
      <el-form-item label="请求方法" prop="method"><el-input v-model="editForm.method" /></el-form-item>
      <el-form-item label="状态" prop="status"><el-radio-group v-model="editForm.status"><el-radio :value="1">启用</el-radio><el-radio :value="0">禁用</el-radio></el-radio-group></el-form-item>
    </el-form>
    <template #footer><el-button @click="editVisible = false">取消</el-button><el-button type="primary" :loading="submitLoading" @click="submitEdit">确定</el-button></template>
  </el-dialog>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createPermission, deletePermission, getPermissionDetail, getPermissionList, updatePermission, updatePermissionStatus } from '@/api/permission'
import { getPermissionTypeLabel, getStatusLabel, PERMISSION_TYPE_OPTIONS, STATUS_OPTIONS } from '@/utils/constants'

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const queryForm = reactive({ permCode: '', status: undefined })
const formMode = ref('create')
const editVisible = ref(false)
const editFormRef = ref()
const editForm = reactive({ id: undefined, permCode: '', permName: '', permType: 1, path: '', method: '', status: 1 })
const editRules = { permCode: [{ required: true, message: '请输入权限编码', trigger: 'blur' }], permName: [{ required: true, message: '请输入权限名称', trigger: 'blur' }], permType: [{ required: true, message: '请选择权限类型', trigger: 'change' }], status: [{ required: true, message: '请选择状态', trigger: 'change' }] }
async function getList() { loading.value = true; try { const res = await getPermissionList(queryForm); tableData.value = Array.isArray(res.data) ? res.data : res.data?.records || [] } finally { loading.value = false } }
function handleReset() { queryForm.permCode = ''; queryForm.status = undefined; getList() }
function resetEditForm() { Object.assign(editForm, { id: undefined, permCode: '', permName: '', permType: 1, path: '', method: '', status: 1 }) }
function openCreate() { formMode.value = 'create'; resetEditForm(); editVisible.value = true }
async function openEdit(id) { formMode.value = 'edit'; resetEditForm(); const res = await getPermissionDetail(id); Object.assign(editForm, { id: res.data.id, permName: res.data.permName, permType: res.data.permType, path: res.data.path, method: res.data.method, status: res.data.status }); editVisible.value = true }
function submitEdit() { editFormRef.value.validate(async (valid) => { if (!valid) return; submitLoading.value = true; try { if (formMode.value === 'create') { await createPermission({ permCode: editForm.permCode, permName: editForm.permName, permType: editForm.permType, path: editForm.path, method: editForm.method, status: editForm.status }); ElMessage.success('新增成功') } else { await updatePermission({ id: editForm.id, permName: editForm.permName, permType: editForm.permType, path: editForm.path, method: editForm.method, status: editForm.status }); ElMessage.success('更新成功') } editVisible.value = false; getList() } finally { submitLoading.value = false } }) }
async function changeStatus(row) { await updatePermissionStatus({ permissionId: row.id, status: row.status === 1 ? 0 : 1 }); ElMessage.success('状态已更新'); getList() }
async function handleDelete(id) { await ElMessageBox.confirm('确认删除该权限？', '提示', { type: 'warning' }); await deletePermission(id); ElMessage.success('删除成功'); getList() }
onMounted(getList)
</script>
