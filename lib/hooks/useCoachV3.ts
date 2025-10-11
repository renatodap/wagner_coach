/**
 * useCoachV3 - API Hooks for Coach V3
 *
 * Handles:
 * - Streaming chat messages (SSE)
 * - Meal logging with detected foods
 * - Conversation history
 */

import { useState, useCallback } from 'react'
import { useCoachV3Store } from '@/lib/stores/coach-v3-store'
import type {
  ChatMessage,
  SendMessageRequest,
  StreamingChunk,
  DetectedFood,
  FoodDetectedV3,
  SuggestedAction
} from '@/types/coach-v3'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

/**
 * Main hook for Coach V3 functionality
 */
export function useCoachV3() {
  const {
    conversationId,
    messages,
    setConversationId,
    addMessage,
    updateMessage,
    setIsLoading
  } = useCoachV3Store()

  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)

  /**
   * Send a message with streaming response
   */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date()
      }
      addMessage(userMessage)

      // Create placeholder for assistant message
      const assistantMessageId = `assistant-${Date.now()}`
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      }
      addMessage(assistantMessage)
      setStreamingMessageId(assistantMessageId)
      setIsLoading(true)

      try {
        // Get auth token
        const supabase = (await import('@/lib/supabase/client')).createClient()
        const {
          data: { session }
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          throw new Error('Not authenticated')
        }

        // Make streaming request
        const response = await fetch(`${API_BASE_URL}/api/v1/coach/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            message: text,
            conversation_id: conversationId
          } as SendMessageRequest)
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        // Check if streaming or JSON response
        const contentType = response.headers.get('content-type') || ''

        if (contentType.includes('application/json')) {
          // Non-streaming response (likely food detection)
          const data = await response.json()

          // Update conversation ID
          if (data.conversation_id && !conversationId) {
            setConversationId(data.conversation_id)
          }

          // Update assistant message
          updateMessage(assistantMessageId, {
            content: data.message || 'Food detected!',
            isStreaming: false,
            foodDetected: data.food_detected,
            suggestedActions: data.suggested_actions
          })
        } else {
          // Streaming response
          await handleStreamingResponse(response, assistantMessageId)
        }
      } catch (error) {
        console.error('[useCoachV3] Send message failed:', error)

        // Update message with error
        updateMessage(assistantMessageId, {
          content:
            'Sorry, I encountered an error. Please try again or contact support if the issue persists.',
          isStreaming: false
        })
      } finally {
        setIsLoading(false)
        setStreamingMessageId(null)
      }
    },
    [conversationId, addMessage, updateMessage, setConversationId, setIsLoading]
  )

  /**
   * Handle streaming SSE response
   */
  const handleStreamingResponse = async (response: Response, messageId: string) => {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('Response body not readable')
    }

    let buffer = ''
    let fullContent = ''
    let detectedFood: FoodDetectedV3 | undefined
    let suggestedActions: SuggestedAction[] | undefined
    let newConversationId: string | undefined

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')

        // Keep last incomplete line in buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()

            if (data === '[DONE]') {
              // Finalize message
              updateMessage(messageId, {
                content: fullContent,
                isStreaming: false,
                foodDetected: detectedFood,
                suggestedActions: suggestedActions
              })
              return
            }

            try {
              const chunk: StreamingChunk = JSON.parse(data)

              if (chunk.type === 'message' && typeof chunk.data === 'string') {
                // Text chunk - append to content
                fullContent += chunk.data
                updateMessage(messageId, { content: fullContent })
              } else if (chunk.type === 'food_detected') {
                // Food detection
                detectedFood = chunk.data as FoodDetectedV3
              } else if (chunk.type === 'suggested_actions') {
                // Suggested actions
                suggestedActions = chunk.data as SuggestedAction[]
              } else if (chunk.type === 'conversation_id') {
                // New conversation ID
                newConversationId = chunk.data as string
                if (!conversationId) {
                  setConversationId(newConversationId)
                }
              }
            } catch (e) {
              console.warn('[useCoachV3] Failed to parse SSE chunk:', data)
            }
          }
        }
      }

      // Stream ended - finalize message
      updateMessage(messageId, {
        content: fullContent,
        isStreaming: false,
        foodDetected: detectedFood,
        suggestedActions: suggestedActions
      })
    } catch (error) {
      console.error('[useCoachV3] Streaming error:', error)
      throw error
    }
  }

  /**
   * Log detected meal
   */
  const logMeal = useCallback(
    async (
      messageId: string,
      detectedFoods: DetectedFood[],
      mealType: string,
      notes?: string
    ) => {
      try {
        // Get auth token
        const supabase = (await import('@/lib/supabase/client')).createClient()
        const {
          data: { session }
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          throw new Error('Not authenticated')
        }

        if (!conversationId) {
          throw new Error('No active conversation')
        }

        // Format meal log request
        const response = await fetch(`${API_BASE_URL}/api/v1/coach/confirm-log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            user_message_id: messageId,
            log_type: 'meal',
            log_data: {
              meal_type: mealType,
              logged_at: new Date().toISOString(),
              foods: detectedFoods.map(df => ({
                food_id: df.food.id,
                serving_quantity: df.quantity.servingQuantity,
                serving_unit: df.quantity.servingUnit,
                gram_quantity: df.quantity.gramQuantity,
                last_edited_field: df.quantity.lastEditedField,
                calories: df.nutrition.calories,
                protein_g: df.nutrition.protein_g,
                carbs_g: df.nutrition.carbs_g,
                fat_g: df.nutrition.fat_g,
                fiber_g: df.nutrition.fiber_g,
                sugar_g: df.nutrition.sugar_g,
                sodium_mg: df.nutrition.sodium_mg
              })),
              notes: notes
            }
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const result = await response.json()

        // Mark message as logged
        updateMessage(messageId, { foodLogged: true })

        return result
      } catch (error) {
        console.error('[useCoachV3] Log meal failed:', error)
        throw error
      }
    },
    [conversationId, updateMessage]
  )

  /**
   * Start new conversation
   */
  const startNewConversation = useCallback(() => {
    useCoachV3Store.getState().clearConversation()
  }, [])

  return {
    messages,
    conversationId,
    streamingMessageId,
    sendMessage,
    logMeal,
    startNewConversation
  }
}
