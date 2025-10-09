"use client"

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import type {
  SpecialistType,
  ConsultationSession,
  ConsultationMessage as ConsultationMessageType,
  ConsultationSummary
} from '@/types/consultation';
import {
  sendConsultationMessage,
  getConsultationSummary,
  completeConsultation
} from '@/lib/api/consultation';
import { SPECIALISTS } from '@/types/consultation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConsultationChatProps {
  session: ConsultationSession;
  specialistType: SpecialistType;
  onComplete?: (summary: ConsultationSummary, programId?: string) => void;
}

export function ConsultationChat({
  session: initialSession,
  specialistType,
  onComplete
}: ConsultationChatProps) {
  const [session, setSession] = useState(initialSession);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: initialSession.initial_question || 'Hello! How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [extractedData, setExtractedData] = useState<Record<string, any>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const specialist = SPECIALISTS[specialistType];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendConsultationMessage(session.session_id, {
        message: input
      });

      // Update session state
      setSession(prev => ({
        ...prev,
        conversation_stage: response.conversation_stage,
        progress_percentage: response.progress_percentage
      }));

      // Merge extracted data
      if (response.extracted_data) {
        setExtractedData(prev => ({
          ...prev,
          ...response.extracted_data
        }));
      }

      // Add AI response
      if (response.next_question) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.next_question,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

      // Handle completion
      if (response.is_complete && response.wrap_up_message) {
        const wrapUpMessage: Message = {
          role: 'assistant',
          content: response.wrap_up_message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, wrapUpMessage]);

        toast({
          title: 'Consultation Complete!',
          description: 'Ready to generate your personalized program.',
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);

    try {
      const result = await completeConsultation(session.session_id, {
        generate_program: true
      });

      toast({
        title: 'Success!',
        description: 'Your personalized program has been generated.',
      });

      if (onComplete) {
        onComplete(result.summary, result.program_id);
      } else {
        // Default: redirect to dashboard
        router.push('/dashboard');
      }

    } catch (error) {
      console.error('Error completing consultation:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete consultation. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isComplete = session.progress_percentage >= 100;

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-white">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{specialist.icon}</span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{specialist.name}</h2>
            <p className="text-sm text-gray-600">{specialist.description}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{session.progress_percentage}%</span>
          </div>
          <Progress value={session.progress_percentage} className="h-2" />
          <p className="text-xs text-gray-500 capitalize">
            Stage: {session.conversation_stage.replace(/_/g, ' ')}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Extracted Data Preview (if any) */}
      {Object.keys(extractedData).length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 bg-blue-50 border-t border-blue-100">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-900">
                Data collected: {Object.keys(extractedData).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t bg-white">
        {!isComplete ? (
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Share your thoughts..."
              disabled={isLoading}
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
              rows={2}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              size="lg"
              className="px-6"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">Consultation Complete!</p>
            </div>
            <Button
              onClick={handleComplete}
              disabled={isCompleting}
              size="lg"
              className="w-full"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Your Program...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate My Personalized Program
                </>
              )}
            </Button>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
