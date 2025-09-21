# Wagner Coach AI Integration - Setup & Deployment Guide

## 🚀 Complete Setup Instructions

This guide will help you deploy the AI Coach feature to production. Follow these steps carefully to ensure a successful deployment.

## Prerequisites

Before starting, ensure you have:

1. **Supabase Project** with authentication already configured
2. **Vercel Account** for deployment
3. **API Keys**:
   - OpenAI API Key (GPT-4 access required)
   - Google Cloud API Key (for embeddings)

## Step 1: Database Setup (Supabase)

### 1.1 Enable pgvector Extension

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the following command:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 1.2 Run Migration Script

Execute the complete migration script located at `./supabase/migrations/20240101000000_add_ai_coach.sql`

This will:
- Add embedding columns to existing tables
- Create AI conversation tables
- Set up rate limiting
- Create similarity search functions
- Enable Row Level Security (RLS)

**Important**: Run this in your Supabase SQL editor:

```sql
-- Copy and paste the entire contents of:
-- ./supabase/migrations/20240101000000_add_ai_coach.sql
```

### 1.3 Verify Database Setup

Run these verification queries:

```sql
-- Check if pgvector is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('ai_conversations', 'user_context_embeddings', 'rate_limits');

-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'search_user_context';
```

All queries should return results.

## Step 2: Environment Variables

### 2.1 Local Development (.env.local)

Create or update `.env.local`:

```env
# Existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# New AI variables
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_cloud_api_key

# Optional: Set app URL for local development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.2 Vercel Production

In your Vercel project settings, add these environment variables:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the following:

```
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_cloud_api_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## Step 3: Google Cloud Setup

### 3.1 Enable Google Generative AI API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Generative Language API"
4. Go to Credentials → Create Credentials → API Key
5. Restrict the API key to:
   - Generative Language API
   - Your domain/IP addresses

### 3.2 API Key Restrictions (Important!)

For production, restrict your API key:

1. Application restrictions:
   - HTTP referrers: `https://your-domain.vercel.app/*`
2. API restrictions:
   - Restrict to "Generative Language API"

## Step 4: OpenAI Setup

### 4.1 Get API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to API Keys
3. Create new secret key
4. Ensure you have GPT-4 access (required for best results)

### 4.2 Set Usage Limits

To prevent unexpected charges:

1. Go to Usage Limits in OpenAI dashboard
2. Set monthly budget limit
3. Set rate limits per model

## Step 5: Deploy to Production

### 5.1 Push to GitHub

```bash
# Ensure you're on the feature branch
git checkout feature/ai-coach-integration

# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: Complete AI Coach integration with pgvector RAG system"

# Push to GitHub
git push origin feature/ai-coach-integration
```

### 5.2 Create Pull Request

1. Go to your GitHub repository
2. Click "Compare & pull request"
3. Review all changes
4. Merge to main branch

### 5.3 Deploy via Vercel

If auto-deployment is configured:
- Vercel will automatically deploy when you merge to main

Manual deployment:
```bash
vercel --prod
```

## Step 6: Post-Deployment Verification

### 6.1 Test Coach Interface

1. Navigate to `https://your-domain/coach`
2. Verify the Coach tab appears in bottom navigation
3. Send a test message
4. Confirm streaming responses work

### 6.2 Check Database

Run in Supabase SQL editor:

```sql
-- Check for conversations
SELECT COUNT(*) FROM ai_conversations;

-- Check for embeddings
SELECT COUNT(*) FROM user_context_embeddings;

-- Check rate limits
SELECT * FROM rate_limits WHERE endpoint = 'coach';
```

### 6.3 Monitor Logs

In Vercel Dashboard:
1. Go to Functions tab
2. Check logs for `/api/coach`
3. Verify no errors

## Step 7: Initial Data Population (Optional)

To improve AI context from the start, generate embeddings for existing data:

