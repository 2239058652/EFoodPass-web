<template>
  <div class="layout-shell user-shell">
    <div class="layout-glow layout-glow--one"></div>
    <div class="layout-glow layout-glow--two"></div>
    <section class="user-main-shell">
      <header class="topbar">
        <div>
          <div class="topbar-title">{{ currentTitle }}</div>
          <div class="topbar-subtitle">当前区域使用 /app/order 系列接口，当前用户由后端从 token 中解析。</div>
        </div>
        <div class="header-right">
          <el-button text bg @click="router.push('/admin/dashboard')">返回管理端</el-button>
          <el-menu mode="horizontal" :default-active="route.path" class="user-menu" router>
            <el-menu-item index="/app/orders">我的订单</el-menu-item>
            <el-menu-item index="/app/order/create">创建订单</el-menu-item>
          </el-menu>
        </div>
      </header>
      <main class="content-wrap app-scrollbar">
        <RouterView />
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const currentTitle = computed(() => (route.meta?.title as string) || '用户端订单页')
</script>

<style scoped>
.layout-shell { position: relative; min-height: 100vh; padding: 20px; overflow: hidden; }
.layout-glow { position: fixed; border-radius: 50%; filter: blur(24px); pointer-events: none; z-index: 0; }
.layout-glow--one { width: 280px; height: 280px; left: 8%; bottom: -90px; background: rgba(105, 213, 177, 0.18); }
.layout-glow--two { width: 320px; height: 320px; right: 10%; top: 10%; background: rgba(91, 140, 255, 0.14); }
.user-main-shell { position: relative; z-index: 1; min-height: calc(100vh - 40px); display: flex; flex-direction: column; gap: 16px; }
.topbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 18px 22px; border-radius: 28px; background: rgba(255, 255, 255, 0.7); border: 1px solid rgba(255,255,255,0.72); backdrop-filter: blur(16px); box-shadow: var(--shadow-soft); }
.topbar-title { font-size: 24px; font-weight: 800; }
.topbar-subtitle { color: var(--text-secondary); margin-top: 6px; font-size: 13px; }
.header-right { display: flex; align-items: center; gap: 12px; }
.user-menu.el-menu { border-bottom: none; background: rgba(255,255,255,0.55); border-radius: 16px; padding: 0 8px; }
.content-wrap { min-height: 0; flex: 1; overflow: auto; }
@media (max-width: 960px) { .topbar { flex-direction: column; align-items: flex-start; } .header-right { width: 100%; flex-wrap: wrap; } }
</style>
