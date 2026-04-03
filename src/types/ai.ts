export interface AiChatRequest {
  message: string
  sessionId?: string
}

export interface AiDisplayField {
  label: string
  value: string
}

export interface AiDisplayCard {
  title?: string
  type?: string
  summary?: string
  fields?: AiDisplayField[]
}

export interface AiConversationMeta {
  historyApplied?: boolean
  summaryApplied?: boolean
  recentTurnCount?: number
  sceneReused?: boolean
}

export interface AiModelUsage {
  responseId?: string
  model?: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

export interface AiRetrievedDocument {
  id?: string
  title?: string
  score?: number
  snippet?: string
}

export interface AiRetrievalMeta {
  retrievalApplied?: boolean
  knowledgeBase?: string
  filterExpression?: string
  topK?: number
  similarityThreshold?: number
  retrievedCount?: number
  documents?: AiRetrievedDocument[]
}

export interface AiChatResponse {
  sessionId: string
  content: string
  scene?: string
  grounded?: boolean
  nextAction?: string
  answerType?: string
  toolStatus?: string
  card?: AiDisplayCard | null
  usage?: AiModelUsage | null
  conversation?: AiConversationMeta | null
  retrieval?: AiRetrievalMeta | null
}

export interface AiChatStreamChunk {
  sessionId: string
  scene?: string
  content: string
  done: boolean
}

export interface AiConversationMessage {
  id: string
  role: 'user' | 'assistant' | string
  content: string
  createdAt: number
}

export interface AiConversationSessionSummary {
  sessionId: string
  title: string
  scene?: string
  preview?: string
  updatedAt?: number
}

export interface AiConversationSessionDetail {
  sessionId: string
  title: string
  scene?: string
  preview?: string
  updatedAt?: number
  summary?: string
  totalMessages?: number
  pageNum?: number
  pageSize?: number
  hasMore?: boolean
  messages: AiConversationMessage[]
}

export interface SystemKnowledgeIndexStatusResponse {
  knowledgeBase: string
  documentCount: number
  lastRebuildAt?: number | null
  topK?: number | null
  similarityThreshold?: number | null
}
