/**
 * Unified Coach API Client
 *
 * Handles all API calls to the unified Coach backend endpoints.
 * Single interface for chat + logging with automatic detection.
 */

import { createClient } from '@/lib/supabase/client'

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// =====================================================
// Types
// =====================================================

export type MessageRole = 'user' | 'assistant' | 'system'
export type MessageType = 'chat' | 'log_preview' | 'log_confirmed' | 'system'
export type LogType = 'meal' | 'workout' | 'activity' | 'measurement'

export interface UnifiedMessage {
  id: string
  role: MessageRole
  content: string
  message_type: MessageType
  quick_entry_log_id?: string
  is_vectorized: boolean
  created_at: string
}

export interface LogPreview {
  log_type: LogType
  confidence: number
  data: Record<string, any>
  reasoning: string
  summary: string
  validation?: {
    errors: string[]
    warnings: string[]
    missing_critical: string[]
  }
  suggestions?: string[]
}

export interface RAGContext {
  sources_count: number
  coach_messages_count: number
  quick_entries_count: number
  similarity_threshold: number
}

export interface SendMessageRequest {
  message: string
  conversation_id?: string | null
  has_image?: boolean
  has_audio?: boolean
  image_urls?: string[]
}

export interface SendMessageResponse {
  success: boolean
  conversation_id: string
  message_id: string
  is_log_preview: boolean
  message?: string
  log_preview?: LogPreview
  rag_context?: RAGContext
  tokens_used?: number
  cost_usd?: number
  error?: string
}

export interface ConfirmLogRequest {
  conversation_id: string
  log_data: Record<string, any>
  log_type: LogType
  user_message_id: string
}

export interface ConfirmLogResponse {
  success: boolean
  log_id?: string
  quick_entry_log_id?: string
  system_message_id: string
  system_message: string
  error?: string
}

export interface ConversationSummary {
  id: string
  title?: string
  message_count: number
  last_message_at: string
  created_at: string
  archived: boolean
  last_message_preview?: string
}

export interface ConversationListResponse {
  success: boolean
  conversations: ConversationSummary[]
  total_count: number
  has_more: boolean
}

export interface MessageListResponse {
  success: boolean
  conversation_id: string
  messages: UnifiedMessage[]
  total_count: number
  has_more: boolean
}

// =====================================================
// API Functions
// =====================================================

/**
 * Get authentication headers with JWT token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  }
}

/**
 * Send a message to the unified Coach
 *
 * Auto-detects if message is chat or log and routes accordingly.
 *
 * @example
 * // Chat message
 * const response = await sendMessage({ message: "What should I eat for breakfast?" })
 * console.log(response.message) // AI response
 *
 * @example
 * // Log message (gets preview)
 * const response = await sendMessage({ message: "I ate 3 eggs and oatmeal" })
 * console.log(response.log_preview) // { log_type: "meal", data: {...} }
 */
export async function sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE}/api/v1/coach/message`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Send a message with streaming support (for chat responses)
 *
 * Returns an async generator that yields response chunks as they arrive.
 * Use this for real-time chat experiences.
 *
 * @example
 * for await (const chunk of sendMessageStreaming({ message: "Tell me about protein" })) {
 *   console.log(chunk) // Display each chunk as it arrives
 * }
 */
export async function* sendMessageStreaming(
  request: SendMessageRequest
): AsyncGenerator<SendMessageResponse, void, unknown> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE}/api/v1/coach/message`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || error.detail || `HTTP ${response.status}`)
  }

  // Check if response is streaming (chat) or JSON (log preview)
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    // Log preview - return single JSON response
    const data = await response.json()
    yield data
    return
  }

  // Streaming chat response
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error('Response body is not readable')
  }

  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')

    // Keep the last incomplete line in the buffer
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()

        if (data === '[DONE]') {
          return
        }

        try {
          const parsed = JSON.parse(data)
          yield parsed
        } catch (e) {
          // Skip invalid JSON
          console.warn('Failed to parse SSE data:', data)
        }
      }
    }
  }
}

/**
 * Confirm a detected log (meal, workout, etc.)
 *
 * After user reviews the log preview, call this to save it.
 *
 * @example
 * const result = await confirmLog({
 *   conversation_id: "123e4567...",
 *   log_type: "meal",
 *   user_message_id: "456e7890...",
 *   log_data: {
 *     meal_type: "breakfast",
 *     calories: 450,
 *     protein: 35,
 *   }
 * })
 * console.log(result.system_message) // "✅ Meal logged! 450 calories"
 */
export async function confirmLog(request: ConfirmLogRequest): Promise<ConfirmLogResponse> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE}/api/v1/coach/confirm-log`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Get conversation history list (ChatGPT-like sidebar)
 *
 * @example
 * const { conversations, has_more } = await getConversations({ limit: 50 })
 */
export async function getConversations(params: {
  limit?: number
  offset?: number
  include_archived?: boolean
} = {}): Promise<ConversationListResponse> {
  const headers = await getAuthHeaders()

  const queryParams = new URLSearchParams()
  if (params.limit) queryParams.set('limit', params.limit.toString())
  if (params.offset) queryParams.set('offset', params.offset.toString())
  if (params.include_archived !== undefined) {
    queryParams.set('include_archived', params.include_archived.toString())
  }

  const url = `${API_BASE}/api/v1/coach/conversations?${queryParams}`
  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`Failed to fetch conversations: ${response.status}`)
  }

  return response.json()
}

/**
 * Get messages in a specific conversation
 *
 * @example
 * const { messages } = await getConversationMessages("123e4567...", { limit: 50 })
 */
export async function getConversationMessages(
  conversationId: string,
  params: {
    limit?: number
    offset?: number
  } = {}
): Promise<MessageListResponse> {
  const headers = await getAuthHeaders()

  const queryParams = new URLSearchParams()
  if (params.limit) queryParams.set('limit', params.limit.toString())
  if (params.offset) queryParams.set('offset', params.offset.toString())

  const url = `${API_BASE}/api/v1/coach/conversations/${conversationId}/messages?${queryParams}`
  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.status}`)
  }

  return response.json()
}

/**
 * Archive a conversation (hide from main list)
 */
export async function archiveConversation(conversationId: string): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE}/api/v1/coach/conversations/${conversationId}/archive`,
    {
      method: 'PATCH',
      headers,
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to archive conversation: ${response.status}`)
  }
}

/**
 * Health check for unified Coach API
 */
export async function healthCheck(): Promise<{
  status: string
  service: string
  version: string
  features: string[]
}> {
  const response = await fetch(`${API_BASE}/api/v1/coach/health`)
  return response.json()
}
