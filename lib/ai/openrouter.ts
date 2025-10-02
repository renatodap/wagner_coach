/**
 * OpenRouter AI Service
 * Automatically selects the best model for each task
 */

interface OpenRouterRequest {
  model?: string; // Optional - OpenRouter can auto-select
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  // OpenRouter specific
  route?: 'fallback' | 'balanced' | 'quality' | 'cost'; // Routing preference
  models?: string[]; // List of models to choose from
  transforms?: string[]; // Optional transforms
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string; // Which model was actually used
}

class OpenRouterService {
  private apiKey: string;
  private baseURL = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenRouter API key not configured');
    }
  }

  /**
   * Send a completion request to OpenRouter
   * @param request - The request configuration
   * @param preferredModels - Optional list of preferred models for this task
   */
  async complete(
    request: OpenRouterRequest,
    preferredModels?: string[]
  ): Promise<OpenRouterResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const body = {
      ...request,
      models: preferredModels || request.models,
      // Let OpenRouter choose the best model if not specified
      model: request.model || 'auto',
    };

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Wagner Coach Fitness App',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    return response.json();
  }

  /**
   * Stream a completion from OpenRouter
   */
  async stream(
    request: OpenRouterRequest,
    preferredModels?: string[]
  ): Promise<ReadableStream> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const body = {
      ...request,
      stream: true,
      models: preferredModels || request.models,
      model: request.model || 'auto',
    };

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Wagner Coach Fitness App',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    return response.body!;
  }

  /**
   * Analyze an image using vision models
   * OPTIMIZED: Using FREE models only!
   */
  async analyzeImage(
    imageData: string,
    prompt: string,
    preferredModels = [
      'google/gemini-2.0-flash-thinking-exp:free',  // ✅ FREE - 1M context + vision
      'google/gemini-2.0-flash-exp:free'            // ✅ FREE - Fast vision
    ]
  ): Promise<any> {
    const messages = [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text',
            text: prompt
          },
          {
            type: 'image_url',
            image_url: {
              url: imageData // Should be base64 or URL
            }
          }
        ]
      }
    ];

    const response = await this.complete({
      messages: messages as any,
      models: preferredModels,
      route: 'quality', // Prioritize quality for image analysis
      max_tokens: 1500,
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    return response.choices[0].message.content;
  }

  /**
   * Quick text analysis for categorization
   * OPTIMIZED: Using FREE ultra-fast models!
   */
  async quickAnalysis(
    text: string,
    systemPrompt: string,
    preferredModels = [
      'meta-llama/llama-3.2-3b-instruct:free',    // ✅ FREE - Super fast categorization
      'google/gemini-2.0-flash-exp:free',          // ✅ FREE - Fast and accurate
      'meta-llama/llama-3.3-70b-instruct:free'     // ✅ FREE - Backup
    ]
  ): Promise<string> {
    const response = await this.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      models: preferredModels,
      route: 'balanced', // Balance between cost and quality
      max_tokens: 500,
      temperature: 0.5,
    });

    return response.choices[0].message.content;
  }

  /**
   * High-quality coaching response
   * OPTIMIZED: Using FREE top-tier models with SOTA reasoning!
   */
  async coachingResponse(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    preferredModels = [
      'deepseek/deepseek-r1:free',                 // ✅ FREE - Best reasoning, beats GPT-4!
      'google/gemini-2.0-flash-exp:free',          // ✅ FREE - 1M context, excellent quality
      'qwen/qwen-2.5-72b-instruct:free'            // ✅ FREE - Strong backup
    ]
  ): Promise<OpenRouterResponse> {
    return this.complete({
      messages,
      models: preferredModels,
      route: 'quality', // Prioritize quality for coaching
      max_tokens: 2000,
      temperature: 0.7,
    });
  }
}

// Export singleton instance
export const openRouter = new OpenRouterService();

// Export types
export type { OpenRouterRequest, OpenRouterResponse };