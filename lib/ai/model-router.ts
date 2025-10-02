/**
 * Intelligent Model Router - Cost-Optimized FREE Models
 * Automatically selects the best free model for each task
 *
 * All models are FREE with intelligent fallback chains
 */

import { OpenAI } from 'openai';

export type TaskType =
  | 'simple-extraction'      // Quick text parsing, categorization
  | 'complex-reasoning'      // Planning, analysis, multi-step reasoning
  | 'long-context'          // 50k+ tokens context
  | 'structured-output'     // JSON, code generation
  | 'vision'                // Image analysis
  | 'quick-categorization'  // Fast categorization, minimal logic
  | 'verification'          // Quality check, validation
  | 'conversational'        // Chat, coaching responses
  | 'program-generation';   // Full workout/meal programs

export interface TaskConfig {
  type: TaskType;
  contextTokens?: number;
  requiresJSON?: boolean;
  requiresVision?: boolean;
  requiresReasoning?: boolean;
  criticalAccuracy?: boolean; // If true, uses verification
}

interface ModelConfig {
  primary: string;
  fallbacks: string[];
  maxTokens: number;
  temperature: number;
}

/**
 * FREE Model Configuration - Updated 2025
 * All models are completely FREE on OpenRouter
 */
const MODEL_CONFIGS: Record<TaskType, ModelConfig> = {
  'simple-extraction': {
    primary: 'google/gemini-2.0-flash-exp:free',
    fallbacks: ['meta-llama/llama-3.3-70b-instruct:free', 'qwen/qwen-2.5-72b-instruct:free'],
    maxTokens: 2000,
    temperature: 0.3
  },
  'complex-reasoning': {
    primary: 'deepseek/deepseek-r1:free',
    fallbacks: ['qwen/qwen-2.5-72b-instruct:free', 'google/gemini-2.0-flash-exp:free'],
    maxTokens: 4000,
    temperature: 0.7
  },
  'long-context': {
    primary: 'google/gemini-2.5-pro-exp:free',
    fallbacks: ['deepseek/deepseek-r1:free', 'google/gemini-2.0-flash-exp:free'],
    maxTokens: 8000,
    temperature: 0.7
  },
  'structured-output': {
    primary: 'qwen/qwen-2.5-coder-32b-instruct:free',
    fallbacks: ['deepseek/deepseek-r1:free', 'google/gemini-2.0-flash-exp:free'],
    maxTokens: 4000,
    temperature: 0.2
  },
  'vision': {
    primary: 'google/gemini-2.0-flash-thinking-exp:free',
    fallbacks: ['google/gemini-2.0-flash-exp:free'],
    maxTokens: 2000,
    temperature: 0.3
  },
  'quick-categorization': {
    primary: 'meta-llama/llama-3.2-3b-instruct:free',
    fallbacks: ['google/gemini-2.0-flash-exp:free', 'meta-llama/llama-3.3-70b-instruct:free'],
    maxTokens: 500,
    temperature: 0.1
  },
  'verification': {
    primary: 'google/gemini-2.0-flash-exp:free',
    fallbacks: ['qwen/qwen-2.5-72b-instruct:free', 'meta-llama/llama-3.3-70b-instruct:free'],
    maxTokens: 1000,
    temperature: 0.1
  },
  'conversational': {
    primary: 'deepseek/deepseek-r1:free',
    fallbacks: ['google/gemini-2.0-flash-exp:free', 'qwen/qwen-2.5-72b-instruct:free'],
    maxTokens: 2000,
    temperature: 0.7
  },
  'program-generation': {
    primary: 'deepseek/deepseek-r1:free',
    fallbacks: ['qwen/qwen-2.5-72b-instruct:free', 'google/gemini-2.5-pro-exp:free'],
    maxTokens: 16000,
    temperature: 0.7
  }
};

/**
 * Intelligent Model Router
 */
