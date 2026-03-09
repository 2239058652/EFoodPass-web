<template>
  <div class="layout-shell">
    <div class="layout-glow layout-glow--one"></div>
    <div class="layout-glow layout-glow--two"></div>

    <aside class="sidebar">
      <div class="brand-card">
        <div class="brand-mark">E</div>
        <div>
          <div class="brand-title">EFoodPass</div>
          <div class="brand-subtitle">智慧食堂管理中枢</div>
        </div>
      </div>

      <div class="nav-caption">功能导航</div>
      <el-menu class="nav-menu" router :default-active="activeMenu" background-color="transparent" text-color="#5c6982" active-text-color="#35507a">
        <el-menu-item index="/dashboard">
          <el-icon><House /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        <el-sub-menu index="/system" v-if="systemMenus.length">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item v-for="item in systemMenus" :key="item.path" :index="item.path">{{ item.title }}</el-menu-item>
        </el-sub-menu>
      </el-menu>

      <div class="sidebar-footer">
        <div class="footer-card">
          <div class="footer-card__title">温和界面，稳定管理</div>
          <div class="footer-card__desc">保留系统管理的专业感，同时让后台不再生硬。</div>
        </div>
      </div>
    </aside>

    <section class="main-shell">
      <header class="topbar">
        <div>
          <div class="topbar-title">{{ currentTitle }}</div>
          <div class="topbar-subtitle">EFoodPass 管理后台 · 更清爽、更柔和的控制台体验</div>
        </div>
        <div class="header-right">
          <div class="profile-pill">
            <div class="profile-pill__avatar">{{ displayInitial }}</div>
            <div>
              <div class="profile-pill__name">{{ authStore.userInfo?.nickname || authStore.userInfo?.username }}</div>
              <div class="profile-pill__role">{{ (authStore.userInfo?.roleCodes || []).join(' / ') || '未分配角色' }}</div>
            </div>
          </div>
          <el-dropdown @command="handleCommand">
            <span class="user-entry">账户中心<el-icon><ArrowDown /></el-icon></span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">查看权限</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="content-wrap">
        <RouterView />
      </main>
    </section>

    <el-dialog v-model="profileVisible" title="当前登录信息" width="720px">
      <div class="dialog-note">以下信息来自 /auth/me，用于页面权限显隐与身份展示。</div>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="用户ID">{{ authStore.userInfo?.userId }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ authStore.userInfo?.username }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ authStore.userInfo?.nickname }}</el-descriptions-item>
        <el-descriptions-item label="角色编码">{{ (authStore.userInfo?.roleCodes || []).join(', ') || '-' }}</el-descriptions-item>
        <el-descriptions-item label="权限编码">
          <div class="perm-box">
            <el-tag v-for="code in authStore.userInfo?.permissionCodes || []" :key="code" size="small" class="perm-tag code-pill">{{ code }}</el-tag>
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, House, Setting } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const profileVisible = ref(false)

const allSystemMenus = [
  { path: '/system/user', title: '用户管理', permission: 'system:user:list' },
  { path: '/system/role', title: '角色管理', permission: 'system:role:list' },
  { path: '/system/permission', title: '权限管理', permission: 'system:permission:list' }
]

const systemMenus = computed(() => allSystemMenus.filter((item) => authStore.hasPermission(item.permission)))
const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta?.title || '后台系统')
const displayInitial = computed(() => (authStore.userInfo?.nickname || authStore.userInfo?.username || 'U').slice(0, 1).toUpperCase())

function handleCommand(command) {
  if (command === 'logout') {
    authStore.logout()
    router.replace('/login')
    return
  }
  if (command === 'profile') profileVisible.value = true
}
</script>

<style scoped>
.layout-shell {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 100vh;
  padding: 20px;
  gap: 18px;
}
.layout-glow {
  position: fixed;
  border-radius: 50%;
  filter: blur(24px);
  pointer-events: none;
  z-index: 0;
}
.layout-glow--one {
  width: 280px;
  height: 280px;
  left: 12%;
  bottom: -90px;
  background: rgba(105, 213, 177, 0.18);
}
.layout-glow--two {
  width: 320px;
  height: 320px;
  right: 10%;
  top: 10%;
  background: rgba(91, 140, 255, 0.14);
}
.sidebar {
  width: 278px;
  border: 1px solid rgba(255,255,255,0.65);
  background: linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,250,245,0.74));
  backdrop-filter: blur(18px);
  border-radius: 30px;
  padding: 18px;
  box-shadow: 0 18px 45px rgba(71, 85, 105, 0.14);
  display: flex;
  flex-direction: column;
}
.brand-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(91,140,255,0.16), rgba(255,181,107,0.14), rgba(255,255,255,0.74));
  border: 1px solid rgba(255,255,255,0.72);
}
.brand-mark {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 24px;
  font-weight: 800;
  color: white;
  background: linear-gradient(135deg, #5b8cff, #69d5b1);
  box-shadow: 0 12px 24px rgba(91, 140, 255, 0.24);
}
.brand-title { font-size: 20px; font-weight: 800; }
.brand-subtitle { margin-top: 4px; color: #73839d; font-size: 12px; }
.nav-caption {
  margin: 22px 6px 10px;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #8c9ab1;
}
.nav-menu {
  border-right: none;
}
:deep(.nav-menu .el-menu-item),
:deep(.nav-menu .el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  border-radius: 16px;
  margin-bottom: 8px;
}
:deep(.nav-menu .el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(91,140,255,0.15), rgba(105,213,177,0.12)) !important;
  font-weight: 700;
}
.sidebar-footer {
  margin-top: auto;
}
.footer-card {
  padding: 16px;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255,255,255,0.74), rgba(246,249,255,0.82));
  border: 1px solid rgba(148, 163, 184, 0.12);
}
.footer-card__title { font-weight: 700; }
.footer-card__desc { margin-top: 8px; color: #7d8ca5; line-height: 1.7; font-size: 13px; }
.main-shell {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.topbar {
  padding: 18px 24px;
  border-radius: 28px;
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255,255,255,0.72);
  box-shadow: 0 10px 30px rgba(148, 163, 184, 0.14);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.topbar-title { font-size: 24px; font-weight: 800; }
.topbar-subtitle { margin-top: 6px; color: #7b8aa3; font-size: 13px; }
.header-right { display: flex; align-items: center; gap: 12px; }
.profile-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px 8px 8px;
  border-radius: 999px;
  background: rgba(248,250,255,0.88);
  border: 1px solid rgba(148, 163, 184, 0.14);
}
.profile-pill__avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 800;
  background: linear-gradient(135deg, #5b8cff, #ffb56b);
}
.profile-pill__name { font-weight: 700; }
.profile-pill__role { font-size: 12px; color: #7b8aa3; margin-top: 4px; }
.user-entry {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #35507a;
  font-weight: 700;
}
.content-wrap {
  min-height: 0;
  padding-bottom: 6px;
}
.perm-box { display: flex; flex-wrap: wrap; gap: 8px; }
.perm-tag { margin: 0; }

@media (max-width: 1024px) {
  .layout-shell { padding: 12px; }
  .sidebar { display: none; }
}
@media (max-width: 768px) {
  .topbar {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
