'use client'

/**
 * ConversationSidebar - Conversation History
 *
 * ChatGPT-style sidebar for browsing past conversations.
 */

import { useState, useEffect } from 'react'
import { MessageCircle, Clock, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { useCoachV3Store } from '@/lib/stores/coach-v3-store'
import type { ConversationSummary } from '@/types/coach-v3'

interface ConversationSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function ConversationSidebar({ isOpen, onClose }: ConversationSidebarProps) {
  const { conversationId, setConversationId } = useCoachV3Store()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadConversations()
    }
  }, [isOpen])

  const loadConversations = async () => {
    try {
      setIsLoading(true)

      // Get auth token
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        return
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

      const response = await fetch(
        `${API_BASE_URL}/api/v1/coach/conversations?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('[ConversationSidebar] Failed to load conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectConversation = async (convId: string) => {
    try {
      // Get auth token
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        return
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

      // Fetch conversation messages
      const response = await fetch(
        `${API_BASE_URL}/api/v1/coach/conversations/${convId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      // Update store with conversation messages
      setConversationId(convId)
      useCoachV3Store.getState().setMessages(
        data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          foodDetected: msg.food_detected,
          suggestedActions: msg.suggested_actions
        }))
      )

      onClose()
    } catch (error) {
      console.error('[ConversationSidebar] Failed to load conversation:', error)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-zinc-900 border-r border-zinc-800 z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:relative lg:z-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Conversations</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-iron-white" />
          </button>
        </div>

        {/* Conversations List */}
        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-zinc-800 animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-iron-gray">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Start chatting to see your history here</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    conversationId === conv.id
                      ? 'bg-iron-orange/20 border border-iron-orange/50'
                      : 'hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MessageCircle
                      className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        conversationId === conv.id ? 'text-iron-orange' : 'text-iron-gray'
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-medium truncate ${
                          conversationId === conv.id ? 'text-white' : 'text-iron-white'
                        }`}
                      >
                        {conv.title || 'Untitled conversation'}
                      </h3>

                      {conv.last_message_preview && (
                        <p className="text-sm text-iron-gray truncate mt-1">
                          {conv.last_message_preview}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-2 text-xs text-iron-gray">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(conv.last_message_at), {
                            addSuffix: true
                          })}
                        </span>
                        <span>•</span>
                        <span>{conv.message_count} messages</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
