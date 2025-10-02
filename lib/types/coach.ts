/**
 * TypeScript interfaces for Coach Chat feature
 * Following TDD: These are the interface definitions
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  coach_type: 'trainer' | 'nutritionist';
  message: string;
  conversation_id?: string;
}

export interface ContextInfo {
  recent_workouts: number;
  recent_meals: number;
  embeddings_retrieved: number;
  profile_used: boolean;
}

export interface ChatResponse {
  success: boolean;
  conversation_id: string;
  message: string;
  context_used?: ContextInfo;
  error?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  coach_persona_id: string;
  messages: ChatMessage[];
  last_message_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CoachPersona {
  id: string;
  name: 'trainer' | 'nutritionist';
  display_name: string;
  system_prompt: string;
  specialty: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  id: string;
  full_name?: string;
  primary_goal?: string;
  age?: number;
  weight_lbs?: number;
  height_inches?: number;
  experience_level?: string;
}

export interface TrainerChatClientProps {
  userId: string;
  profile?: UserProfile;
  previousConversation?: {
    id: string;
    messages: ChatMessage[];
  };
}

// UI State types
export interface ChatUIState {
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
  conversationId: string | null;
  error: string | null;
}

// API Client types
export interface CoachAPIClient {
  sendMessage: (request: ChatRequest) => Promise<ChatResponse>;
  getConversation: (userId: string, coachType: 'trainer' | 'nutritionist') => Promise<Conversation | null>;
  clearConversation: (conversationId: string) => Promise<void>;
}
