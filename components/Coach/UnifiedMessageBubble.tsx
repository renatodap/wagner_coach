/**
 * Unified Message Bubble Component
 *
 * Enhanced message bubble for unified Coach interface.
 * Supports:
 * - User messages (right-aligned, orange)
 * - AI messages (left-aligned, markdown support)
 * - System messages (centered, green/info)
 *
 * Follows 2026 AI SaaS principles: calm, clear, scannable.
 */

'use client'

import { CheckCircle2, Info, AlertCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { UnifiedMessage } from '@/lib/api/unified-coach'

interface UnifiedMessageBubbleProps {
  message: UnifiedMessage
  className?: string
}

// Format timestamp
function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

// Filter out system context from message content
// System context is wrapped in [SYSTEM_CONTEXT]...[/SYSTEM_CONTEXT] tags
// This allows us to send analysis to backend but hide it from user UI
function filterSystemContext(content: string): string {
  return content.replace(/\[SYSTEM_CONTEXT\][\s\S]*?\[\/SYSTEM_CONTEXT\]/g, '').trim()
}

export function UnifiedMessageBubble({ message, className = '' }: UnifiedMessageBubbleProps) {
  const { role, content, created_at, message_type } = message

  // System message (centered, with icon)
  if (role === 'system') {
    return (
      <div
        className={`flex justify-center ${className}`}
        data-testid="system-message"
      >
        <div className="
          max-w-md px-4 py-2.5
          bg-green-50 border border-green-200
          rounded-full
          flex items-center gap-2
          animate-in slide-in-from-bottom-1 duration-300
        ">
          {message_type === 'log_confirmed' ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
          )}
          <p className="text-sm font-medium text-gray-900">
            {content}
          </p>
        </div>
      </div>
    )
  }

  // User message (right-aligned, orange)
  if (role === 'user') {
    // Filter out system context (image analysis) from display
    const displayContent = filterSystemContext(content)

    // If content is empty after filtering, show a placeholder
    const finalContent = displayContent || '📷 [Uploaded image]'

    return (
      <div
        className={`flex justify-end ${className}`}
        data-testid="user-message"
      >
        <div className="
          max-w-[80%]
          bg-iron-orange text-iron-black
          rounded-2xl rounded-br-md
          px-4 py-3
          shadow-sm
          animate-in slide-in-from-right-2 duration-200
        ">
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {finalContent}
          </div>
          <div className="text-xs mt-1.5 opacity-70">
            {formatTime(created_at)}
          </div>
        </div>
      </div>
    )
  }

  // AI Assistant message (left-aligned, markdown support)
  return (
    <div
      className={`flex justify-start ${className}`}
      data-testid="ai-message"
    >
      <div className="
        max-w-[85%]
        bg-gray-50 border border-gray-200
        rounded-2xl rounded-bl-md
        px-4 py-3
        shadow-sm
        animate-in slide-in-from-left-2 duration-200
      ">
        {/* AI Icon (subtle) */}
        <div className="flex items-start gap-3">
          <div className="
            w-6 h-6 rounded-full
            bg-gradient-to-br from-blue-500 to-purple-600
            flex items-center justify-center
            flex-shrink-0
            mt-0.5
          ">
            <span className="text-white text-xs font-bold">AI</span>
          </div>

          {/* Content with markdown */}
          <div className="flex-1 min-w-0">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Headings
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold text-gray-900 mt-3 mb-2">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold text-gray-900 mt-3 mb-2">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold text-gray-800 mt-2 mb-1">{children}</h3>
                  ),
                  // Paragraphs
                  p: ({ children }) => (
                    <p className="text-gray-700 mb-2 leading-relaxed">{children}</p>
                  ),
                  // Lists
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-2 space-y-1 text-gray-700">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-700">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="ml-2">{children}</li>
                  ),
                  // Code
                  code: ({ inline, children }: any) =>
                    inline ? (
                      <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono text-blue-700">
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm font-mono">
                        {children}
                      </code>
                    ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-900 p-3 rounded-lg overflow-x-auto mb-2">
                      {children}
                    </pre>
                  ),
                  // Blockquote
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-2">
                      {children}
                    </blockquote>
                  ),
                  // Table
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-2">
                      <table className="min-w-full border border-gray-300">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-gray-900">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-gray-300 px-3 py-2 text-gray-700">{children}</td>
                  ),
                  // Links
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {children}
                    </a>
                  ),
                  // Emphasis
                  strong: ({ children }) => (
                    <strong className="font-bold text-gray-900">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-gray-600">{children}</em>
                  ),
                  hr: () => <hr className="border-gray-300 my-3" />,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>

            {/* Timestamp */}
            <div className="text-xs text-gray-500 mt-2">
              {formatTime(created_at)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
