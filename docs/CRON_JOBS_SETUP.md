# Automatic Summarization Cron Jobs Setup

## 🎯 What This Does

Automatically creates summaries of your fitness data:
- **Daily at 3 AM UTC**: Summarizes last week's data
- **Monthly**: Aggregates weekly summaries
- **Quarterly**: Aggregates monthly summaries

This gives the AI coach access to:
- Last 7 days: Full detail
- Last 30 days: Weekly summaries
- Last year: Quarterly summaries

## ✅ Setup Steps

### 1. Add Cron Secret to Vercel

Add this environment variable in Vercel:

```
CRON_SECRET=your-random-secret-here-make-it-long-and-secure
```

Generate a secure secret:
```bash
# On Mac/Linux:
openssl rand -base64 32

# Or use any random string generator
```

### 2. Deploy vercel.json

The `vercel.json` file is already created with:

```json
{
  "crons": [
    {
      "path": "/api/cron/summarize",
      "schedule": "0 3 * * *"
    }
  ]
}
```

This runs daily at 3:00 AM UTC.

### 3. Deploy to Vercel

```bash
git add .
git commit -m "feat: add automatic data summarization cron jobs"
git push
```

Vercel will automatically:
- Detect the cron configuration
- Schedule the job
- Run it daily

### 4. Verify Cron Setup

Go to Vercel Dashboard:
1. Select your project
2. Go to **Settings** → **Cron Jobs**
3. You should see: `/api/cron/summarize` scheduled for `0 3 * * *`

## 🧪 Testing

### Manual Test (Before Cron Runs)

Test the summarization immediately:

```bash
# Using curl:
curl -X POST https://your-app.vercel.app/api/admin/trigger-summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{}'

# Or in your browser console (logged in):
fetch('/api/admin/trigger-summary', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
}).then(r => r.json()).then(console.log)
```

### View Generated Summaries

```bash
# Get all your summaries:
fetch('/api/admin/trigger-summary')
  .then(r => r.json())
  .then(console.log)
```

### Test Cron Endpoint (With Secret)

```bash
curl -X GET https://your-app.vercel.app/api/cron/summarize \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 📊 What Gets Summarized

### Weekly Summary
```json
{
  "period_type": "weekly",
  "period_start": "2025-01-13",
  "period_end": "2025-01-19",
  "activity_summary": {
    "total": 5,
    "by_type": {
      "strength": 3,
      "running": 2
    },
    "avg_duration_min": 52,
    "total_distance_km": 15.5,
    "avg_heart_rate": 145,
    "total_calories": 2450,
    "consistency_score": 0.71
  },
  "nutrition_summary": {
    "meals_logged": 21,
    "days_tracked": 7,
    "avg_daily_calories": 2450,
    "avg_daily_protein_g": 165,
    "meal_frequency": 3.0
  }
}
```

### Monthly Summary
Aggregates all weekly summaries + milestones:
```json
{
  "period_type": "monthly",
  "activity_summary": {
    "total": 22,
    "by_type": {"strength": 12, "running": 10},
    "total_duration_hours": 18,
    "total_distance_km": 85,
    "avg_per_week": 5.5
  },
  "key_achievements": [
    "Bench press PR 225lbs",
    "First 5K under 25min"
  ],
  "challenges_faced": [
    "Knee pain week 2"
  ]
}
```

### Quarterly Summary
Aggregates all monthly summaries for the quarter.

## 🔧 Cron Schedule Options

The current schedule is `0 3 * * *` (daily at 3 AM UTC).

Change it in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/summarize",
      "schedule": "0 3 * * *"  // Daily at 3 AM UTC
    }
  ]
}
```

Other options:
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 2 * * 1` - Weekly on Monday at 2 AM
- `0 4 1 * *` - Monthly on 1st at 4 AM

## 📈 Impact on AI Coach

### Before Summaries:
- Limited to last 10 workouts
- No historical patterns
- ~10K tokens context

### After Summaries:
- Last 7 days: Full detail
- Last 30 days: Weekly summaries
- Last year: Quarterly summaries
- ~40K tokens context
- AI knows your complete fitness journey!

## 🐛 Troubleshooting

### Cron Not Running

**Check Vercel Dashboard:**
1. Settings → Cron Jobs
2. View execution logs
3. Check for errors

**Common Issues:**
- `CRON_SECRET` not set → Add to Vercel env vars
- Timeout → Increase `maxDuration` in route.ts
- Database error → Check Supabase connection

### Manual Fix

If cron fails, run manually:

```sql
-- In Supabase SQL Editor:
SELECT generate_weekly_summary(
  'your-user-id'::uuid,
  CURRENT_DATE - INTERVAL '7 days'
);
```

### Check Summary Status

```sql
-- See all summaries:
SELECT
  period_type,
  period_start,
  period_end,
  activity_summary->>'total' as total_activities,
  nutrition_summary->>'meals_logged' as meals_logged
FROM user_context_summaries
WHERE user_id = 'your-user-id'
ORDER BY period_end DESC;
```

## 📝 Monitoring

### Vercel Cron Logs

View execution history:
1. Vercel Dashboard → Your Project
2. Logs → Filter by `/api/cron/summarize`
3. See success/failure status

### Database Check

```sql
-- Count summaries by type:
SELECT
  period_type,
  COUNT(*) as count,
  MAX(period_end) as latest
FROM user_context_summaries
GROUP BY period_type;
```

## 🚀 Next Steps

1. ✅ Deploy with cron configuration
2. ✅ Add `CRON_SECRET` to Vercel
3. ✅ Wait 24 hours for first run (or trigger manually)
4. ✅ Verify summaries in database
5. ✅ Test AI coach with enhanced context

The AI will automatically use summaries for better context!