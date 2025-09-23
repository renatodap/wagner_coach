# OpenRouter + Gemini 2.0 Flash Configuration

## ✅ Environment Variables for Vercel

Add these to your Vercel project settings:

### Required:
```bash
OPENROUTER_API_KEY=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
```

### Optional (for better attribution):
```bash
OPENROUTER_APP_NAME=Wagner Coach
OPENROUTER_SITE_URL=https://your-app.vercel.app
```

### Model Selection (optional):
```bash
# Default is Gemini 2.0 Flash (free tier, 1M token context)
AI_MODEL=google/gemini-2.0-flash-exp:free

# Or use other models:
# AI_MODEL=anthropic/claude-3.5-sonnet  # Best quality, $3/1M tokens
# AI_MODEL=deepseek/deepseek-chat       # Great value, $0.27/1M tokens
# AI_MODEL=google/gemini-pro-1.5        # 2M context, $1.25/1M tokens
```

## 🚀 What Changed

### Before (OpenAI GPT-4):
- **Context limit**: 128K tokens (~10K tokens used)
- **Cost**: $10 per 1M input tokens
- **Max context**: Last 5 workouts, 3 meals

### After (Gemini 2.0 Flash via OpenRouter):
- **Context limit**: 1M tokens (100K tokens used!)
- **Cost**: $0.075 per 1M input tokens (133x cheaper!)
- **Max context**: Last 30 days full detail, plus summaries

## 📊 Available Models on OpenRouter

### Best for Massive Context:
| Model | Context | Input Cost | Best For |
|-------|---------|-----------|----------|
| **google/gemini-2.0-flash-exp:free** | 1M | FREE! | 🏆 Best value |
| **google/gemini-pro-1.5** | 2M | $1.25/1M | Largest context |
| **anthropic/claude-3.5-sonnet** | 200K | $3.00/1M | Best quality |
| **deepseek/deepseek-chat** | 64K | $0.27/1M | Great value |

### Check all models:
https://openrouter.ai/models

## 🔧 How It Works

1. **API calls** go to: `https://openrouter.ai/api/v1`
2. **OpenRouter** routes to the model you specify
3. **Response format** is identical to OpenAI API
4. **No code changes** needed (uses OpenAI SDK)

## 💰 Cost Comparison

### Example: User asks "Should I do legs today?"

**Context sent:**
- User profile
- Last 7 days activities (detailed)
- Last 30 days meals (summary)
- Preferences & injuries
- Conversation history

**Total: ~40K tokens input**

| Model | Cost per Request | Monthly (100 requests) |
|-------|-----------------|----------------------|
| GPT-4 Turbo | $0.40 | $40 |
| Gemini 2.0 Flash | $0.003 | $0.30 |
| **Savings** | **99.25%** | **$39.70** |

## 🎯 Next Steps

### Phase 1: ✅ Done
- [x] Configure OpenRouter client
- [x] Switch to Gemini 2.0 Flash
- [x] Increase context limits

### Phase 2: Create Summary Tables
```sql
CREATE TABLE user_context_summaries (
  user_id UUID,
  period_type TEXT, -- 'weekly', 'monthly', 'quarterly'
  period_start DATE,
  period_end DATE,
  activity_summary JSONB,
  nutrition_summary JSONB,
  key_achievements TEXT[]
);
```

### Phase 3: Tiered Context
- Last 7 days: Full detail (20K tokens)
- Last 30 days: Summary (3K tokens)
- Last year: Quarterly summaries (5K tokens)

## 🔍 Monitoring Usage

Check your OpenRouter dashboard:
https://openrouter.ai/activity

See:
- Requests per day
- Token usage
- Cost breakdown
- Model performance

## 🐛 Troubleshooting

### Error: "Invalid API key"
- Check `OPENROUTER_API_KEY` in Vercel
- Make sure it starts with `sk-or-v1-`

### Error: "Model not found"
- Check model name format: `provider/model-name`
- List available models: https://openrouter.ai/models

### Slow responses
- Gemini 2.0 Flash is very fast (~1s for 40K tokens)
- Check network latency
- Consider using streaming (already enabled)

## 📝 Model Selection Guide

**For Wagner Coach, we recommend:**

**Production:** `google/gemini-2.0-flash-exp:free`
- FREE tier available
- 1M token context
- Fast responses
- Good quality

**If you need best quality:** `anthropic/claude-3.5-sonnet`
- Best reasoning
- 200K context
- $3/1M tokens

**Budget option:** `deepseek/deepseek-chat`
- 64K context
- $0.27/1M tokens
- Good performance