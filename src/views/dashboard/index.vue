<template>
  <el-card class="page-card" shadow="never">
    <template #header>
      <div class="flex-between"><span>工作台</span><el-button type="primary" plain @click="refreshProfile">刷新当前用户</el-button></div>
    </template>
    <el-row :gutter="16">
      <el-col :span="8"><el-card shadow="hover"><div class="metric-label">当前用户</div><div class="metric-value">{{ authStore.userInfo?.nickname || authStore.userInfo?.username || '-' }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="hover"><div class="metric-label">角色数</div><div class="metric-value">{{ authStore.userInfo?.roleCodes?.length || 0 }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="hover"><div class="metric-label">权限数</div><div class="metric-value">{{ authStore.userInfo?.permissionCodes?.length || 0 }}</div></el-card></el-col>
    </el-row>
  </el-card>
  <el-card class="page-card" shadow="never">
    <template #header><span>当前账号信息</span></template>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="用户ID">{{ authStore.userInfo?.userId }}</el-descriptions-item>
      <el-descriptions-item label="用户名">{{ authStore.userInfo?.username }}</el-descriptions-item>
      <el-descriptions-item label="昵称">{{ authStore.userInfo?.nickname }}</el-descriptions-item>
      <el-descriptions-item label="角色编码">{{ authStore.userInfo?.roleCodes?.join(', ') || '-' }}</el-descriptions-item>
    </el-descriptions>
  </el-card>
  <el-card class="page-card" shadow="never">
    <template #header><span>说明</span></template>
    <el-alert type="warning" :closable="false" title="当前后端没有动态菜单接口，所以前端依据 /auth/me 返回的 permissionCodes 做页面级显隐控制。" />
  </el-card>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
async function refreshProfile() { await authStore.fetchProfile(); ElMessage.success('已刷新') }
</script>

<style scoped>
.metric-label { color: #909399; margin-bottom: 10px; }
.metric-value { font-size: 28px; font-weight: 700; }
</style>
