/**
 * Coach V3 Types - Text-Only Pure Chat
 *
 * Built from scratch with verified database schema alignment.
 * NO image/voice functionality - pure text-based coaching.
 */

// ============================================================
// NUTRITION TYPES (Verified against database schema)
// ============================================================

/**
 * Food item from foods table
 *
 * Schema alignment verified:
 * - serving_size: Base amount for nutrition (e.g., 100g)
 * - serving_unit: Unit for serving_size (e.g., 'g')
 * - household_serving_unit: User-friendly name (e.g., 'breast', 'slice')
 * - household_serving_grams: Grams per household serving (e.g., 140g)
 */
export interface FoodItem {
  id: string
  name: string
  brand_name?: string
  serving_size: number  // Base grams for nutrition calculations
  serving_unit: string  // Usually 'g'
  household_serving_unit?: string  // 'slice', 'breast', 'medium', etc.
  household_serving_grams?: number  // Grams per household serving

  // Nutrition per serving_size
  calories: number
  protein_g: number
  total_carbs_g: number
  total_fat_g: number
  dietary_fiber_g?: number
  total_sugars_g?: number
  sodium_mg?: number
}

/**
 * Food quantity - stores BOTH representations simultaneously
 *
 * CRITICAL: Both servingQuantity and gramQuantity are ALWAYS stored.
 * Nutrition is ALWAYS calculated from gramQuantity.
 *
 * Schema alignment verified with meal_foods table.
 */
export interface FoodQuantity {
  servingQuantity: number  // Number of servings (e.g., 2.5)
  servingUnit: string | null  // 'slice', 'breast', or 'serving'
  gramQuantity: number  // ALWAYS in grams - source of truth
  lastEditedField: 'serving' | 'grams'  // Tracks which field user edited
}

/**
 * Calculated nutrition values
 *
 * Formula: multiplier = gramQuantity / serving_size
 *          each_macro = food_macro * multiplier
 */
export interface NutritionValues {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g?: number
  sugar_g?: number
  sodium_mg?: number
}

/**
 * Detected food from AI text parsing
 *
 * Contains both quantity info and calculated nutrition
 */
export interface DetectedFood {
  food: FoodItem
  quantity: FoodQuantity
  nutrition: NutritionValues
}

/**
 * Meal detection result from AI
 */
export interface FoodDetectedV3 {
  is_food: boolean
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null
  description: string
  confidence: number
  detected_foods: DetectedFood[]
  total_nutrition: NutritionValues
}

// ============================================================
// CHAT MESSAGE TYPES
// ============================================================

export type MessageRole = 'user' | 'assistant' | 'system'

/**
 * Chat message in conversation
 */
export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  isStreaming?: boolean

  // Optional: Food detection data (appears inline below assistant message)
  foodDetected?: FoodDetectedV3
  foodLogged?: boolean  // True if user logged the meal

  // Optional: Suggested actions (buttons below message)
  suggestedActions?: SuggestedAction[]
}

/**
 * Suggested action button
 */
export interface SuggestedAction {
  id: string
  label: string
  icon: string
  action: 'log_meal' | 'log_workout' | 'view_progress' | 'set_goal'
  params?: Record<string, any>
}

// ============================================================
// CONVERSATION TYPES
// ============================================================

/**
 * Conversation summary for sidebar
 */
export interface ConversationSummary {
  id: string
  title?: string
  message_count: number
  last_message_at: string
  last_message_preview?: string
  created_at: string
}

/**
 * Full conversation with messages
 */
export interface Conversation {
  id: string
  title?: string
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}

// ============================================================
// API REQUEST/RESPONSE TYPES
// ============================================================

/**
 * Send message request
 */
export interface SendMessageRequest {
  message: string
  conversation_id?: string | null
}

/**
 * Streaming response chunk from SSE
 */
export interface StreamingChunk {
  type: 'message' | 'food_detected' | 'suggested_actions' | 'conversation_id' | 'done'
  data?: any
}

/**
 * Complete message response
 */
export interface SendMessageResponse {
  conversation_id: string
  message_id: string
  message?: string
  food_detected?: FoodDetectedV3
  suggested_actions?: SuggestedAction[]
}

/**
 * Confirm meal log request
 */
export interface ConfirmMealLogRequest {
  conversation_id: string
  user_message_id: string
  detected_foods: DetectedFood[]
  meal_type: string
  logged_at: string
  notes?: string
}

/**
 * Confirm meal log response
 */
export interface ConfirmMealLogResponse {
  success: boolean
  meal_id: string
  message: string
}

// ============================================================
// UI STATE TYPES
// ============================================================

/**
 * Coach V3 global state
 */
export interface CoachV3State {
  // Current conversation
  conversationId: string | null
  messages: ChatMessage[]

  // UI state
  isLoading: boolean
  isSidebarOpen: boolean

  // Input state
  inputText: string

  // Actions
  setConversationId: (id: string | null) => void
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void
  setIsLoading: (loading: boolean) => void
  setIsSidebarOpen: (open: boolean) => void
  setInputText: (text: string) => void
  clearConversation: () => void
}

/**
 * Macro goal targets (from user's nutrition_goals)
 */
export interface MacroGoals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

/**
 * Daily macro progress
 */
export interface DailyMacroProgress {
  current: NutritionValues
  goals: MacroGoals
  percentage: {
    calories: number
    protein: number
    carbs: number
    fats: number
  }
}

// ============================================================
// FORM/EDIT TYPES
// ============================================================

/**
 * Inline meal edit form data
 */
export interface MealEditFormData {
  detected_foods: DetectedFood[]
  meal_type: string
  notes: string
}

/**
 * Quantity edit event
 */
export interface QuantityEditEvent {
  foodIndex: number
  inputValue: number
  inputField: 'serving' | 'grams'
}
