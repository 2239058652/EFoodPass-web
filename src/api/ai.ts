import request from '@/utils/request'
import type {
  ApiResponse,
  AiChatRequest,
  AiChatResponse,
  AiConversationSessionDetail,
  AiConversationSessionSummary
} from '@/types'

export function sendAiChat(data: AiChatRequest) {
  return request<ApiResponse<AiChatResponse>>({
    url: '/ai/chat',
    method: 'post',
    data,
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
