<template>
  <div class="ai-page">
    <el-card class="page-card page-hero gradient-warm" shadow="never">
      <div class="page-hero__title">AI 助手</div>
      <div class="page-hero__desc">
        这里已经按后端最新 AI 模块对齐：支持多轮会话、历史会话列表、会话详情恢复、会话重命名、删除会话，以及结构化卡片展示。
      </div>
      <div class="page-hero__meta">
        <div class="hero-badge">需要登录</div>
        <div class="hero-badge">sessionId 多轮会话</div>
        <div class="hero-badge">历史恢复</div>
        <div class="hero-badge">结构化返回</div>
      </div>
    </el-card>

    <div class="ai-layout">
      <aside class="session-panel page-card">
        <div class="session-panel__head">
          <div>
            <div class="panel-title">会话列表</div>
            <div class="panel-desc">默认读取最近会话，可切换、重命名和删除。</div>
          </div>
          <el-button type="primary" @click="startNewSession">新对话</el-button>
        </div>

        <div class="session-panel__body app-scrollbar">
          <div v-if="sessionLoading" class="session-loading">
            <el-skeleton :rows="6" animated />
          </div>

          <template v-else>
            <div
              v-for="item in sessions"
              :key="item.sessionId"
              class="session-item"
              :class="{ 'session-item--active': item.sessionId === currentSessionId }"
              @click="handleSelectSession(item.sessionId)"
            >
              <div class="session-item__title-row">
                <div class="session-item__title">{{ item.title || '未命名会话' }}</div>
                <div class="session-item__actions" @click.stop>
                  <el-button text size="small" @click="handleRename(item)">重命名</el-button>
                  <el-button text size="small" @click="handleDelete(item)">删除</el-button>
                </div>
              </div>
              <div class="session-item__preview">{{ item.preview || '暂无预览内容' }}</div>
              <div class="session-item__meta">
                <el-tag size="small" effect="plain">{{ item.scene || 'general' }}</el-tag>
                <span>{{ formatTime(item.updatedAt) }}</span>
              </div>
            </div>

            <el-empty v-if="!sessions.length" description="还没有历史会话，直接开始提问即可。" />
          </template>
        </div>
      </aside>

      <section class="chat-panel">
        <el-card class="page-card chat-card" shadow="never">
          <div class="chat-card__head">
            <div>
              <div class="chat-card__title">{{ currentSessionTitle }}</div>
              <div class="chat-card__desc">
                <template v-if="currentSessionId">
                  当前会话 ID：<code>{{ currentSessionId }}</code>
                </template>
                <template v-else>
                  当前为新会话，发送第一条消息后会自动生成 sessionId。
                </template>
              </div>
            </div>
            <div class="chat-card__actions">
              <el-button :disabled="!currentSessionId" @click="reloadCurrentSession">刷新会话</el-button>
              <el-button :disabled="!currentSessionId" @click="handleRenameCurrent">重命名</el-button>
              <el-button :disabled="!currentSessionId" type="danger" plain @click="handleDeleteCurrent">删除会话</el-button>
            </div>
          </div>

          <div class="summary-box" v-if="currentSummary">
            <div class="summary-box__title">会话摘要</div>
            <div class="summary-box__text">{{ currentSummary }}</div>
          </div>

          <div ref="messageScrollerRef" class="message-scroller app-scrollbar">
            <div class="message-toolbar">
              <el-button v-if="currentSessionId && hasMore" :loading="loadMoreLoading" @click="loadMoreHistory">加载更早消息</el-button>
              <div class="message-toolbar__note" v-if="currentSessionId">
                已加载 {{ messages.length }} 条消息
                <span v-if="totalMessages"> / 共 {{ totalMessages }} 条</span>
              </div>
            </div>

            <div v-if="detailLoading" class="message-loading">
              <el-skeleton :rows="8" animated />
            </div>

            <template v-else>
              <div v-if="!messages.length" class="message-empty">
                <el-empty description="开始你的第一句提问吧，例如：当前订单整体情况怎么样？" />
              </div>

              <div
                v-for="item in messages"
                :key="item.id"
                class="message-row"
                :class="item.role === 'user' ? 'message-row--user' : 'message-row--assistant'"
              >
                <div class="message-bubble">
                  <div class="message-bubble__meta">
                    <span>{{ item.role === 'user' ? '我' : 'AI' }}</span>
                    <span>{{ formatTime(item.createdAt) }}</span>
                  </div>
                  <div class="message-bubble__content">{{ item.content }}</div>
                </div>
              </div>
            </template>
          </div>

          <div class="composer">
            <el-input
              v-model="inputValue"
              type="textarea"
              :rows="4"
              resize="none"
              maxlength="2000"
              show-word-limit
              placeholder="请输入你的问题。回车发送，Shift + Enter 换行。"
              @keydown="handleTextareaKeydown"
            />
            <div class="composer__footer">
              <div class="composer__tips">
                <el-tag size="small" effect="plain">自动沿用 sessionId</el-tag>
                <el-tag size="small" effect="plain">支持历史恢复</el-tag>
                <el-tag size="small" effect="plain">支持结构化卡片</el-tag>
              </div>
              <el-button type="primary" :loading="sending" @click="sendMessage">发送</el-button>
            </div>
          </div>
        </el-card>

        <el-card class="page-card meta-card" shadow="never">
          <div class="panel-title">最近一次 AI 返回</div>
          <div class="panel-desc">这里展示后端最新一次聊天接口返回的结构化信息。</div>

          <div v-if="lastResponse" class="meta-content">
            <div class="meta-tags">
              <el-tag effect="plain">scene: {{ lastResponse.scene || '-' }}</el-tag>
              <el-tag effect="plain">grounded: {{ boolText(lastResponse.grounded) }}</el-tag>
              <el-tag effect="plain">nextAction: {{ lastResponse.nextAction || '-' }}</el-tag>
              <el-tag effect="plain">answerType: {{ lastResponse.answerType || '-' }}</el-tag>
            </div>

            <el-descriptions :column="2" border class="meta-desc">
              <el-descriptions-item label="historyApplied">{{ boolText(lastResponse.conversation?.historyApplied) }}</el-descriptions-item>
              <el-descriptions-item label="summaryApplied">{{ boolText(lastResponse.conversation?.summaryApplied) }}</el-descriptions-item>
              <el-descriptions-item label="recentTurnCount">{{ lastResponse.conversation?.recentTurnCount ?? '-' }}</el-descriptions-item>
              <el-descriptions-item label="sceneReused">{{ boolText(lastResponse.conversation?.sceneReused) }}</el-descriptions-item>
            </el-descriptions>

            <div v-if="lastResponse.card" class="display-card">
              <div class="display-card__title">{{ lastResponse.card.title || '结构化卡片' }}</div>
              <div class="display-card__sub">
                <span>type: {{ lastResponse.card.type || '-' }}</span>
              </div>
              <div class="display-card__summary" v-if="lastResponse.card.summary">{{ lastResponse.card.summary }}</div>
              <el-descriptions v-if="lastResponse.card.fields?.length" :column="1" border>
                <el-descriptions-item
                  v-for="(field, index) in lastResponse.card.fields"
                  :key="`${field.label}-${index}`"
                  :label="field.label || '字段'"
                >
                  {{ field.value || '-' }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </div>

          <el-empty v-else description="发送消息后，这里会显示本次响应的元信息和卡片。" />
        </el-card>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  clearAiSession,
  getAiSessionDetail,
  listAiSessions,
  renameAiSession,
  sendAiChat
} from '@/api/ai'
import type {
  AiChatResponse,
  AiConversationMessage,
  AiConversationSessionDetail,
  AiConversationSessionSummary
} from '@/types'

