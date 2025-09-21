import { CoachMessage } from '@/lib/types/coaching';

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
            ? 'bg-iron-orange text-iron-black'
            : 'bg-iron-gray/20 border border-iron-gray text-iron-white'
        } px-4 py-3`}
      >
        {/* Message content with markdown support */}
        <div className="whitespace-pre-wrap break-words">
          {message.content}
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