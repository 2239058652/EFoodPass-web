<template>
  <div class="ai-shell">
    <div class="ai-glow ai-glow--one"></div>
    <div class="ai-glow ai-glow--two"></div>

    <section class="ai-content">
      <header class="page-card ai-topbar" shadow="never">
        <div>
          <div class="ai-topbar__title">Spring AI 对话体验</div>
          <div class="ai-topbar__desc">
            当前页面直接对接后端新增的 <code>POST /ai/chat</code>。请求体只传 <code>message</code>，成功后读取 <code>data.content</code> 展示。
            根据后端当前主分支安全配置，这个接口需要登录态访问，前端会通过现有请求拦截器自动携带 token。
          </div>
        </div>
        <div class="ai-topbar__actions">
          <el-button @click="router.push('/app/orders')">去用户端</el-button>
          <el-button type="primary" plain @click="router.push('/admin/dashboard')">返回后台</el-button>
        </div>
      </header>

      <el-card class="page-card page-hero gradient-blue" shadow="never">
        <div class="page-hero__title">AI 学习入口已接到前端</div>
        <div class="page-hero__desc">
          这里没有做多轮上下文持久化，也没有流式输出，严格对应你后端当前这版接口能力：一次输入，一次返回。
          这样你后面如果继续在 Spring AI 中加 system prompt、上下文记忆、流式响应，前端也很好继续扩展。
        </div>
        <div class="page-hero__meta">
          <button v-for="prompt in presetPrompts" :key="prompt" class="prompt-chip" type="button" @click="usePreset(prompt)">
            {{ prompt }}
          </button>
        </div>
      </el-card>

      <div class="ai-grid">
        <el-card class="page-card chat-panel" shadow="never">
          <template #header>
            <div class="section-head">
              <div class="section-head-left">
                <div class="panel-title">对话面板</div>
                <div class="panel-desc">Enter 发送，Shift + Enter 换行。发送时会调用后端 /ai/chat。</div>
              </div>
              <div class="toolbar">
                <el-button :icon="RefreshRight" @click="usePreset(presetPrompts[0])">填入示例</el-button>
                <el-button :icon="Delete" @click="resetMessages">清空会话</el-button>
              </div>
            </div>
          </template>

          <div ref="messageListRef" class="message-list app-scrollbar">
            <div v-for="item in messages" :key="item.id" :class="['message-row', item.role === 'user' ? 'is-user' : 'is-assistant']">
              <div class="message-avatar">{{ item.role === 'user' ? '我' : 'AI' }}</div>
              <div class="message-bubble">
                <div class="message-meta">{{ item.role === 'user' ? '你' : 'AI 助手' }} · {{ formatTime(item.createdAt) }}</div>
                <div class="message-content">{{ item.content }}</div>
              </div>
            </div>

            <div v-if="loading" class="message-row is-assistant">
              <div class="message-avatar">AI</div>
              <div class="message-bubble is-pending">
                <div class="message-meta">AI 助手 · 正在思考</div>
                <div class="message-content">正在等待后端 Spring AI 返回结果...</div>
              </div>
            </div>
          </div>

          <div class="composer">
            <el-input
              v-model="draft"
              type="textarea"
              :rows="5"
              resize="none"
              maxlength="2000"
              show-word-limit
              placeholder="请输入你的问题，例如：帮我设计一个家庭点餐系统的用户端功能说明"
              @keydown="handleKeydown"
            />
            <div class="composer-footer">
              <div class="composer-tip">
                当前版本建议用于 Spring AI 接口联调和学习验证，不包含上下文记忆与流式输出。
              </div>
              <el-button type="primary" :icon="Promotion" :loading="loading" @click="submitMessage()">发送消息</el-button>
            </div>
          </div>
        </el-card>

        <div class="side-panel">
          <el-card class="page-card info-card" shadow="never">
            <template #header>
              <div class="panel-title">接口映射</div>
            </template>
            <div class="spec-list">
              <div class="spec-item">
                <div class="spec-item__label">请求地址</div>
                <code>/ai/chat</code>
              </div>
              <div class="spec-item">
                <div class="spec-item__label">请求方法</div>
                <code>POST</code>
              </div>
              <div class="spec-item">
                <div class="spec-item__label">请求体</div>
                <code>{ message: string }</code>
              </div>
              <div class="spec-item">
                <div class="spec-item__label">响应读取</div>
                <code>res.data.content</code>
              </div>
            </div>
          </el-card>

          <el-card class="page-card info-card" shadow="never">
            <template #header>
              <div class="panel-title">后续可扩展方向</div>
            </template>
            <ul class="plan-list">
              <li>把单次问答升级成多轮上下文对话。</li>
              <li>增加流式输出，边生成边展示。</li>
              <li>加入系统提示词与角色设定。</li>
              <li>支持复制回复、导出会话、保存历史记录。</li>
            </ul>
          </el-card>

          <el-card class="page-card info-card gradient-warm" shadow="never">
            <template #header>
              <div class="panel-title">联调提醒</div>
            </template>
            <div class="dialog-note ai-note">
              如果这里发送失败，优先检查后端模型 Key、模型名、网络连通性，以及 Spring AI 配置是否已经生效。
            </div>
          </el-card>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Delete, Promotion, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { aiChat } from '@/api/ai'
import type { AiChatMessageItem, AiChatRole } from '@/types'

const router = useRouter()
const messageListRef = ref<HTMLDivElement>()
const loading = ref(false)
const draft = ref('')

