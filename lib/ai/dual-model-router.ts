/**
 * DUAL-API MODEL ROUTER - Groq + OpenRouter
 *
 * STRATEGY:
 * - Groq: BLAZING FAST real-time tasks (coaching, streaming, quick responses)
 * - OpenRouter: Complex reasoning, vision, fallback, multimodal
 *
 * FALLBACK CHAIN: Groq → OpenRouter → Specific Provider
 *
 * 100% FREE models with automatic failover
 */

import { OpenAI } from 'openai';

export type TaskType =
  | 'real-time-chat'        // GROQ: Sub-second coaching responses
  | 'quick-categorization'  // GROQ: Instant classification
  | 'complex-reasoning'     // OPENROUTER: DeepSeek R1, planning
  | 'long-context'          // OPENROUTER: Gemini 2.5 Pro, 1M tokens
  | 'structured-output'     // GROQ (fast) or OPENROUTER (accurate)
  | 'vision'                // OPENROUTER: Llama-4 Scout, Yi-Vision
  | 'program-generation'    // OPENROUTER: Complex multi-step
  | 'streaming-feedback'    // GROQ: Live workout feedback
  | 'verification';         // OPENROUTER: Quality checks

export interface TaskConfig {
  type: TaskType;
  contextTokens?: number;
  requiresJSON?: boolean;
  requiresVision?: boolean;
  prioritizeSpeed?: boolean;  // If true, prefer Groq
  prioritizeAccuracy?: boolean; // If true, prefer OpenRouter
  criticalAccuracy?: boolean;
}

interface ModelSelection {
  provider: 'groq' | 'openrouter';
  model: string;
  fallbackProvider: 'groq' | 'openrouter';
  fallbackModel: string;
  maxTokens: number;
  temperature: number;
}

/**
 * GROQ MODELS - ULTRA FAST (LPU-based)
 * All FREE with blazing speed
 */
const GROQ_MODELS = {
  'llama-3.3-70b': 'llama-3.3-70b-versatile',  // Fast, versatile
  'llama-3.1-8b': 'llama-3.1-8b-instant',      // INSTANT responses
  'mixtral-8x7b': 'mixtral-8x7b-32768',        // Good reasoning
  'deepseek-r1': 'deepseek-r1-distill-llama-70b', // Fast reasoning
};

/**
 * OPENROUTER MODELS - BEST FREE MODELS
 * Access to everything including Groq-hosted
 */
const OPENROUTER_MODELS = {
  'llama-4-scout': 'meta-llama/llama-4-scout:free',  // Vision + 512k context
  'deepseek-r1': 'deepseek/deepseek-r1:free',        // SOTA reasoning
  'deepseek-v3': 'deepseek/deepseek-v3:free',        // Code, QA, long-form
  'qwen-coder': 'qwen/qwen-2.5-coder-32b-instruct:free', // Structured output
  'yi-vision': 'zero-one-ai/yi-vision:free',         // Vision analysis
  'gemini-flash': 'google/gemini-2.0-flash-exp:free', // Fast + 1M context
  'gemini-pro': 'google/gemini-2.5-pro-exp:free',    // 1M context, complex
  'groq-llama-70b': 'groq/llama-3.3-70b-versatile',  // Groq via OpenRouter
};

/**
 * TASK ROUTING CONFIGURATION
 * Intelligently routes to Groq (speed) or OpenRouter (accuracy/features)
 */
