<template>
  <el-card class="page-card page-hero gradient-blue" shadow="never">
    <div class="page-hero__title">欢迎回来，{{ authStore.userInfo?.nickname || authStore.userInfo?.username || '管理员' }}</div>
    <div class="page-hero__desc">
      当前控制台已接入登录、当前用户信息、用户管理、角色管理、权限管理等核心系统能力。视觉层已调整为更轻盈的科技感和更柔和的暖色层次，适合日常高频使用。
    </div>
    <div class="page-hero__meta">
      <div class="hero-badge">认证：JWT</div>
      <div class="hero-badge">权限：RBAC</div>
      <div class="hero-badge">框架：Vue 3 + Element Plus</div>
    </div>
  </el-card>

  <section class="metric-grid">
    <div class="metric-card">
      <div class="metric-card__label">当前用户</div>
      <div class="metric-card__value">{{ authStore.userInfo?.nickname || authStore.userInfo?.username || '-' }}</div>
      <div class="metric-card__note">当前登录身份与首页展示保持同步</div>
    </div>
    <div class="metric-card">
      <div class="metric-card__label">角色数量</div>
      <div class="metric-card__value">{{ authStore.userInfo?.roleCodes?.length || 0 }}</div>
      <div class="metric-card__note">角色编码来自 /auth/me 返回值</div>
    </div>
    <div class="metric-card">
      <div class="metric-card__label">权限数量</div>
      <div class="metric-card__value">{{ authStore.userInfo?.permissionCodes?.length || 0 }}</div>
      <div class="metric-card__note">用于页面显隐和操作能力控制</div>
    </div>
    <div class="metric-card">
      <div class="metric-card__label">界面状态</div>
      <div class="metric-card__value">已优化</div>
      <div class="metric-card__note">视觉基调：轻科技 + 温和暖色</div>
    </div>
  </section>

  <section class="info-grid" style="margin-top: 18px;">
    <el-card class="page-card welcome-panel" shadow="never">
      <div class="panel-title">当前账号信息</div>
      <div class="panel-desc">点击右上角账户中心也可以查看当前角色与权限明细。</div>
      <el-descriptions :column="2" border style="margin-top: 18px;">
        <el-descriptions-item label="用户ID">{{ authStore.userInfo?.userId }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ authStore.userInfo?.username }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ authStore.userInfo?.nickname }}</el-descriptions-item>
        <el-descriptions-item label="角色编码">{{ authStore.userInfo?.roleCodes?.join(', ') || '-' }}</el-descriptions-item>
      </el-descriptions>
      <div class="chip-list">
        <div class="soft-chip">界面结构更清晰</div>
        <div class="soft-chip warm-chip">视觉层次更柔和</div>
        <div class="soft-chip">适合继续扩展业务模块</div>
      </div>
    </el-card>

    <el-card class="page-card gradient-warm" shadow="never">
      <div class="panel-title">当前实现说明</div>
      <div class="welcome-panel__text" style="margin-top: 14px;">
        当前后端没有动态菜单接口，因此前端仍然基于 <strong>/auth/me</strong> 返回的 <strong>permissionCodes</strong> 做页面级权限显隐。
        这不会影响系统管理模块使用，但如果你后续要做完整菜单树和路由级权限，建议后端再补菜单接口。
      </div>
      <div class="chip-list">
        <div class="soft-chip">用户列表：分页</div>
        <div class="soft-chip">角色列表：普通列表</div>
        <div class="soft-chip">权限列表：普通列表</div>
      </div>
      <el-button type="primary" style="margin-top: 18px;" @click="refreshProfile">刷新当前用户</el-button>
    </el-card>
  </section>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
async function refreshProfile() {
  await authStore.fetchProfile()
  ElMessage.success('已刷新当前用户信息')
}
</script>
