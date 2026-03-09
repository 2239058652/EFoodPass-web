<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">EFoodPass</div>
      <el-menu router :default-active="activeMenu" background-color="#001529" text-color="#c0c4cc" active-text-color="#409EFF">
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
    </aside>

    <section class="main">
      <header class="header">
        <div>{{ currentTitle }}</div>
        <div class="header-right">
          <span>{{ authStore.userInfo?.nickname || authStore.userInfo?.username }}</span>
          <el-dropdown @command="handleCommand">
            <span class="user-entry">账户<el-icon><ArrowDown /></el-icon></span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">查看权限</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      <main class="content"><RouterView /></main>
    </section>

    <el-dialog v-model="profileVisible" title="当前登录信息" width="640px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="用户ID">{{ authStore.userInfo?.userId }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ authStore.userInfo?.username }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ authStore.userInfo?.nickname }}</el-descriptions-item>
        <el-descriptions-item label="角色编码">{{ (authStore.userInfo?.roleCodes || []).join(', ') || '-' }}</el-descriptions-item>
        <el-descriptions-item label="权限编码">
          <div class="perm-box">
            <el-tag v-for="code in authStore.userInfo?.permissionCodes || []" :key="code" size="small" class="perm-tag">{{ code }}</el-tag>
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
.layout { display: flex; min-height: 100vh; }
.sidebar { width: 220px; background: #001529; color: #fff; }
.logo { height: 56px; display: flex; align-items: center; padding: 0 20px; font-size: 18px; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,.08); }
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.header { height: 56px; background: #fff; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 4px rgba(0, 21, 41, .08); }
.header-right { display: flex; align-items: center; gap: 16px; }
.user-entry { cursor: pointer; display: inline-flex; align-items: center; gap: 4px; color: #409EFF; }
.content { padding: 16px; overflow: auto; }
.perm-box { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