const presetPrompts = [
  '你好，请用一句话介绍你自己',
  '帮我解释一下 Spring AI 的作用',
  '请为家庭点餐系统设计一个 AI 助手功能',
  '给我一段适合前端展示的欢迎语'
]

function createMessage(role: AiChatRole, content: string): AiChatMessageItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: Date.now()
  }
}

function buildWelcomeMessages(): AiChatMessageItem[] {
  return [
    createMessage('assistant', '你好，我已经接入你后端新增的 Spring AI 接口。当前页面会在登录后调用 /ai/chat，并把返回内容显示在这里。')
  ]
}

const messages = ref<AiChatMessageItem[]>(buildWelcomeMessages())

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(timestamp)
}

async function scrollToBottom(): Promise<void> {
  await nextTick()
  if (!messageListRef.value) return
  messageListRef.value.scrollTop = messageListRef.value.scrollHeight
}

function usePreset(prompt: string): void {
  draft.value = prompt
}

function resetMessages(): void {
  messages.value = buildWelcomeMessages()
  draft.value = ''
  void scrollToBottom()
}

async function submitMessage(customMessage?: string): Promise<void> {
  const content = (customMessage ?? draft.value).trim()
  if (!content) {
    ElMessage.warning('请输入问题后再发送')
    return
  }

  if (loading.value) return

  messages.value.push(createMessage('user', content))
  draft.value = ''
  await scrollToBottom()

  loading.value = true
  try {
    const res = await aiChat({ message: content })
    const reply = res.data?.content?.trim() || 'AI 已响应，但当前没有可展示的文本内容。'
    messages.value.push(createMessage('assistant', reply))
  } catch {
    messages.value.push(createMessage('assistant', '本次调用失败。请检查后端 Spring AI 模型配置、API Key、网络环境和服务日志。'))
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void submitMessage()
  }
}

onMounted(() => {
  void scrollToBottom()
})
</script>

<style scoped>
.ai-shell {
  position: relative;
  min-height: 100vh;
  padding: 20px;
  overflow: hidden;
}
.ai-glow {
  position: fixed;
  border-radius: 50%;
  filter: blur(28px);
  pointer-events: none;
  z-index: 0;
}
.ai-glow--one {
  width: 340px;
  height: 340px;
  left: -90px;
  bottom: -80px;
  background: rgba(105, 213, 177, 0.2);
}
.ai-glow--two {
  width: 340px;
  height: 340px;
  right: -100px;
  top: 6%;
  background: rgba(91, 140, 255, 0.18);
}
.ai-content {
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.ai-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 22px 24px;
}
.ai-topbar__title {
  font-size: 28px;
  font-weight: 800;
}
.ai-topbar__desc {
  margin-top: 10px;
  max-width: 860px;
  line-height: 1.8;
  color: var(--text-secondary);
}
.ai-topbar__actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.ai-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.8fr);
  gap: 18px;
  min-height: 0;
  flex: 1;
}
.chat-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
:deep(.chat-panel .el-card__body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}
.message-list {
  min-height: 420px;
  max-height: calc(100vh - 420px);
  overflow: auto;
  padding-right: 4px;
}
.message-row {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}
.message-row.is-user {
  flex-direction: row-reverse;
}
.message-avatar {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  color: white;
  font-weight: 800;
  background: linear-gradient(135deg, #5b8cff, #69d5b1);
  box-shadow: 0 10px 24px rgba(91, 140, 255, 0.18);
}
.is-user .message-avatar {
  background: linear-gradient(135deg, #ffb56b, #ff8e6b);
}
.message-bubble {
  flex: 1;
  min-width: 0;
  padding: 16px 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow: var(--shadow-soft);
}
.is-user .message-bubble {
  background: linear-gradient(135deg, rgba(91,140,255,0.12), rgba(255,255,255,0.88));
}
.message-bubble.is-pending {
  background: linear-gradient(135deg, rgba(255,181,107,0.12), rgba(255,255,255,0.88));
}
.message-meta {
  font-size: 12px;
  color: #7b8aa3;
}
.message-content {
  margin-top: 10px;
  line-height: 1.85;
  white-space: pre-wrap;
  word-break: break-word;
}
.composer {
  margin-top: 12px;
  padding-top: 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}
.composer-footer {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}
.composer-tip {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.7;
}
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.info-card {
  height: fit-content;
}
.spec-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.spec-item {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(148, 163, 184, 0.12);
}
.spec-item__label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.plan-list {
  margin: 0;
  padding-left: 18px;
  color: var(--text-secondary);
  line-height: 1.9;
}
.ai-note {
  margin: 0;
}
.prompt-chip {
  border: none;
  cursor: pointer;
  padding: 9px 14px;
  border-radius: 999px;
  background: rgba(255,255,255,0.58);
  color: #35507a;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(255,255,255,0.5);
}
.prompt-chip:hover {
  transform: translateY(-1px);
}
@media (max-width: 1100px) {
  .ai-grid {
    grid-template-columns: 1fr;
  }
  .message-list {
    max-height: none;
    height: 480px;
  }
}
@media (max-width: 768px) {
  .ai-shell {
    padding: 12px;
  }
  .ai-topbar {
    flex-direction: column;
    align-items: flex-start;
  }
  .ai-topbar__actions,
  .composer-footer {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
  .ai-topbar__title {
    font-size: 24px;
  }
}
</style>
