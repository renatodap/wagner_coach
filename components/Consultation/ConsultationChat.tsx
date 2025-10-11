"use client"

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Clock,
  MessageSquare,
  Target,
  CheckCircle,
  ChevronDown,
  ChevronUp
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
  completeConsultation,
  getConsultationMessages
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [extractedData, setExtractedData] = useState<Record<string, any>>({});
  const [goalsMet, setGoalsMet] = useState<number>(0);
  const [goalsTotal, setGoalsTotal] = useState<number>(10);
  const [goalsDetail, setGoalsDetail] = useState<Record<string, string>>({});
  const [loggedItems, setLoggedItems] = useState<Array<{ type: string; content: string }>>([]);
  const [minutesElapsed, setMinutesElapsed] = useState<number>(0);
  const [messagesSent, setMessagesSent] = useState<number>(0);
  const [approachingLimit, setApproachingLimit] = useState<boolean>(false);
  const [showGoalsDetail, setShowGoalsDetail] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevLoggedCountRef = useRef<number>(0);
  const { toast } = useToast();
  const router = useRouter();

  const specialist = SPECIALISTS[specialistType];

  // Helper function to format goal names
  const formatGoalName = (goalId: string): string => {
    return goalId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation history on mount
  useEffect(() => {
    async function loadConversationHistory() {
      // Guard: Don't try to load if session_id is not available
      if (!session.session_id) {
        console.warn('Session ID not available, showing initial question');
        setMessages([
          {
            role: 'assistant',
            content: initialSession.initial_question || 'Hello! How can I help you today?',
            timestamp: new Date()
          }
        ]);
        setIsLoadingMessages(false);
        return;
      }

      try {
        setIsLoadingMessages(true);
        const response = await getConsultationMessages(session.session_id);

        if (response.messages && response.messages.length > 0) {
          // Convert backend messages to frontend Message format
          const loadedMessages: Message[] = response.messages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: msg.created_at ? new Date(msg.created_at) : new Date()
          }));

          setMessages(loadedMessages);
        } else {
          // No messages yet - show initial question
          setMessages([
            {
              role: 'assistant',
              content: initialSession.initial_question || 'Hello! How can I help you today?',
              timestamp: new Date()
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load conversation history:', error);
        // Fall back to showing initial question
        setMessages([
          {
            role: 'assistant',
            content: initialSession.initial_question || 'Hello! How can I help you today?',
            timestamp: new Date()
          }
        ]);

        toast({
          title: 'Could not load conversation history',
          description: 'Starting fresh conversation',
          variant: 'default'
        });
      } finally {
        setIsLoadingMessages(false);
      }
    }

    loadConversationHistory();
  }, [session.session_id, initialSession.initial_question, toast]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Guard: Don't try to send if session_id is not available
    if (!session.session_id) {
      toast({
        title: 'Session not ready',
        description: 'Please wait for the consultation to initialize.',
        variant: 'destructive'
      });
      return;
    }

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

      // Update goal-driven consultation state
      if (response.goals_met !== undefined) setGoalsMet(response.goals_met);
      if (response.goals_total !== undefined) setGoalsTotal(response.goals_total);
      if (response.goals_detail) setGoalsDetail(response.goals_detail);
      if (response.minutes_elapsed !== undefined) setMinutesElapsed(response.minutes_elapsed);
      if (response.messages_sent !== undefined) setMessagesSent(response.messages_sent);
      if (response.approaching_limit !== undefined) setApproachingLimit(response.approaching_limit);

      // Handle auto-logged items (show toast notification for new items)
      if (response.logged_items) {
        const newLoggedCount = response.logged_items.length;
        const prevCount = prevLoggedCountRef.current;

        if (newLoggedCount > prevCount) {
          // New items were logged
          const newItems = response.logged_items.slice(prevCount);
          newItems.forEach(item => {
            toast({
              title: '✅ Auto-Logged!',
              description: `${item.type}: ${item.content}`,
              variant: 'default',
              duration: 4000
            });
          });
        }

        setLoggedItems(response.logged_items);
        prevLoggedCountRef.current = newLoggedCount;
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
      <div className="flex-shrink-0 p-4 border-b border-iron-gray/20 bg-iron-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{specialist.icon}</span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">{specialist.name}</h2>
            <p className="text-sm text-iron-gray">{specialist.description}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-iron-gray">Progress</span>
            <span className="font-medium text-white">{session.progress_percentage}%</span>
          </div>
          <div className="h-2 bg-iron-gray/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-iron-orange transition-all duration-300"
              style={{ width: `${session.progress_percentage}%` }}
            />
          </div>
          <p className="text-xs text-iron-gray capitalize">
            Stage: {session.conversation_stage.replace(/_/g, ' ')}
          </p>
        </div>

        {/* Time & Message Counters */}
        {(minutesElapsed > 0 || messagesSent > 0) && (
          <div className="flex items-center gap-4 mt-3 text-xs text-iron-gray">
            {minutesElapsed > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{minutesElapsed} min</span>
              </div>
            )}
            {messagesSent > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{messagesSent}/50 messages</span>
              </div>
            )}
            {approachingLimit && (
              <span className="text-yellow-400 font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Nearing limit
              </span>
            )}
          </div>
        )}

        {/* Goal Progress Indicator */}
        {goalsTotal > 0 && (
          <div className="mt-3 p-3 bg-iron-black/30 rounded-lg border border-iron-gray/20">
            <button
              onClick={() => setShowGoalsDetail(!showGoalsDetail)}
              className="w-full flex items-center justify-between text-left"
              aria-expanded={showGoalsDetail}
            >
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-iron-orange" />
                <span className="text-sm text-white font-medium">Goals Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-iron-orange">
                  {goalsMet}/{goalsTotal}
                </span>
                {showGoalsDetail ? (
                  <ChevronUp className="h-4 w-4 text-iron-gray" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-iron-gray" />
                )}
              </div>
            </button>

            {/* Goals Detail Dropdown */}
            {showGoalsDetail && Object.keys(goalsDetail).length > 0 && (
              <div className="mt-3 space-y-2 border-t border-iron-gray/20 pt-3">
                {Object.entries(goalsDetail).map(([goalId, status]) => {
                  const isCompleted = status.includes('✅');
                  return (
                    <div
                      key={goalId}
                      className="flex items-start gap-2 text-xs"
                    >
                      <span className="text-base">
                        {isCompleted ? '✅' : '⏳'}
                      </span>
                      <div className="flex-1">
                        <p className={`${isCompleted ? 'text-green-400' : 'text-iron-gray'}`}>
                          {formatGoalName(goalId)}
                        </p>
                        {status.includes(':') && (
                          <p className="text-iron-gray/70 mt-0.5">
                            {status.split(':')[1]?.trim()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-iron-black to-neutral-900">
        {/* Initial Loading State */}
        {isLoadingMessages && (
          <div className="flex justify-center items-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-iron-orange animate-spin" />
              <p className="text-sm text-iron-gray">Loading conversation...</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {!isLoadingMessages && messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-iron-orange text-white'
                  : 'bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-white/70' : 'text-iron-gray'
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
            <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 px-4 py-3">
              <div className="flex items-center gap-2 text-iron-gray">
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
        <div className="flex-shrink-0 px-4 py-2 bg-iron-black/50 backdrop-blur-sm border-t border-iron-orange/30">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-iron-orange mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-white">
                Data collected: {Object.keys(extractedData).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Logged Items Display */}
      {loggedItems.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 bg-green-900/20 backdrop-blur-sm border-t border-green-500/30">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-white mb-1">
                📝 Auto-Logged ({loggedItems.length})
              </p>
              <div className="space-y-1">
                {loggedItems.map((item, index) => (
                  <p key={index} className="text-xs text-green-300">
                    <span className="capitalize font-medium">{item.type}:</span> {item.content}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-iron-gray/20 bg-iron-black/50 backdrop-blur-sm">
        {!isComplete ? (
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Share your thoughts..."
              disabled={isLoading}
              className="flex-1 min-h-[60px] max-h-[120px] resize-none bg-iron-black/50 border-iron-gray/30 text-white placeholder:text-iron-gray"
              rows={2}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              size="lg"
              className="px-6 bg-iron-orange hover:bg-iron-orange/90 text-white"
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
            <div className="flex items-center gap-2 text-iron-orange">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium text-white">Consultation Complete!</p>
            </div>
            <Button
              onClick={handleComplete}
              disabled={isCompleting}
              size="lg"
              className="w-full bg-iron-orange hover:bg-iron-orange/90 text-white"
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

        <p className="text-xs text-iron-gray mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