const sessions = ref<AiConversationSessionSummary[]>([])
const sessionLoading = ref(false)
const detailLoading = ref(false)
const loadMoreLoading = ref(false)
const sending = ref(false)

const currentSessionId = ref('')
const currentSummary = ref('')
const totalMessages = ref(0)
const pageNum = ref(1)
const pageSize = 20
const hasMore = ref(false)

const messages = ref<AiConversationMessage[]>([])
const inputValue = ref('')
const lastResponse = ref<AiChatResponse | null>(null)
const messageScrollerRef = ref<HTMLElement>()

const currentSession = computed(() => sessions.value.find((item) => item.sessionId === currentSessionId.value) || null)
const currentSessionTitle = computed(() => currentSession.value?.title || (currentSessionId.value ? '当前会话' : '新会话'))

function boolText(value?: boolean | null): string {
  if (value === true) return 'true'
  if (value === false) return 'false'
  return '-'
}

function formatTime(value?: number | null): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
}

function buildLocalMessage(role: 'user' | 'assistant', content: string): AiConversationMessage {
  return {
    id: `local-${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    createdAt: Date.now()
  }
}

function scrollToBottom(): void {
  nextTick(() => {
    const el = messageScrollerRef.value
    if (!el) return
    el.scrollTop = el.scrollHeight
  })
}

function resetConversationView(): void {
  currentSessionId.value = ''
  currentSummary.value = ''
  totalMessages.value = 0
  pageNum.value = 1
  hasMore.value = false
  messages.value = []
  lastResponse.value = null
}

async function fetchSessions(openLatest = false): Promise<void> {
  sessionLoading.value = true
  try {
    const res = await listAiSessions(20)
    sessions.value = res.data || []
    if (openLatest && sessions.value.length) {
      await openSession(sessions.value[0].sessionId)
    }
  } finally {
    sessionLoading.value = false
  }
}

async function applySessionDetail(detail: AiConversationSessionDetail, appendHistory = false): Promise<void> {
  currentSessionId.value = detail.sessionId
  currentSummary.value = detail.summary || ''
  totalMessages.value = detail.totalMessages || 0
  hasMore.value = !!detail.hasMore

  if (appendHistory) {
    messages.value = [...detail.messages, ...messages.value]
  } else {
    messages.value = detail.messages || []
  }

  const sessionIndex = sessions.value.findIndex((item) => item.sessionId === detail.sessionId)
  const summary: AiConversationSessionSummary = {
    sessionId: detail.sessionId,
    title: detail.title,
    scene: detail.scene,
    preview: detail.preview,
    updatedAt: detail.updatedAt
  }
  if (sessionIndex >= 0) sessions.value.splice(sessionIndex, 1, summary)
  if (!appendHistory) scrollToBottom()
}

async function openSession(sessionId: string): Promise<void> {
  if (!sessionId) return
  detailLoading.value = true
  try {
    const res = await getAiSessionDetail(sessionId, 1, pageSize)
    pageNum.value = 1
    lastResponse.value = null
    await applySessionDetail(res.data, false)
  } finally {
    detailLoading.value = false
  }
}

async function handleSelectSession(sessionId: string): Promise<void> {
  if (!sessionId || sessionId === currentSessionId.value) return
  await openSession(sessionId)
}

function startNewSession(): void {
  resetConversationView()
  inputValue.value = ''
}

async function reloadCurrentSession(): Promise<void> {
  if (!currentSessionId.value) return
  await openSession(currentSessionId.value)
}

async function loadMoreHistory(): Promise<void> {
  if (!currentSessionId.value || !hasMore.value || loadMoreLoading.value) return
  loadMoreLoading.value = true
  try {
    const nextPage = pageNum.value + 1
    const res = await getAiSessionDetail(currentSessionId.value, nextPage, pageSize)
    pageNum.value = nextPage
    await applySessionDetail(res.data, true)
  } finally {
    loadMoreLoading.value = false
  }
}

async function sendMessage(): Promise<void> {
  const message = inputValue.value.trim()
  if (!message || sending.value) return

  const localUserMessage = buildLocalMessage('user', message)
  messages.value.push(localUserMessage)
  inputValue.value = ''
  scrollToBottom()

  sending.value = true
  try {
    const res = await sendAiChat({
      message,
      sessionId: currentSessionId.value || undefined
    })

    const data = res.data
    if (data.sessionId) currentSessionId.value = data.sessionId
    messages.value.push(buildLocalMessage('assistant', data.content || ''))
    lastResponse.value = data

    await fetchSessions(false)
    totalMessages.value = messages.value.length
    scrollToBottom()
  } catch {
    messages.value.push(buildLocalMessage('assistant', '请求失败，请稍后重试。'))
    scrollToBottom()
  } finally {
    sending.value = false
  }
}

async function handleRename(item: AiConversationSessionSummary): Promise<void> {
  try {
    const result = await ElMessageBox.prompt('请输入新的会话标题', '重命名会话', {
      inputValue: item.title || '',
      inputPlaceholder: '请输入标题',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    const title = (result.value || '').trim()
    if (!title) {
      ElMessage.warning('标题不能为空')
      return
    }
    await renameAiSession(item.sessionId, title)
    ElMessage.success('重命名成功')
    await fetchSessions(false)
    if (item.sessionId === currentSessionId.value) {
      await reloadCurrentSession()
    }
  } catch {
    // ignore cancel
  }
}

async function handleRenameCurrent(): Promise<void> {
  if (!currentSession.value) return
  await handleRename(currentSession.value)
}

async function handleDelete(item: AiConversationSessionSummary): Promise<void> {
  try {
    await ElMessageBox.confirm(`确认删除会话“${item.title || item.sessionId}”吗？`, '删除会话', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await clearAiSession(item.sessionId)
    ElMessage.success('会话已删除')
    if (item.sessionId === currentSessionId.value) resetConversationView()
    await fetchSessions(false)
  } catch {
    // ignore cancel
  }
}

async function handleDeleteCurrent(): Promise<void> {
  if (!currentSession.value) return
  await handleDelete(currentSession.value)
}

function handleTextareaKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Enter') return
  if (event.shiftKey) return
  event.preventDefault()
  void sendMessage()
}

onMounted(async () => {
  await fetchSessions(true)
})
</script>

<style scoped>
.ai-page { display: flex; flex-direction: column; gap: 18px; }
.ai-layout { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 18px; min-height: calc(100vh - 250px); }
.session-panel { display: flex; flex-direction: column; min-height: 680px; padding: 18px; }
.session-panel__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
.session-panel__body { min-height: 0; flex: 1; overflow: auto; padding-right: 4px; }
.session-item { padding: 14px; border-radius: 18px; border: 1px solid rgba(148,163,184,0.16); background: rgba(255,255,255,0.72); cursor: pointer; transition: all .2s ease; }
.session-item + .session-item { margin-top: 12px; }
.session-item:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(148,163,184,0.12); }
.session-item--active { border-color: rgba(91,140,255,0.28); background: linear-gradient(135deg, rgba(91,140,255,0.12), rgba(105,213,177,0.08), rgba(255,255,255,0.9)); }
.session-item__title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.session-item__title { font-size: 15px; font-weight: 700; line-height: 1.5; }
.session-item__actions { flex: 0 0 auto; display: flex; gap: 4px; }
.session-item__preview { margin-top: 10px; color: var(--text-secondary); font-size: 13px; line-height: 1.7; word-break: break-word; }
.session-item__meta { margin-top: 10px; display: flex; justify-content: space-between; align-items: center; gap: 8px; color: #7d8ca5; font-size: 12px; }
.chat-panel { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.chat-card { display: flex; flex-direction: column; min-height: 680px; }
:deep(.chat-card .el-card__body) { display: flex; flex-direction: column; min-height: 680px; }
.chat-card__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.chat-card__title { font-size: 20px; font-weight: 800; }
.chat-card__desc { margin-top: 6px; color: var(--text-secondary); line-height: 1.7; word-break: break-all; }
.chat-card__actions { display: flex; flex-wrap: wrap; gap: 10px; }
.summary-box { margin-top: 16px; padding: 14px 16px; border-radius: 18px; background: linear-gradient(135deg, rgba(91,140,255,0.08), rgba(105,213,177,0.08)); }
.summary-box__title { font-size: 13px; font-weight: 700; color: #4f6280; }
.summary-box__text { margin-top: 8px; line-height: 1.8; color: var(--text-main); white-space: pre-wrap; }
.message-scroller { margin-top: 18px; flex: 1; min-height: 320px; max-height: 560px; overflow: auto; padding: 4px 6px 4px 2px; }
.message-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.message-toolbar__note { color: var(--text-secondary); font-size: 12px; }
.message-empty { min-height: 260px; display: flex; align-items: center; justify-content: center; }
.message-row { display: flex; margin-bottom: 14px; }
.message-row--user { justify-content: flex-end; }
.message-row--assistant { justify-content: flex-start; }
.message-bubble { max-width: min(760px, 86%); padding: 14px 16px; border-radius: 18px; box-shadow: var(--shadow-soft); white-space: pre-wrap; word-break: break-word; line-height: 1.8; }
.message-row--user .message-bubble { background: linear-gradient(135deg, #5b8cff, #6f83ff); color: #fff; border-bottom-right-radius: 8px; }
.message-row--assistant .message-bubble { background: rgba(255,255,255,0.88); border: 1px solid rgba(148,163,184,0.12); border-bottom-left-radius: 8px; }
.message-bubble__meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 12px; opacity: 0.82; margin-bottom: 8px; }
.message-bubble__content { font-size: 14px; }
.composer { margin-top: 18px; padding-top: 16px; border-top: 1px solid rgba(148,163,184,0.12); }
.composer__footer { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.composer__tips { display: flex; flex-wrap: wrap; gap: 8px; }
.meta-content { margin-top: 18px; display: flex; flex-direction: column; gap: 16px; }
.meta-tags { display: flex; flex-wrap: wrap; gap: 10px; }
.meta-desc { margin-top: 4px; }
.display-card { padding: 16px; border-radius: 20px; background: rgba(255,255,255,0.76); border: 1px solid rgba(148,163,184,0.12); }
.display-card__title { font-size: 18px; font-weight: 800; }
.display-card__sub { margin-top: 6px; color: var(--text-secondary); font-size: 13px; }
.display-card__summary { margin-top: 10px; line-height: 1.8; color: var(--text-main); white-space: pre-wrap; }
.session-loading, .message-loading { padding: 8px 4px; }
@media (max-width: 1200px) { .ai-layout { grid-template-columns: 1fr; } .session-panel { min-height: 280px; } }
@media (max-width: 768px) { .chat-card__head, .composer__footer, .message-toolbar { flex-direction: column; align-items: flex-start; } .message-bubble { max-width: 100%; } }
</style>
