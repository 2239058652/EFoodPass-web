<template>
  <div class="login-shell">
    <div class="login-aurora login-aurora--one"></div>
    <div class="login-aurora login-aurora--two"></div>

    <section class="login-showcase">
      <div class="showcase-badge">EFoodPass · 智慧食堂后台</div>
      <h1 class="showcase-title">更柔和的科技感，让管理系统也能看起来有温度。</h1>
      <p class="showcase-text">
        这套界面保留了后台系统需要的秩序感和效率感，同时用更轻盈的层次、柔和的色彩和更现代的卡片结构，降低长期操作带来的视觉疲劳。
      </p>
      <div class="showcase-grid">
        <div class="showcase-card">
          <div class="showcase-card__label">认证方式</div>
          <div class="showcase-card__value">JWT</div>
          <div class="showcase-card__text">与现有后端鉴权流程保持一致</div>
        </div>
        <div class="showcase-card">
          <div class="showcase-card__label">权限控制</div>
          <div class="showcase-card__value">RBAC</div>
          <div class="showcase-card__text">按 permissionCodes 控制页面能力</div>
        </div>
        <div class="showcase-card">
          <div class="showcase-card__label">视觉基调</div>
          <div class="showcase-card__value">温润轻科技</div>
          <div class="showcase-card__text">蓝色秩序感 + 暖色亲和感</div>
        </div>
      </div>
    </section>

    <el-card class="login-card" shadow="never">
      <div class="login-card__badge">欢迎回来</div>
      <div class="title">登录管理后台</div>
      <div class="sub-title">请输入系统账号信息，进入 EFoodPass 控制台</div>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @keyup.enter="handleLogin">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" size="large" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" size="large" />
        </el-form-item>
        <el-button class="w-100 login-button" type="primary" size="large" :loading="loading" @click="handleLogin">登录并进入系统</el-button>
      </el-form>
      <div class="tip-panel">
        <div class="tip-panel__title">开发环境提示</div>
        <div class="tip-panel__content">默认初始化账号可尝试 admin / Admin@123</div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { LoginForm } from '@/types'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive<LoginForm>({ username: 'admin', password: 'Admin@123' })
const rules: FormRules<LoginForm> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

function handleLogin(): void {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    loading.value = true
    try {
      await authStore.loginByPassword(form)
      ElMessage.success('登录成功')
      router.replace('/')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-shell {
  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.1fr 460px;
  gap: 36px;
  align-items: center;
  padding: 40px 6vw;
  overflow: hidden;
  background: linear-gradient(135deg, #eff5ff 0%, #fffaf5 45%, #f6fbff 100%);
}
.login-aurora {
  position: absolute;
  border-radius: 50%;
  filter: blur(32px);
  pointer-events: none;
}
.login-aurora--one {
  width: 360px;
  height: 360px;
  top: -110px;
  right: 20%;
  background: rgba(91, 140, 255, 0.22);
}
.login-aurora--two {
  width: 300px;
  height: 300px;
  left: -100px;
  bottom: -80px;
  background: rgba(255, 181, 107, 0.24);
}
.login-showcase {
  position: relative;
  z-index: 1;
  padding-right: 20px;
}
.showcase-badge {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(91, 140, 255, 0.1);
  color: #35507a;
  font-weight: 700;
  font-size: 12px;
}
.showcase-title {
  margin: 22px 0 0;
  font-size: 48px;
  line-height: 1.2;
  font-weight: 900;
  letter-spacing: -0.03em;
  max-width: 720px;
}
.showcase-text {
  margin-top: 18px;
  max-width: 700px;
  color: #697994;
  font-size: 16px;
  line-height: 1.9;
}
.showcase-grid {
  margin-top: 28px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.showcase-card {
  padding: 18px;
  border-radius: 24px;
  background: rgba(255,255,255,0.56);
  border: 1px solid rgba(255,255,255,0.72);
  backdrop-filter: blur(14px);
  box-shadow: 0 10px 24px rgba(148, 163, 184, 0.16);
}
.showcase-card__label { color: #7b8aa3; font-size: 12px; }
.showcase-card__value { margin-top: 12px; font-size: 22px; font-weight: 800; }
.showcase-card__text { margin-top: 8px; color: #697994; font-size: 13px; line-height: 1.7; }
.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  border-radius: 32px !important;
  border: 1px solid rgba(255,255,255,0.76) !important;
  background: rgba(255,255,255,0.76) !important;
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 60px rgba(71, 85, 105, 0.16);
}
.login-card__badge {
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255,181,107,0.16);
  color: #a86618;
  font-size: 12px;
  font-weight: 700;
}
.title { font-size: 30px; font-weight: 800; margin-top: 18px; }
.sub-title { color: #7b8aa3; margin: 10px 0 24px; line-height: 1.8; }
.login-button {
  margin-top: 6px;
  height: 48px;
  background: linear-gradient(135deg, #5b8cff, #6c7bff);
  border: none;
}
.tip-panel {
  margin-top: 22px;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(91,140,255,0.08), rgba(105,213,177,0.08));
}
.tip-panel__title { font-weight: 700; }
.tip-panel__content { margin-top: 6px; color: #6b7a93; font-size: 13px; }

@media (max-width: 1200px) {
  .login-shell { grid-template-columns: 1fr; }
  .login-showcase { padding-right: 0; }
}
@media (max-width: 768px) {
  .login-shell { padding: 24px; gap: 24px; }
  .showcase-title { font-size: 34px; }
  .showcase-grid { grid-template-columns: 1fr; }
}
</style>
