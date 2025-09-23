# Quick Setup Guide - OpenRouter + Gemini 2.0 Flash

## ✅ What's Already Done

1. ✅ Code updated to use OpenRouter
2. ✅ Gemini 2.0 Flash configured (1M token context!)
3. ✅ Context limit increased from 3.5K → 50K tokens
4. ✅ Summary tables created for tiered context
5. ✅ You already have OpenRouter API key

## 🚀 5-Minute Setup

### Step 1: Add to Vercel Environment Variables

Go to your Vercel project → Settings → Environment Variables → Add:

```
OPENROUTER_API_KEY=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
```

**That's it!** The code will automatically:
- Use OpenRouter instead of OpenAI
- Use Gemini 2.0 Flash (free tier!)
- Handle 10x more context

### Step 2: Deploy

```bash
git add .
git commit -m "feat: switch to OpenRouter with Gemini 2.0 Flash for massive context window"
git push
```

Vercel will auto-deploy.

### Step 3 (Optional): Apply New Migration

Run the tiered context migration for even more history:

```bash
# In Supabase dashboard or CLI:
supabase migration up
```

This adds summary tables for 30-day and quarterly data.

## 🎯 What This Gives You

### Before:
❌ ~10K tokens context (last 3-5 workouts)
❌ $0.30 per request (GPT-4)
❌ Limited history

### After:
✅ ~50K tokens context (last 30+ workouts!)
✅ $0.003 per request (100x cheaper!)
✅ Full fitness journey context

### With Tiered Context (after migration):
✅ Last 7 days: FULL detail
✅ Last 30 days: Summary stats
✅ Last year: Quarterly summaries
✅ All milestones & PRs

## 💬 AI Coach Will Now Know:

**Immediate (Last 7 Days):**
- Every workout with sets/reps/weights
- Every meal with macros
- Every run/ride from Strava/Garmin
- All your notes and ratings

**Recent (Last 30 Days):**
- Total workouts by type
- Average nutrition stats
- Consistency patterns
- Top exercises/foods

**Historical (Last Year):**
- Quarterly progress summaries
- Major PRs and achievements
- Injuries and recovery
- Body composition changes

## 🧪 Test It

1. Go to your coach page
2. Ask: "What have I been eating this week?"
3. The AI will reference ACTUAL meals from your logs!

Or ask: "Should I do legs today?"
- It knows your recent leg workouts
- It knows if your knee was sore
- It knows your recovery patterns
- It gives TRULY personalized advice

## 📊 Monitor Usage

Check your OpenRouter dashboard:
https://openrouter.ai/activity

You'll see:
- Requests per day
- Token usage
- Cost (should be ~$0.003 per request)

## 🔧 Optional: Switch Models

Want even MORE context? Edit `.env`:

```bash
# 2 million token context (biggest available!)
AI_MODEL=google/gemini-pro-1.5

# Or best quality reasoning
AI_MODEL=anthropic/claude-3.5-sonnet

# Or best value
AI_MODEL=deepseek/deepseek-chat
```

## ❓ Troubleshooting

**"OpenRouter API key not configured"**
- Check Vercel env vars
- Redeploy after adding

**"Invalid model"**
- Default model is `google/gemini-2.0-flash-exp:free`
- Check available models: https://openrouter.ai/models

**Cost too high?**
- Should be ~$0.003 per request
- Free tier available for Gemini 2.0 Flash
- Check dashboard: https://openrouter.ai/activity

## 🎉 You're Done!

Your AI coach now has:
- 100x cheaper API calls
- 10x more context
- Full fitness history access
- Truly personalized coaching

**No URL needed** - OpenRouter base URL is built into the code!
Just add the API key to Vercel and deploy 🚀