```javascript
// Run this script after deployment to generate embeddings for existing workouts
// Create a file: scripts/generate-initial-embeddings.js

async function generateInitialEmbeddings() {
  const users = await supabase.from('profiles').select('id');

  for (const user of users.data) {
    // Get user's workout completions
    const workouts = await supabase
      .from('workout_completions')
      .select('*')
      .eq('user_id', user.id);

    // Generate embeddings for each workout
    for (const workout of workouts.data) {
      await fetch('/api/embeddings/generate', {
        method: 'POST',
        body: JSON.stringify({
          content: `Workout: ${workout.notes || 'No notes'}`,
          contentType: 'workout',
          userId: user.id,
          metadata: { workoutCompletionId: workout.id }
        })
      });
    }
  }
}
```

## 🔧 Troubleshooting

### Issue: "Extension 'vector' not found"

**Solution**: Your Supabase plan might not support pgvector. Upgrade to Pro plan or contact Supabase support.

### Issue: "Rate limit exceeded" immediately

**Solution**: Check and reset rate limits:

```sql
DELETE FROM rate_limits WHERE user_id = 'user-id-here';
```

### Issue: Embeddings not generating

**Solution**: Verify Google API key is valid:

```bash
curl -X POST \
  'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent' \
  -H 'Content-Type: application/json' \
  -H "x-goog-api-key: YOUR_API_KEY" \
  -d '{"content": {"text": "test"}}'
```

### Issue: OpenAI responses are slow

**Solution**:
1. Check OpenAI API status
2. Consider using `gpt-3.5-turbo` for faster responses
3. Reduce `maxTokens` in `/app/api/coach/route.ts`

## 📊 Monitoring & Analytics

### Track Usage

Create a dashboard query in Supabase:

```sql
-- Daily coach usage
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_conversations
FROM ai_conversations
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Most common topics
SELECT
  content_type,
  COUNT(*) as count
FROM user_context_embeddings
GROUP BY content_type
ORDER BY count DESC;
```

### Monitor Costs

1. **OpenAI**: Check usage at platform.openai.com/usage
2. **Google Cloud**: Monitor at console.cloud.google.com/billing
3. **Supabase**: Check database size for vector storage

## 🔒 Security Checklist

- [ ] API keys are in environment variables (never committed)
- [ ] Google API key is restricted to your domain
- [ ] OpenAI API key has usage limits set
- [ ] RLS policies are enabled on all tables
- [ ] Rate limiting is configured (100 messages/day/user)
- [ ] No PII in embeddings
- [ ] HTTPS enforced on all endpoints

## 🎉 Success Indicators

Your AI Coach is working correctly when:

1. ✅ Users can access `/coach` route
2. ✅ Messages stream in real-time
3. ✅ AI references actual workout data
4. ✅ Conversations persist between sessions
5. ✅ Rate limiting prevents abuse
6. ✅ No errors in Vercel logs

## 📝 Maintenance

### Weekly Tasks

1. Review API usage and costs
2. Check error logs
3. Monitor user feedback
4. Update rate limits if needed

### Monthly Tasks

1. Analyze conversation topics
2. Improve system prompts based on usage
3. Clean up old embeddings (optional)
4. Review and optimize vector search performance

## 🆘 Support

If you encounter issues:

1. Check Vercel function logs
2. Review Supabase logs
3. Test API keys independently
4. Verify database migrations completed
5. Check browser console for client-side errors

## Next Steps

After successful deployment:

1. **Monitor initial usage** for 1-2 weeks
2. **Gather user feedback** on coaching quality
3. **Fine-tune prompts** based on actual conversations
4. **Consider adding**:
   - Voice input/output
   - Workout plan generation
   - Progress visualization in chat
   - Export coaching insights

---

**Remember**: The AI Coach feature is now live and will start learning from user interactions immediately. Monitor closely during the first week to ensure everything is working smoothly.

## Commands Summary

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Check deployment
curl https://your-domain/api/coach \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "userId": "test-user"}'
```

Congratulations! Your AI Coach is ready to help users achieve their fitness goals with intelligent, personalized guidance. 💪