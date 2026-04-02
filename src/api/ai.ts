import request from '@/utils/request'
import type { AiChatRequest, AiChatResponse, ApiResponse } from '@/types'

export function aiChat(data: AiChatRequest) {
  return request<ApiResponse<AiChatResponse>>({
    url: '/ai/chat',
    method: 'post',
    data,
    timeout: 300000
  })
}
