'use client'

/**
 * CoachV3Client - Main Coach V3 Interface
 *
 * Pure text-based AI coaching interface built from scratch.
 * Features:
 * - Streaming chat with real-time responses
 * - Inline meal detection & logging
 * - Message reactions
 * - Conversation history
 * - Auto-scroll
 * - Glass morphism design
 */

import { useEffect, useRef } from 'react'
import { MessageCircle, Plus, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCoachV3 } from '@/lib/hooks/useCoachV3'
import { useCoachV3Store } from '@/lib/stores/coach-v3-store'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ConversationSidebar } from './ConversationSidebar'
import { useToast } from '@/hooks/use-toast'
import BottomNavigationMVP from '@/app/components/BottomNavigationMVP'

export function CoachV3Client() {
  const { messages, sendMessage, logMeal, startNewConversation } = useCoachV3()
  const { isLoading, isSidebarOpen, setIsSidebarOpen } = useCoachV3Store()
  const { toast } = useToast()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Welcome message on empty conversation
  const showWelcome = messages.length === 0

  const handleSendMessage = async (text: string) => {
    try {
      await sendMessage(text)
    } catch (error) {
      toast({
        title: 'Failed to send message',
        description: 'Please check your connection and try again.',
        variant: 'destructive'
      })
    }
  }

  const handleLogMeal = async (messageId: string, foods: any[], mealType: string) => {
    try {
      await logMeal(messageId, foods, mealType)
      toast({
        title: 'Meal logged!',
        description: 'Your meal has been added to your nutrition history.',
        variant: 'default'
      })
    } catch (error) {
      toast({
        title: 'Failed to log meal',
        description: 'Please try again.',
        variant: 'destructive'
      })
      throw error
    }
  }

  const handleNewConversation = () => {
    if (messages.length > 0) {
      const confirmed = window.confirm(
        'Start a new conversation? Your current chat will be saved.'
      )
      if (!confirmed) return
    }
    startNewConversation()
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-neutral-950 via-zinc-950 to-neutral-950 pb-16">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5 text-iron-white" />
          </button>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-iron-orange/20 rounded-lg">
              <MessageCircle className="h-5 w-5 text-iron-orange" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Coach V3</h1>
              <p className="text-xs text-iron-gray">AI Fitness & Nutrition Coach</p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleNewConversation}
          variant="outline"
          size="sm"
          className="gap-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Chat</span>
        </Button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation Sidebar */}
        <ConversationSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Container */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
          >
            {showWelcome && (
              <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
                <div className="inline-flex p-4 bg-iron-orange/10 rounded-2xl">
                  <MessageCircle className="h-12 w-12 text-iron-orange" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white">
                    Welcome to Coach V3
                  </h2>
                  <p className="text-iron-gray text-lg">
                    Your AI-powered fitness and nutrition coach. Text-based, ultra-fast, built from scratch.
                  </p>
                </div>

              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onLogMeal={handleLogMeal}
              />
            ))}

            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm px-4 py-4">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                onSend={handleSendMessage}
                isLoading={isLoading}
                placeholder="Ask your coach anything, or log a meal..."
              />
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigationMVP />
    </div>
  )
}
