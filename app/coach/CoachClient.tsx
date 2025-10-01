/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Send,
  Loader2,
  ChevronLeft,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import BottomNavigation from '@/app/components/BottomNavigation';
import MessageBubble from '@/components/Coach/MessageBubble';
import QuickActions from '@/components/Coach/QuickActions';
import { CoachMessage } from '@/lib/types/coaching';

interface CoachClientProps {
  userId: string;
  profile?: {
    id: string;
    goal?: string;
    full_name?: string;
    primary_goal?: string;
    primaryGoal?: string;
    about_me?: string;
    aboutMe?: string;
  };
  previousConversation?: {
    id: string;
    messages: CoachMessage[];
  };
}

export default function CoachClient({
  userId,
  profile,
  previousConversation
}: CoachClientProps) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  // Load previous conversation on mount
  useEffect(() => {
    if (previousConversation?.messages) {
      setMessages(previousConversation.messages);
      setConversationId(previousConversation.id);
    } else {
      // Show welcome message for new users
      const welcomeMessage: CoachMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Welcome to your AI fitness & nutrition coach! 👋

I'm here to help you achieve your fitness and health goals. I can:
- Analyze your workout performance and training patterns
- Provide personalized training recommendations
- Guide you on nutrition, meal planning, and macro tracking
- Help you track progress towards your goals
- Answer questions about exercises, form, and nutrition
- Offer motivation and accountability
- Show you how training and nutrition work together for optimal results

What would you like to work on today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [previousConversation]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: CoachMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId,
          userId
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("You've reached the message limit. Please try again later.");
        }
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      const assistantMessage: CoachMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Read streaming response
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantMessage.content += parsed.content;
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: assistantMessage.content }
                      : msg
                  )
                );
              }
              if (parsed.conversationId) {
                setConversationId(parsed.conversationId);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Save conversation to database
      await saveConversation([...messages, userMessage, assistantMessage]);

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Sorry, something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveConversation = async (allMessages: CoachMessage[]) => {
    try {
      if (conversationId) {
        // Update existing conversation
        await (supabase
          .from('ai_conversations') as any)
          .update({
            messages: allMessages,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);
      } else {
        // Create new conversation
        const { data } = await (supabase
          .from('ai_conversations') as any)
          .insert({
            user_id: userId,
            messages: allMessages
          })
          .select('id')
          .single();

        if (data) {
          setConversationId(data.id);
        }
      }
    } catch (err) {
      console.error('Error saving conversation:', err);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    // Auto-send the message
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  const handleClearChat = async () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000); // Auto-hide after 3 seconds
      return;
    }

    // Clear the current conversation
    setMessages([]);
    setConversationId(null);
    setShowClearConfirm(false);
    setError(null);

    // Show welcome message again
    const welcomeMessage: CoachMessage = {
      id: 'welcome-new',
      role: 'assistant',
      content: `Welcome back! I've cleared our previous conversation.

Ready to discuss your training, nutrition, or anything else related to your fitness journey. What would you like to work on today?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-iron-black text-iron-white flex flex-col">
      {/* Header */}
      <header className="border-b border-iron-gray sticky top-0 bg-iron-black z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/workouts"
                className="text-iron-gray hover:text-iron-orange transition-colors lg:hidden"
              >
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <h1 className="font-heading text-2xl text-iron-orange">FITNESS & NUTRITION COACH</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearChat}
                className={`p-2 rounded transition-colors ${
                  showClearConfirm
                    ? 'text-red-500 hover:bg-red-500/10'
                    : 'text-iron-gray hover:text-iron-orange'
                }`}
                title={showClearConfirm ? 'Click again to clear chat' : 'Clear chat'}
              >
                <Trash2 className="w-5 h-5" />
              </button>
              {(profile?.primary_goal || profile?.primaryGoal) && (
                <span className="text-iron-gray text-sm hidden sm:block">
                  Goal: {profile.primary_goal || profile.primaryGoal}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div
        data-testid="chat-container"
        className="flex-1 overflow-y-auto pb-32"
      >
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Quick Actions (only show when no messages except welcome) */}
          {messages.length <= 1 && (
            <QuickActions onAction={handleQuickAction} />
          )}

          {/* Messages */}
          <div
            data-testid="messages-container"
            className="space-y-4"
          >
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isUser={message.role === 'user'}
              />
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div
                data-testid="typing-indicator"
                className="flex items-center gap-2 text-iron-gray"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Coach is thinking...</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500 p-4 text-red-500">
                {error}
                <button
                  onClick={() => setError(null)}
                  className="ml-4 text-sm underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Container */}
      <div
        data-testid="input-container"
        className="fixed bottom-16 left-0 right-0 bg-iron-black border-t border-iron-gray"
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your coach anything..."
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-iron-gray/10 border border-iron-gray px-4 py-3 text-iron-white placeholder-iron-gray focus:border-iron-orange focus:outline-none resize-none"
              style={{
                minHeight: '48px',
                maxHeight: '120px'
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-iron-orange text-iron-black font-heading hover:bg-iron-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}