const TASK_ROUTING: Record<TaskType, ModelSelection> = {
  'real-time-chat': {
    provider: 'groq',
    model: GROQ_MODELS['llama-3.3-70b'],
    fallbackProvider: 'openrouter',
    fallbackModel: OPENROUTER_MODELS['groq-llama-70b'],
    maxTokens: 2000,
    temperature: 0.7
  },
  'quick-categorization': {
    provider: 'groq',
    model: GROQ_MODELS['llama-3.1-8b'],  // INSTANT
    fallbackProvider: 'openrouter',
    fallbackModel: OPENROUTER_MODELS['gemini-flash'],
    maxTokens: 500,
    temperature: 0.1
  },
  'complex-reasoning': {
    provider: 'openrouter',
    model: OPENROUTER_MODELS['deepseek-r1'],  // SOTA reasoning
    fallbackProvider: 'groq',
    fallbackModel: GROQ_MODELS['deepseek-r1'],
    maxTokens: 4000,
    temperature: 0.7
  },
  'long-context': {
    provider: 'openrouter',
    model: OPENROUTER_MODELS['gemini-pro'],  // 1M tokens!
    fallbackProvider: 'openrouter',
    fallbackModel: OPENROUTER_MODELS['gemini-flash'],
    maxTokens: 8000,
    temperature: 0.7
  },
  'structured-output': {
    provider: 'groq',  // Groq is FAST for JSON
    model: GROQ_MODELS['llama-3.3-70b'],
    fallbackProvider: 'openrouter',
    fallbackModel: OPENROUTER_MODELS['qwen-coder'],
    maxTokens: 4000,
    temperature: 0.2
  },
  'vision': {
    provider: 'openrouter',  // Only OpenRouter has vision models free
    model: OPENROUTER_MODELS['llama-4-scout'],  // Best FREE vision
    fallbackProvider: 'openrouter',
    fallbackModel: OPENROUTER_MODELS['yi-vision'],
    maxTokens: 4000,
    temperature: 0.2
  },
  'program-generation': {
    provider: 'openrouter',
    model: OPENROUTER_MODELS['deepseek-r1'],  // Best for complex planning
    fallbackProvider: 'openrouter',
    fallbackModel: OPENROUTER_MODELS['deepseek-v3'],
    maxTokens: 16000,
    temperature: 0.7
  },
  'streaming-feedback': {
    provider: 'groq',  // Groq DOMINATES streaming speed
    model: GROQ_MODELS['llama-3.3-70b'],
    fallbackProvider: 'openrouter',
    fallbackModel: OPENROUTER_MODELS['groq-llama-70b'],
    maxTokens: 2000,
    temperature: 0.6
  },
  'verification': {
    provider: 'openrouter',
    model: OPENROUTER_MODELS['gemini-flash'],  // Fast + accurate
    fallbackProvider: 'groq',
    fallbackModel: GROQ_MODELS['llama-3.3-70b'],
    maxTokens: 1000,
    temperature: 0.1
  }
};

/**
 * Dual-API Model Router
 */
export class DualModelRouter {
  private groq: OpenAI | null = null;
  private openrouter: OpenAI | null = null;
  private failedModels: Set<string> = new Set();
  private usageStats: Map<string, number> = new Map();

  constructor() {
    // Initialize Groq client
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      this.groq = new OpenAI({
        apiKey: groqKey,
        baseURL: 'https://api.groq.com/openai/v1',
        defaultHeaders: {
          'X-Title': 'Wagner Coach',
        }
      });
      console.log('[DualRouter] ✅ Groq API initialized');
    } else {
      console.warn('[DualRouter] ⚠️  Groq API key not found, will use OpenRouter fallback');
    }

