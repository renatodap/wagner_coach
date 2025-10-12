'use client';

import { CoachMessage } from '@/lib/types/coaching';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  message: CoachMessage;
  isUser: boolean;
}

export default function MessageBubble({ message, isUser }: MessageBubbleProps) {
  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div
      data-testid={isUser ? 'user-message' : 'ai-message'}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] ${
          isUser
            ? 'bg-iron-orange text-iron-black rounded-lg'
            : 'bg-iron-gray/20 border border-iron-gray text-iron-white rounded-lg'
        } px-4 py-3`}
      >
        {/* Message content with markdown support */}
        <div className="message-content">
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          ) : (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom component overrides for better styling
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-iron-orange mt-4 mb-2">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-bold text-iron-orange mt-3 mb-2">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold text-iron-white mt-2 mb-1">{children}</h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-base font-semibold text-iron-white mt-2 mb-1">{children}</h4>
                  ),
                  p: ({ children }) => (
                    <p className="text-iron-white mb-2 leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-iron-white ml-2">{children}</li>
                  ),
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="bg-iron-black/50 px-1 py-0.5 rounded text-iron-orange text-sm">
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-iron-black/50 p-3 rounded-lg overflow-x-auto text-sm">
                        {children}
                      </code>
                    ),
                  pre: ({ children }) => (
                    <pre className="bg-iron-black/50 p-3 rounded-lg overflow-x-auto mb-2">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-iron-orange pl-4 italic text-iron-gray my-2">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-2">
                      <table className="min-w-full border border-iron-gray">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-iron-gray px-3 py-2 bg-iron-black/50 font-semibold text-iron-orange">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-iron-gray px-3 py-2">{children}</td>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-iron-orange hover:text-orange-400 underline"
                    >
                      {children}
                    </a>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-iron-orange">{children}</strong>
                  ),
                  em: ({ children }) => <em className="italic text-iron-gray">{children}</em>,
                  hr: () => <hr className="border-iron-gray my-3" />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div
          className={`text-xs mt-2 ${
            isUser ? 'text-iron-black/70' : 'text-iron-gray'
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
