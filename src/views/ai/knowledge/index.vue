<template>
  <div class="knowledge-page">
    <el-card class="page-card page-hero gradient-blue" shadow="never">
      <div class="page-hero__title">系统知识库索引</div>
      <div class="page-hero__desc">
        这里对齐后端当前的系统知识库索引管理接口：<code>GET /ai/knowledge/system/status</code> 和 <code>POST /ai/knowledge/system/rebuild</code>。
        用于查看当前知识库状态，并在需要时手动重建 RAG 索引。
      </div>
      <div class="page-hero__meta">
        <div class="hero-badge">需要登录</div>
        <div class="hero-badge">RAG system knowledge</div>
        <div class="hero-badge">status / rebuild</div>
      </div>
    </el-card>

    <el-card class="page-card" shadow="never">
      <div class="section-head">
        <div class="section-head-left">
          <div class="panel-title">索引状态</div>
          <div class="panel-desc">当前后端控制器未声明单独权限码，前端将其放在管理端工作台中统一维护。</div>
        </div>
        <div class="toolbar">
          <el-button :loading="loading" @click="loadStatus">刷新状态</el-button>
          <el-button type="primary" :loading="rebuilding" @click="handleRebuild">重建索引</el-button>
        </div>
      </div>

      <el-descriptions v-if="status" :column="2" border>
        <el-descriptions-item label="knowledgeBase">{{ status.knowledgeBase || '-' }}</el-descriptions-item>
        <el-descriptions-item label="documentCount">{{ status.documentCount ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="lastRebuildAt">{{ formatTime(status.lastRebuildAt) }}</el-descriptions-item>
        <el-descriptions-item label="topK">{{ status.topK ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="similarityThreshold">{{ status.similarityThreshold ?? '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-empty v-else description="暂未获取到知识库状态" />
    </el-card>

    <el-card class="page-card" shadow="never">
      <div class="panel-title">说明</div>
      <div class="dialog-note" style="margin-top: 14px">
        重建操作会重新写入系统知识文档到向量库。通常只有在知识文档内容变更、检索效果异常、或你希望强制刷新索引时才需要手动执行。
      </div>
      <div class="dialog-note">
        当前返回字段包含 <code>knowledgeBase / documentCount / lastRebuildAt / topK / similarityThreshold</code>，已和后端 DTO 对齐。
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSystemKnowledgeStatus, rebuildSystemKnowledge } from '@/api/ai'
import type { SystemKnowledgeIndexStatusResponse } from '@/types/ai'

const loading = ref(false)
const rebuilding = ref(false)
const status = ref<SystemKnowledgeIndexStatusResponse | null>(null)

function formatTime(timestamp?: number | null): string {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '-'
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

async function loadStatus(): Promise<void> {
  loading.value = true
  try {
    const res = await getSystemKnowledgeStatus()
    status.value = res.data
  } finally {
    loading.value = false
  }
}

async function handleRebuild(): Promise<void> {
  try {
    await ElMessageBox.confirm('确认重建系统知识库索引吗？这会重新写入知识文档到向量库。', '重建索引', {
      type: 'warning',
      confirmButtonText: '重建',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  rebuilding.value = true
  try {
    const res = await rebuildSystemKnowledge()
    status.value = res.data
    ElMessage.success('知识库索引已重建')
  } finally {
    rebuilding.value = false
  }
}

onMounted(async () => {
  await loadStatus()
})
</script>

<style scoped>
.knowledge-page { display: flex; flex-direction: column; gap: 18px; }
</style>