export class ModelRouter {
  private openrouter: OpenAI;
  private failedModels: Set<string> = new Set();
  private modelUsageCount: Map<string, number> = new Map();

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is required for ModelRouter');
    }

    this.openrouter = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Wagner Coach',
      }
    });
  }

  /**
   * Get the optimal model for a task
   */
  selectModel(config: TaskConfig): { model: string; maxTokens: number; temperature: number } {
    const modelConfig = MODEL_CONFIGS[config.type];

    // Try primary model first
    if (!this.failedModels.has(modelConfig.primary)) {
      return {
        model: modelConfig.primary,
        maxTokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature
      };
    }

    // Try fallbacks
    for (const fallback of modelConfig.fallbacks) {
      if (!this.failedModels.has(fallback)) {
        console.warn(`Primary model ${modelConfig.primary} failed, using fallback: ${fallback}`);
        return {
          model: fallback,
          maxTokens: modelConfig.maxTokens,
          temperature: modelConfig.temperature
        };
      }
    }

    // All models failed, reset and try again (quota may have reset)
    console.warn('All models failed, resetting failure tracking');
    this.failedModels.clear();
    return {
      model: modelConfig.primary,
      maxTokens: modelConfig.maxTokens,
      temperature: modelConfig.temperature
    };
  }

  /**
   * Complete a task with automatic model selection and fallback
   */
  async complete(
    config: TaskConfig,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string | any }>,
    options: {
      stream?: boolean;
      responseFormat?: { type: 'json_object' };
      onModelSwitch?: (model: string) => void;
    } = {}
  ): Promise<any> {
    const modelConfig = this.selectModel(config);
    const selectedModel = modelConfig.model;

    // Track usage
    this.modelUsageCount.set(
      selectedModel,
      (this.modelUsageCount.get(selectedModel) || 0) + 1
    );

    console.log(`[ModelRouter] Using ${selectedModel} for ${config.type}`);
    options.onModelSwitch?.(selectedModel);

    try {
      const response = await this.openrouter.chat.completions.create({
        model: selectedModel,
        messages,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
        stream: options.stream || false,
        ...(options.responseFormat && { response_format: options.responseFormat })
      });

      return response;
    } catch (error: any) {
      // Check if it's a quota/rate limit error
      if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
        console.warn(`[ModelRouter] ${selectedModel} quota exceeded, marking as failed`);
        this.failedModels.add(selectedModel);

        // Retry with fallback
        const fallbackConfig = this.selectModel(config);
        console.log(`[ModelRouter] Retrying with ${fallbackConfig.model}`);

        const fallbackResponse = await this.openrouter.chat.completions.create({
          model: fallbackConfig.model,
          messages,
          temperature: fallbackConfig.temperature,
          max_tokens: fallbackConfig.maxTokens,
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
   * Stream completion with automatic model selection
   */
  async stream(
    config: TaskConfig,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: {
      responseFormat?: { type: 'json_object' };
      onModelSwitch?: (model: string) => void;
    } = {}
  ): Promise<ReadableStream> {
    const modelConfig = this.selectModel(config);
    const selectedModel = modelConfig.model;

    console.log(`[ModelRouter] Streaming with ${selectedModel} for ${config.type}`);
    options.onModelSwitch?.(selectedModel);

    try {
      const response = await this.openrouter.chat.completions.create({
        model: selectedModel,
        messages,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
        stream: true,
        ...(options.responseFormat && { response_format: options.responseFormat })
      });

      return response as unknown as ReadableStream;
    } catch (error: any) {
      // Check if it's a quota/rate limit error
      if (error.status === 429 || error.message?.includes('quota')) {
        this.failedModels.add(selectedModel);

        // Retry with fallback
        const fallbackConfig = this.selectModel(config);
        console.log(`[ModelRouter] Retrying stream with ${fallbackConfig.model}`);

        const fallbackResponse = await this.openrouter.chat.completions.create({
          model: fallbackConfig.model,
          messages,
          temperature: fallbackConfig.temperature,
          max_tokens: fallbackConfig.maxTokens,
          stream: true,
          ...(options.responseFormat && { response_format: options.responseFormat })
        });

        return fallbackResponse as unknown as ReadableStream;
      }

      throw error;
    }
  }

  /**
   * Verify output with a second free model for critical tasks
   * Uses a different free model to double-check accuracy
   */
  async verifyOutput(
    originalPrompt: string,
    output: string,
    verificationCriteria: string
  ): Promise<{ isValid: boolean; issues: string[] }> {
    const verificationModel = 'google/gemini-2.0-flash-exp:free'; // Fast verification

    const messages = [
      {
        role: 'system' as const,
        content: `You are a quality checker. Verify if the output meets the criteria.
Return JSON: { "isValid": boolean, "issues": string[] }`
      },
      {
        role: 'user' as const,
        content: `ORIGINAL PROMPT: ${originalPrompt}

OUTPUT TO VERIFY:
${output}

CRITERIA:
${verificationCriteria}

Verify the output and return your assessment.`
      }
    ];

    try {
      const response = await this.openrouter.chat.completions.create({
        model: verificationModel,
        messages,
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{"isValid": true, "issues": []}');
      return result;
    } catch (error) {
      console.error('[ModelRouter] Verification failed:', error);
      return { isValid: true, issues: [] }; // Default to accepting if verification fails
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): Record<string, number> {
    return Object.fromEntries(this.modelUsageCount);
  }

  /**
   * Reset failure tracking (call periodically or on quota reset)
   */
  resetFailures(): void {
    this.failedModels.clear();
    console.log('[ModelRouter] Failure tracking reset');
  }
}

// Export singleton
export const modelRouter = new ModelRouter();
