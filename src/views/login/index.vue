<template>
  <div class="login-page">
    <el-card class="login-card" shadow="hover">
      <div class="title">EFoodPass 管理后台</div>
      <div class="sub-title">使用后端系统账号登录</div>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @keyup.enter="handleLogin">
        <el-form-item label="用户名" prop="username"><el-input v-model="form.username" placeholder="请输入用户名" /></el-form-item>
        <el-form-item label="密码" prop="password"><el-input v-model="form.password" type="password" show-password placeholder="请输入密码" /></el-form-item>
        <el-button class="w-100" type="primary" :loading="loading" @click="handleLogin">登录</el-button>
      </el-form>
      <el-alert class="tip" type="info" :closable="false" title="默认初始化账号可尝试 admin / Admin@123" />
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref()
const loading = ref(false)
const form = reactive({ username: 'admin', password: 'Admin@123' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

function handleLogin() {
  formRef.value.validate(async (valid) => {
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
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a, #1d4ed8); }
.login-card { width: 420px; border-radius: 12px; }
.title { font-size: 28px; font-weight: 700; text-align: center; margin-bottom: 8px; }
.sub-title { color: #909399; text-align: center; margin-bottom: 24px; }
.tip { margin-top: 20px; }
</style>
