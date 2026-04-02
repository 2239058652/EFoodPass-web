import request from '@/utils/request'
import { getToken } from '@/utils/auth'
import type {
  ApiResponse,
  AiChatRequest,
  AiChatResponse,
  AiChatStreamChunk,
  AiConversationSessionDetail,
  AiConversationSessionSummary
} from '@/types'

export function sendAiChat(data: AiChatRequest) {
  return request<ApiResponse<AiChatResponse>>({
    url: '/ai/chat',
    method: 'post',
    data
  })
}

export function listAiSessions(limit = 10) {
  return request<ApiResponse<AiConversationSessionSummary[]>>({
    url: '/ai/chat/sessions',
    method: 'get',
    params: { limit }
  })
}

export function getAiSessionDetail(sessionId: string, pageNum = 1, pageSize = 20) {
  return request<ApiResponse<AiConversationSessionDetail>>({
    url: `/ai/chat/session/${encodeURIComponent(sessionId)}`,
    method: 'get',
    params: { pageNum, pageSize }
  })
}

export function renameAiSession(sessionId: string, title: string) {
  return request<ApiResponse<void>>({
    url: `/ai/chat/session/${encodeURIComponent(sessionId)}/title`,
    method: 'put',
    data: { title }
  })
}

export function clearAiSession(sessionId: string) {
  return request<ApiResponse<void>>({
    url: `/ai/chat/session/${encodeURIComponent(sessionId)}`,
    method: 'delete'
  })
}

function resolveBaseUrl(): string {
  const base = String(import.meta.env.VITE_BASE_API || '/api')
  return base.endsWith('/') ? base.slice(0, -1) : base
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function consumeSseBlock(block: string, onChunk: (chunk: AiChatStreamChunk) => void): void {
  const lines = block.split(/\r?\n/)
  const dataLines: string[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith(':')) continue
    if (!line.startsWith('data:')) continue
    dataLines.push(line.slice(5).trim())
  }

  if (!dataLines.length) return
  const payload = dataLines.join('\n')
  if (!payload || payload === '[DONE]') return

  const parsed = tryParseJson(payload)
  if (parsed && typeof parsed === 'object') {
    onChunk(parsed as AiChatStreamChunk)
  }
}

export async function streamAiChat(
  data: AiChatRequest,
  options: {
    signal?: AbortSignal
    onChunk: (chunk: AiChatStreamChunk) => void
  }
): Promise<void> {
  const token = getToken()
  const response = await fetch(`${resolveBaseUrl()}/ai/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
    signal: options.signal
  })

  if (!response.ok) {
    const rawText = await response.text()
    const parsed = tryParseJson(rawText) as { message?: string } | null
    throw new Error(parsed?.message || rawText || `请求失败(${response.status})`)
  }

  if (!response.body) {
    throw new Error('浏览器不支持流式读取')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const blocks = buffer.split(/\r?\n\r?\n/)
    buffer = blocks.pop() || ''

    for (const block of blocks) {
      consumeSseBlock(block, options.onChunk)
    }
  }

  buffer += decoder.decode()
  if (buffer.trim()) {
    consumeSseBlock(buffer, options.onChunk)
  }
}
