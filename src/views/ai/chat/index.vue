<template>
  <div class="ai-page">
    <el-card class="page-card page-hero gradient-warm" shadow="never">
      <div class="page-hero__title">AI 助手</div>
      <div class="page-hero__desc">
        这里已按后端当前 main 分支的 AI 模块对齐：支持标准问答、流式问答、多轮会话、历史恢复、重命名、删除会话，以及 usage / retrieval / 结构化卡片信息展示。
      </div>
      <div class="page-hero__meta">
        <div class="hero-badge">需要登录</div>
        <div class="hero-badge">标准 + 流式</div>
        <div class="hero-badge">sessionId 多轮会话</div>
        <div class="hero-badge">历史恢复</div>
        <div class="hero-badge">RAG / usage / card</div>
      </div>
    </el-card>

    <div class="ai-layout">
      <aside class="session-panel page-card">
        <div class="session-panel__head">
          <div>
            <div class="panel-title">会话列表</div>
            <div class="panel-desc">默认读取最近会话，可切换、重命名和删除。</div>
          </div>
          <el-button type="primary" :disabled="streaming" @click="startNewSession">新对话</el-button>
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
              <el-button :disabled="!currentSessionId || streaming" @click="reloadCurrentSession">刷新会话</el-button>
              <el-button :disabled="!currentSessionId || streaming" @click="handleRenameCurrent">重命名</el-button>
              <el-button :disabled="!currentSessionId || streaming" type="danger" plain @click="handleDeleteCurrent">删除会话</el-button>
            </div>
          </div>

          <div class="summary-box" v-if="currentSummary">
            <div class="summary-box__title">会话摘要</div>
            <div class="summary-box__text">{{ currentSummary }}</div>
          </div>

          <div ref="messageScrollerRef" class="message-scroller app-scrollbar">
            <div class="message-toolbar">
              <el-button v-if="currentSessionId && hasMore" :loading="loadMoreLoading" :disabled="streaming" @click="loadMoreHistory">加载更早消息</el-button>
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
            <div class="composer__mode-bar">
              <el-radio-group v-model="responseMode" size="small" :disabled="sending || streaming">
                <el-radio-button label="standard">标准回复</el-radio-button>
                <el-radio-button label="stream">流式回复</el-radio-button>
              </el-radio-group>
              <div class="composer__mode-note">
                <template v-if="responseMode === 'standard'">
                  标准模式会返回结构化 card、usage、retrieval、conversation 元信息。
                </template>
                <template v-else>
                  流式模式走 <code>/ai/chat/stream</code>，实时输出正文，但不会返回结构化元信息。
                </template>
              </div>
            </div>

            <el-input
              v-model="inputValue"
              type="textarea"
              :rows="4"
              resize="none"
              maxlength="2000"
              show-word-limit
              :disabled="sending || streaming"
              placeholder="请输入你的问题。回车发送，Shift + Enter 换行。"
              @keydown="handleTextareaKeydown"
            />
            <div class="composer__footer">
              <div class="composer__tips">
                <el-tag size="small" effect="plain">自动沿用 sessionId</el-tag>
                <el-tag size="small" effect="plain">支持历史恢复</el-tag>
                <el-tag size="small" effect="plain">支持流式输出</el-tag>
              </div>
              <div class="composer__action-group">
                <el-button v-if="streaming" type="danger" plain @click="stopStreaming">停止输出</el-button>
                <el-button type="primary" :loading="sending || streaming" @click="sendMessage">
                  {{ responseMode === 'stream' ? '开始流式输出' : '发送' }}
                </el-button>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="page-card meta-card" shadow="never">
          <div class="panel-title">最近一次 AI 返回</div>
          <div class="panel-desc">这里展示最近一次调用对应的结构化信息，便于和后端当前 AI 输出对照调试。</div>

          <div v-if="lastResponse" class="meta-content">
            <div class="meta-tags">
              <el-tag effect="plain">scene: {{ lastResponse.scene || '-' }}</el-tag>
              <el-tag effect="plain">grounded: {{ boolText(lastResponse.grounded) }}</el-tag>
              <el-tag effect="plain">nextAction: {{ lastResponse.nextAction || '-' }}</el-tag>
              <el-tag effect="plain">answerType: {{ lastResponse.answerType || '-' }}</el-tag>
              <el-tag effect="plain">toolStatus: {{ lastResponse.toolStatus || '-' }}</el-tag>
            </div>

            <el-descriptions :column="2" border class="meta-desc">
              <el-descriptions-item label="historyApplied">{{ boolText(lastResponse.conversation?.historyApplied) }}</el-descriptions-item>
              <el-descriptions-item label="summaryApplied">{{ boolText(lastResponse.conversation?.summaryApplied) }}</el-descriptions-item>
              <el-descriptions-item label="recentTurnCount">{{ lastResponse.conversation?.recentTurnCount ?? '-' }}</el-descriptions-item>
              <el-descriptions-item label="sceneReused">{{ boolText(lastResponse.conversation?.sceneReused) }}</el-descriptions-item>
            </el-descriptions>

            <div v-if="lastResponse.usage" class="display-card">
              <div class="display-card__title">模型调用信息</div>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="responseId">{{ lastResponse.usage.responseId || '-' }}</el-descriptions-item>
                <el-descriptions-item label="model">{{ lastResponse.usage.model || '-' }}</el-descriptions-item>
                <el-descriptions-item label="promptTokens">{{ lastResponse.usage.promptTokens ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="completionTokens">{{ lastResponse.usage.completionTokens ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="totalTokens">{{ lastResponse.usage.totalTokens ?? '-' }}</el-descriptions-item>
              </el-descriptions>
            </div>

            <div v-if="lastResponse.retrieval" class="display-card">
              <div class="display-card__title">检索信息</div>
              <div class="display-card__summary" v-if="lastResponse.retrieval.retrievalApplied">
                已启用知识检索。
              </div>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="retrievalApplied">{{ boolText(lastResponse.retrieval.retrievalApplied) }}</el-descriptions-item>
                <el-descriptions-item label="knowledgeBase">{{ lastResponse.retrieval.knowledgeBase || '-' }}</el-descriptions-item>
                <el-descriptions-item label="filterExpression">{{ lastResponse.retrieval.filterExpression || '-' }}</el-descriptions-item>
                <el-descriptions-item label="topK">{{ lastResponse.retrieval.topK ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="similarityThreshold">{{ lastResponse.retrieval.similarityThreshold ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="retrievedCount">{{ lastResponse.retrieval.retrievedCount ?? 0 }}</el-descriptions-item>
              </el-descriptions>

              <div v-if="lastResponse.retrieval.documents?.length" class="retrieval-list">
                <div v-for="doc in lastResponse.retrieval.documents" :key="doc.id || doc.title" class="retrieval-item">
                  <div class="retrieval-item__title">{{ doc.title || '未命名文档' }}</div>
                  <div class="retrieval-item__score">score: {{ doc.score ?? '-' }}</div>
                  <div class="retrieval-item__snippet">{{ doc.snippet || '-' }}</div>
                </div>
              </div>
            </div>

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

          <div v-else-if="lastStreamInfo" class="meta-content">
            <div class="meta-tags">
              <el-tag effect="plain">sessionId: {{ lastStreamInfo.sessionId || '-' }}</el-tag>
              <el-tag effect="plain">scene: {{ lastStreamInfo.scene || '-' }}</el-tag>
              <el-tag effect="plain">done: {{ boolText(lastStreamInfo.done) }}</el-tag>
              <el-tag effect="plain">interrupted: {{ boolText(lastStreamInfo.interrupted) }}</el-tag>
            </div>
            <div class="dialog-note">
              本次为流式调用，后端只返回 <code>sessionId / scene / content / done</code> 分块数据；
              <code>toolStatus / usage / retrieval / card</code> 这些结构化元信息仅在标准回复模式下可见。
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
  sendAiChat,
  streamAiChat
} from '@/api/ai'
import type {
  AiChatResponse,
  AiConversationMessage,
  AiConversationSessionDetail,
  AiConversationSessionSummary
} from '@/types'

interface AiLastStreamInfo {
  sessionId?: string
  scene?: string
  done: boolean
  interrupted: boolean
}

const sessions = ref<AiConversationSessionSummary[]>([])
const sessionLoading = ref(false)
const detailLoading = ref(false)
const loadMoreLoading = ref(false)
const sending = ref(false)
const streaming = ref(false)

const currentSessionId = ref('')
const currentSummary = ref('')
const totalMessages = ref(0)
const pageNum = ref(1)
const hasMore = ref(false)
const pageSize = 20

const inputValue = ref('')
const responseMode = ref<'standard' | 'stream'>('standard')
const messages = ref<AiConversationMessage[]>([])
const lastResponse = ref<AiChatResponse | null>(null)
const lastStreamInfo = ref<AiLastStreamInfo | null>(null)
const messageScrollerRef = ref<HTMLDivElement>()
const streamAbortController = ref<AbortController | null>(null)

const currentSession = computed(() => sessions.value.find((item) => item.sessionId === currentSessionId.value) || null)
const currentSessionTitle = computed(() => currentSession.value?.title || (currentSessionId.value ? '当前会话' : '新对话'))

function formatTime(timestamp?: number): string {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '-'
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function boolText(value?: boolean): string {
  if (value === true) return 'true'
  if (value === false) return 'false'
  return '-'
}

function buildLocalMessage(role: 'user' | 'assistant', content: string): AiConversationMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
  lastStreamInfo.value = null
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return '请求失败，请稍后重试'
}

function isAbortError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error && (error as { name?: string }).name === 'AbortError'
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
    messages.value = [...(detail.messages || []), ...messages.value]
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
  if (sessionIndex >= 0) {
    sessions.value.splice(sessionIndex, 1, summary)
  }
  if (!appendHistory) scrollToBottom()
}

async function openSession(sessionId: string): Promise<void> {
  if (!sessionId) return
  detailLoading.value = true
  try {
    const res = await getAiSessionDetail(sessionId, 1, pageSize)
    pageNum.value = 1
    lastResponse.value = null
    lastStreamInfo.value = null
    await applySessionDetail(res.data, false)
  } finally {
    detailLoading.value = false
  }
}

async function handleSelectSession(sessionId: string): Promise<void> {
  if (!sessionId || sessionId === currentSessionId.value || streaming.value) return
  await openSession(sessionId)
}

function startNewSession(): void {
  if (streaming.value) return
  resetConversationView()
  inputValue.value = ''
}

async function reloadCurrentSession(): Promise<void> {
  if (!currentSessionId.value) return
  await openSession(currentSessionId.value)
}

async function loadMoreHistory(): Promise<void> {
  if (!currentSessionId.value || !hasMore.value || loadMoreLoading.value || streaming.value) return
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

async function sendStandardMessage(message: string): Promise<void> {
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
    lastStreamInfo.value = null

    await fetchSessions(false)
    totalMessages.value = messages.value.length
    scrollToBottom()
  } catch (error) {
    messages.value.push(buildLocalMessage('assistant', '请求失败，请稍后重试。'))
    ElMessage.error(getErrorMessage(error))
    scrollToBottom()
  } finally {
    sending.value = false
  }
}

async function sendStreamMessage(message: string): Promise<void> {
  const localUserMessage = buildLocalMessage('user', message)
  const localAssistantMessage = buildLocalMessage('assistant', '')
  messages.value.push(localUserMessage)
  messages.value.push(localAssistantMessage)
  inputValue.value = ''
  scrollToBottom()

  const controller = new AbortController()
  streamAbortController.value = controller
  streaming.value = true
  lastResponse.value = null
  lastStreamInfo.value = {
    sessionId: currentSessionId.value || '',
    scene: '',
    done: false,
    interrupted: false
  }

  try {
    await streamAiChat(
      {
        message,
        sessionId: currentSessionId.value || undefined
      },
      {
        signal: controller.signal,
        onChunk: (chunk) => {
          if (chunk.sessionId) currentSessionId.value = chunk.sessionId
          if (chunk.content) {
            localAssistantMessage.content += chunk.content
          }
          lastStreamInfo.value = {
            sessionId: chunk.sessionId || currentSessionId.value || '',
            scene: chunk.scene || lastStreamInfo.value?.scene || '',
            done: !!chunk.done,
            interrupted: false
          }
          totalMessages.value = messages.value.length
          scrollToBottom()
        }
      }
    )

    await fetchSessions(false)
  } catch (error) {
    if (isAbortError(error)) {
      if (!localAssistantMessage.content) {
        localAssistantMessage.content = '本次流式输出已停止。'
      }
      lastStreamInfo.value = {
        sessionId: currentSessionId.value || '',
        scene: lastStreamInfo.value?.scene || '',
        done: false,
        interrupted: true
      }
      ElMessage.info('已停止本次流式输出')
    } else {
      if (!localAssistantMessage.content) {
        localAssistantMessage.content = '请求失败，请稍后重试。'
      }
      ElMessage.error(getErrorMessage(error))
    }
    scrollToBottom()
  } finally {
    streaming.value = false
    streamAbortController.value = null
    totalMessages.value = messages.value.length
  }
}

async function sendMessage(): Promise<void> {
  const message = inputValue.value.trim()
  if (!message || sending.value || streaming.value) return

  if (responseMode.value === 'stream') {
    await sendStreamMessage(message)
    return
  }

  await sendStandardMessage(message)
}

function stopStreaming(): void {
  streamAbortController.value?.abort()
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
.composer__mode-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.composer__mode-note { color: var(--text-secondary); font-size: 12px; line-height: 1.7; }
.composer__footer { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.composer__tips { display: flex; flex-wrap: wrap; gap: 8px; }
.composer__action-group { display: flex; gap: 10px; }
.meta-content { margin-top: 18px; display: flex; flex-direction: column; gap: 16px; }
.meta-tags { display: flex; flex-wrap: wrap; gap: 10px; }
.meta-desc { margin-top: 4px; }
.display-card { padding: 16px; border-radius: 20px; background: rgba(255,255,255,0.76); border: 1px solid rgba(148,163,184,0.12); }
.display-card__title { font-size: 18px; font-weight: 800; }
.display-card__sub { margin-top: 6px; color: var(--text-secondary); font-size: 13px; }
.display-card__summary { margin-top: 10px; line-height: 1.8; color: var(--text-main); white-space: pre-wrap; }
.retrieval-list { margin-top: 14px; display: grid; gap: 12px; }
.retrieval-item { padding: 14px; border-radius: 16px; background: rgba(246,249,255,0.82); border: 1px solid rgba(148,163,184,0.12); }
.retrieval-item__title { font-weight: 700; }
.retrieval-item__score { margin-top: 6px; color: var(--text-secondary); font-size: 12px; }
.retrieval-item__snippet { margin-top: 8px; color: var(--text-main); line-height: 1.7; white-space: pre-wrap; }
.session-loading, .message-loading { padding: 8px 4px; }
@media (max-width: 1200px) { .ai-layout { grid-template-columns: 1fr; } .session-panel { min-height: 280px; } }
@media (max-width: 768px) {
  .chat-card__head,
  .composer__footer,
  .message-toolbar,
  .composer__mode-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  .message-bubble { max-width: 100%; }
}
</style>