    // Initialize OpenRouter client
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (openrouterKey) {
      this.openrouter = new OpenAI({
        apiKey: openrouterKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Wagner Coach',
        }
      });
      console.log('[DualRouter] ✅ OpenRouter API initialized');
    } else {
      console.warn('[DualRouter] ⚠️  OpenRouter API key not found');
    }

    if (!this.groq && !this.openrouter) {
      throw new Error('At least one API key (GROQ_API_KEY or OPENROUTER_API_KEY) is required');
    }
  }

  /**
   * Select the best provider and model for the task
   */
  private selectModel(config: TaskConfig): ModelSelection {
    const baseRouting = TASK_ROUTING[config.type];

    // Override based on priorities
    if (config.prioritizeSpeed && this.groq && baseRouting.provider === 'openrouter') {
      // Try to use Groq if speed is critical
      console.log(`[DualRouter] Speed priority: Switching to Groq for ${config.type}`);
      return {
        ...baseRouting,
        provider: 'groq',
        model: GROQ_MODELS['llama-3.3-70b'],
      };
    }

    if (config.prioritizeAccuracy && baseRouting.provider === 'groq') {
      // Use OpenRouter for accuracy
      console.log(`[DualRouter] Accuracy priority: Switching to OpenRouter for ${config.type}`);
      return {
        ...baseRouting,
        provider: 'openrouter',
        model: OPENROUTER_MODELS['deepseek-r1'],
      };
    }

    // Check if primary provider is available
    const primaryKey = `${baseRouting.provider}:${baseRouting.model}`;
    if (this.failedModels.has(primaryKey)) {
      console.log(`[DualRouter] Primary failed, using fallback for ${config.type}`);
      return {
        ...baseRouting,
        provider: baseRouting.fallbackProvider,
        model: baseRouting.fallbackModel,
      };
    }

    return baseRouting;
  }

  /**
   * Get the appropriate client for the provider
   */
  private getClient(provider: 'groq' | 'openrouter'): OpenAI {
    if (provider === 'groq') {
      if (!this.groq) {
        console.log('[DualRouter] Groq not available, falling back to OpenRouter');
        if (!this.openrouter) throw new Error('No API clients available');
        return this.openrouter;
      }
      return this.groq;
    } else {
      if (!this.openrouter) {
        console.log('[DualRouter] OpenRouter not available, falling back to Groq');
        if (!this.groq) throw new Error('No API clients available');
        return this.groq;
      }
      return this.openrouter;
    }
  }

  /**
   * Complete a task with intelligent routing and fallback
   */
  async complete(
    config: TaskConfig,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string | any }>,
    options: {
      stream?: boolean;
      responseFormat?: { type: 'json_object' };
      onProviderSwitch?: (provider: string, model: string) => void;
    } = {}
  ): Promise<any> {
    const selection = this.selectModel(config);
    const client = this.getClient(selection.provider);
    const modelKey = `${selection.provider}:${selection.model}`;

    // Track usage
    this.usageStats.set(modelKey, (this.usageStats.get(modelKey) || 0) + 1);

    console.log(`[DualRouter] 🚀 Using ${selection.provider.toUpperCase()} - ${selection.model}`);
    options.onProviderSwitch?.(selection.provider, selection.model);

    try {
      const response = await client.chat.completions.create({
        model: selection.model,
        messages,
        temperature: selection.temperature,
        max_tokens: selection.maxTokens,
        stream: options.stream || false,
        ...(options.responseFormat && { response_format: options.responseFormat })
      });

      return response;
    } catch (error: any) {
      console.error(`[DualRouter] ❌ ${selection.provider} failed:`, error.message);

      // Check if it's a quota/rate limit error
      if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
        this.failedModels.add(modelKey);
        console.log(`[DualRouter] 🔄 Falling back to ${selection.fallbackProvider}`);

        // Retry with fallback
        const fallbackClient = this.getClient(selection.fallbackProvider);
        const fallbackResponse = await fallbackClient.chat.completions.create({
          model: selection.fallbackModel,
          messages,
          temperature: selection.temperature,
          max_tokens: selection.maxTokens,
          stream: options.stream || false,
          ...(options.responseFormat && { response_format: options.responseFormat })
        });

        return fallbackResponse;
      }

      // Other error, propagate
      throw error;
    }
  }

  /**
   * Stream completion with intelligent routing
   */
  async stream(
    config: TaskConfig,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: {
      responseFormat?: { type: 'json_object' };
      onProviderSwitch?: (provider: string, model: string) => void;
    } = {}
  ): Promise<ReadableStream> {
    const selection = this.selectModel(config);
    const client = this.getClient(selection.provider);

    console.log(`[DualRouter] 🌊 Streaming with ${selection.provider.toUpperCase()} - ${selection.model}`);
    options.onProviderSwitch?.(selection.provider, selection.model);

    try {
      const response = await client.chat.completions.create({
        model: selection.model,
        messages,
        temperature: selection.temperature,
        max_tokens: selection.maxTokens,
        stream: true,
        ...(options.responseFormat && { response_format: options.responseFormat })
      });

      return response as unknown as ReadableStream;
    } catch (error: any) {
      if (error.status === 429 || error.message?.includes('quota')) {
        this.failedModels.add(`${selection.provider}:${selection.model}`);
        console.log(`[DualRouter] 🔄 Streaming fallback to ${selection.fallbackProvider}`);

        const fallbackClient = this.getClient(selection.fallbackProvider);
        const fallbackResponse = await fallbackClient.chat.completions.create({
          model: selection.fallbackModel,
          messages,
          temperature: selection.temperature,
          max_tokens: selection.maxTokens,
          stream: true,
          ...(options.responseFormat && { response_format: options.responseFormat })
        });

        return fallbackResponse as unknown as ReadableStream;
      }

      throw error;
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): { groq: number; openrouter: number; breakdown: Record<string, number> } {
    let groqCount = 0;
    let openrouterCount = 0;

    for (const [key, count] of this.usageStats.entries()) {
      if (key.startsWith('groq:')) groqCount += count;
      else openrouterCount += count;
    }

    return {
      groq: groqCount,
      openrouter: openrouterCount,
      breakdown: Object.fromEntries(this.usageStats)
    };
  }

  /**
   * Reset failure tracking
   */
  resetFailures(): void {
    this.failedModels.clear();
    console.log('[DualRouter] 🔄 Failure tracking reset');
  }
}

// Export singleton
export const dualRouter = new DualModelRouter();
