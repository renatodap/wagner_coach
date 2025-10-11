/**
 * Coach V3 Store - Zustand State Management
 *
 * Global state for Coach V3 text-only chat interface.
 * Built from scratch with modern React patterns.
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ChatMessage, CoachV3State } from '@/types/coach-v3'

/**
 * Coach V3 store
 *
 * Manages:
 * - Current conversation & messages
 * - UI state (sidebar, loading)
 * - Input state
 */
export const useCoachV3Store = create<CoachV3State>()(
  devtools(
    (set, get) => ({
      // Initial state
      conversationId: null,
      messages: [],
      isLoading: false,
      isSidebarOpen: false,
      inputText: '',

      // Actions
      setConversationId: (id) => set({ conversationId: id }),

      setMessages: (messages) => set({ messages }),

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message]
        })),

      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          )
        })),

      setIsLoading: (isLoading) => set({ isLoading }),

      setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),

      setInputText: (inputText) => set({ inputText }),

      clearConversation: () =>
        set({
          conversationId: null,
          messages: [],
          inputText: ''
        })
    }),
    {
      name: 'coach-v3-store'
    }
  )
)

/**
 * Selectors for optimized re-renders
 */

export const selectMessages = (state: CoachV3State) => state.messages
export const selectConversationId = (state: CoachV3State) => state.conversationId
export const selectIsLoading = (state: CoachV3State) => state.isLoading
export const selectIsSidebarOpen = (state: CoachV3State) => state.isSidebarOpen
export const selectInputText = (state: CoachV3State) => state.inputText
