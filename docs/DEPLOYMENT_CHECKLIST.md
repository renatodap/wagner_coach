# Deployment Checklist - AI Coach with Tiered Context

## 🚀 Quick Deploy (5 minutes)

### Step 1: Environment Variables in Vercel

Add these to your Vercel project settings:

```bash
# Required - Already have this ✅
OPENROUTER_API_KEY=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

# Required - Generate a secure secret
CRON_SECRET=<generate-with-openssl-rand-base64-32>

# Optional - Better attribution
OPENROUTER_APP_NAME=Wagner Coach
OPENROUTER_SITE_URL=https://your-app.vercel.app

# Optional - Model selection (defaults to Gemini 2.0 Flash)
AI_MODEL=google/gemini-2.0-flash-exp:free
```

### Step 2: Database Migrations

Run these migrations in order:

```bash
# 1. Memory enhancement (already done if you followed earlier steps)
supabase migration up 20240202_memory_enhancement_system.sql

# 2. Tiered context summaries
supabase migration up 20240203_tiered_context_summaries.sql
```

Or apply via Supabase dashboard:
1. Go to SQL Editor
2. Copy/paste migration contents
3. Run

### Step 3: Deploy Code

```bash
git add .
git commit -m "feat: OpenRouter + Gemini 2.0 Flash + tiered context + auto-summarization"
git push
```

Vercel will automatically deploy with cron jobs!

### Step 4: Verify

1. **Check Vercel Cron Jobs**:
   - Vercel Dashboard → Settings → Cron Jobs
   - Should see: `/api/cron/summarize` at `0 3 * * *`

2. **Test Manual Summarization**:
   ```javascript
   // In browser console (logged in):
   fetch('/api/admin/trigger-summary', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({})
   }).then(r => r.json()).then(console.log)
   ```

3. **Check AI Coach**:
   - Go to /coach
   - Ask: "What workouts have I done this week?"
   - It should reference actual workouts!

## ✅ What You've Accomplished

### AI Model Upgrade:
- ✅ Switched from GPT-4 ($10/1M tokens) → Gemini 2.0 Flash ($0.075/1M)
- ✅ Context window: 128K → 1M tokens
- ✅ Cost per request: $0.30 → $0.003 (100x cheaper!)

### Memory Enhancement:
- ✅ Memory facts extraction
- ✅ Conversation summaries
- ✅ Preference profiles
- ✅ Long-term trend analysis

### Tiered Context:
- ✅ Last 7 days: Full detail
- ✅ Last 30 days: Weekly summaries
- ✅ Last year: Quarterly summaries
- ✅ Milestones tracking

### Automation:
- ✅ Daily cron job at 3 AM UTC
- ✅ Auto-generates summaries
- ✅ Cleans up old data

## 📊 Expected Results

### Context Size:
**Before:** ~10K tokens (last 5 workouts, 3 meals)
**After:** ~40K tokens (30+ days of data!)

### AI Coach Knowledge:
**Before:**
- Recent workouts
- Basic profile
- Current goals

**After:**
- Complete 7-day activity log
- 30-day nutrition patterns
- Quarterly progress trends
- All PRs and achievements
- Injury history
- Recovery patterns
- Actual conversation memory

### Cost Analysis:
**Monthly Usage (100 AI requests):**
- Before: $30 (GPT-4)
- After: $0.30 (Gemini 2.0 Flash)
- **Savings: $29.70/month (99% reduction!)**

## 🔍 Monitoring

### Check Cron Execution:
```bash
# Vercel Dashboard → Logs → Filter by:
/api/cron/summarize
```

### View Summaries in DB:
```sql
SELECT
  period_type,
  period_start,
  period_end,
  (activity_summary->>'total')::int as activities,
  (nutrition_summary->>'meals_logged')::int as meals
FROM user_context_summaries
WHERE user_id = auth.uid()
ORDER BY period_end DESC
LIMIT 10;
```

### Test AI Context:
Ask the AI coach:
- "What have I eaten this week?"
- "How's my workout consistency?"
- "Show me my progress this month"
- "What was my best workout last week?"

## 🐛 Troubleshooting

### "OpenRouter API key not configured"
→ Add `OPENROUTER_API_KEY` to Vercel, redeploy

### "Cron job failed"
→ Check `CRON_SECRET` is set in Vercel
→ View logs in Vercel Dashboard

### "No summaries found"
→ Run manual trigger: `POST /api/admin/trigger-summary`
→ Or wait for next 3 AM UTC

### "AI doesn't remember my data"
→ Check if migrations ran successfully
→ Verify summaries exist in database
→ Test with: `GET /api/admin/trigger-summary`

## 📱 Mobile Testing

Test on mobile app:
1. Log a workout
2. Log a meal
3. Ask AI coach about it
4. Should get personalized response!

## 🎉 Success Metrics

You'll know it's working when:

✅ AI coach references specific workouts by name/date
✅ AI knows what you ate yesterday
✅ AI tracks your weekly patterns
✅ AI remembers injuries and preferences
✅ API costs drop dramatically (check OpenRouter dashboard)
✅ Cron jobs run successfully (check Vercel logs)
✅ Summaries appear in database

## 📚 Documentation Reference

- **OpenRouter Setup**: `OPENROUTER_SETUP.md`
- **Cron Jobs**: `CRON_JOBS_SETUP.md`
- **AI Capabilities**: `AI_COACH_CAPABILITIES.md`
- **Model Analysis**: `AI_MODEL_ANALYSIS.md`
- **Quick Setup**: `QUICK_SETUP.md`

## 🔄 Regular Maintenance

**Weekly:**
- Check cron execution logs
- Verify summaries are being created
- Monitor API costs (should be ~$0.01/day)

**Monthly:**
- Review quarterly summaries
- Check storage usage
- Update milestones if needed

**As Needed:**
- Switch AI models if better options available
- Adjust cron schedule if needed
- Fine-tune summarization logic

---

## Ready to Deploy?

```bash
# 1. Add CRON_SECRET to Vercel
# 2. Run migrations
# 3. Push to deploy
git push

# 4. Test after deploy
# Visit /coach and ask about your recent activities!
```

Your AI coach now has a **photographic memory** of your entire fitness journey! 🚀💪