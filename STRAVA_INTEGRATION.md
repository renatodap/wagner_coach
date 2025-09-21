# 🏃‍♂️ Strava Integration - Complete Activity Tracking

## 🎯 Universal Fitness Device Integration

Wagner Coach now seamlessly connects to **any fitness device or app** through Strava, treating all workout types equally - strength training, running, cycling, swimming, yoga, and more.

### 📱 What Devices Work?

**Smart Watches:**
- Apple Watch (all models)
- Garmin (Forerunner, Fenix, Venu, etc.)
- Fitbit (Sense, Versa, Charge)
- Polar (Vantage, Grit, Ignite)
- Suunto (all models)
- Samsung Galaxy Watch
- Amazfit, Wahoo, and more

**Phone Apps:**
- Nike Run Club
- Adidas Running
- Peloton
- MyFitnessPal
- Zwift
- Apple Fitness+
- Google Fit
- And 100+ more apps

### 🔄 How It Works

1. **Connect Once**: Link your Strava account in Settings (takes 30 seconds)
2. **Auto-Sync**: All activities from any connected device sync automatically
3. **Real-Time**: New workouts appear in Wagner Coach within minutes
4. **Complete Data**: Heart rate, pace, distance, calories, duration - everything

## 🛠️ Setup Instructions

### 1. Create Strava App (2 minutes)

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Click "Create App"
3. Fill in:
   - **App Name**: Wagner Coach
   - **Category**: Training
   - **Website**: Your domain (or localhost for development)
   - **Authorization Callback Domain**: `localhost:3000` (for development)
4. Copy your Client ID and Client Secret

### 2. Environment Variables

Add to your `.env.local`:

```bash
STRAVA_CLIENT_ID=your_client_id_here
STRAVA_CLIENT_SECRET=your_client_secret_here
STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback
STRAVA_VERIFY_TOKEN=your_webhook_verify_token_here
```

### 3. Database Migration

Run the Strava integration migration:

```bash
supabase migration up --file 20250121_strava_integration
```

This creates all necessary tables:
- `strava_connections` - OAuth tokens and athlete data
- `activities` - All workout types (unified schema)
- `activity_segments` - Laps, intervals, sets
- `activity_streams` - Time-series data (heart rate, power, etc.)
- `fitness_goals` - Goal tracking across all activities

### 4. User Flow

1. **Settings Page**: User clicks "Connect Strava"
2. **OAuth**: Redirects to Strava for authorization
3. **Auto-Import**: Imports last 30 activities immediately
4. **Real-Time Sync**: New activities sync via webhooks

## 🏋️‍♀️ All Activity Types Supported

### Strength Training
- Weight lifting sessions
- Bodyweight workouts
- CrossFit WODs
- Gym sessions

### Cardio Activities
- Running (road, trail, treadmill)
- Cycling (road, mountain, indoor)
- Swimming (pool, open water)
- Rowing, elliptical, etc.

### Flexibility & Recovery
- Yoga sessions
- Pilates
- Stretching
- Mobility work

### Sports & Recreation
- Tennis, basketball, soccer
- Hiking, walking
- Skiing, snowboarding
- And many more...

## 📊 What Data Is Synced

### Basic Metrics (All Activities)
- Duration (elapsed + moving time)
- Start date/time
- Activity name and type
- Calories burned
- Notes and ratings

### Distance-Based Activities
- Total distance
- Average/max speed
- Pace information
- Elevation gain

### Heart Rate Data
- Average heart rate
- Maximum heart rate
- Heart rate zones
- Time in each zone

### Strength Training Specific
- Sets and reps (when available)
- Weight lifted
- Rest periods
- Exercise progression

### Advanced Metrics
- Power data (cycling)
- Cadence (running/cycling)
- Training load/stress
- Weather conditions

## 🎨 User Interface

### Dashboard Integration
- **Recent Activities**: Shows last 5 activities with full details
- **Quick Stats**: Weekly summaries, averages, totals
- **Activity Feed**: All activities with type-specific icons and metrics

### Settings Page
- **Connection Status**: Clear visual of Strava connection
- **Sync Controls**: Manual sync button, auto-sync toggle
- **Marketing Copy**: Explains watch/device compatibility
- **Troubleshooting**: Error messages and help

### Activities Page
- **Complete History**: All synced activities with filtering
- **Rich Details**: Full metrics for each activity type
- **Visual Indicators**: Source badges, activity type icons

## 🔧 API Endpoints

### OAuth Flow
- `GET /api/strava/auth` - Initiate OAuth
- `GET /api/strava/callback` - Handle authorization
- `POST /api/strava/disconnect` - Remove connection

### Sync Operations
- `POST /api/strava/sync` - Manual sync trigger
- `POST /api/strava/webhook` - Real-time updates
- `GET /api/strava/status` - Connection status

### Data Access
- Activities via Supabase queries
- Real-time updates via webhooks
- Automatic token refresh

## 🔒 Security & Privacy

### Data Protection
- OAuth tokens encrypted in database
- Automatic token refresh
- User can disconnect anytime
- Data remains after disconnection (marked as imported)

### Privacy Controls
- User controls what activities to sync
- Option to disable auto-sync
- Activities marked with source (Strava, manual, etc.)

## 🚀 Marketing Messaging

### Key Value Props
1. **Universal Compatibility**: "Works with ANY fitness device"
2. **Zero Manual Entry**: "Never log a workout manually again"
3. **Real-Time Sync**: "New activities appear instantly"
4. **Complete Picture**: "All your fitness data in one place"

### Target Messaging
- **Apple Watch Users**: "Seamlessly import all your Apple Fitness+ workouts"
- **Garmin Users**: "Connect your Garmin and track everything automatically"
- **Multi-Device Users**: "Use any combination of devices - we sync it all"
- **Casual Users**: "Just use your phone - no special equipment needed"

## 🧪 Testing Checklist

### Setup Testing
- [ ] Strava app creation works
- [ ] Environment variables configured
- [ ] Database migration successful
- [ ] OAuth flow functional

### Connection Testing
- [ ] User can connect Strava account
- [ ] Activities import correctly
- [ ] Real-time sync works
- [ ] Disconnect flow works

### UI Testing
- [ ] Settings page shows connection status
- [ ] Dashboard displays activities
- [ ] Activities page shows full history
- [ ] Mobile responsive design

### Data Testing
- [ ] All activity types import correctly
- [ ] Heart rate data preserved
- [ ] Distance/pace calculations accurate
- [ ] Strength training data handled

## 🎯 Success Metrics

### Technical Metrics
- OAuth success rate > 95%
- Sync latency < 5 minutes
- API error rate < 1%
- Zero data loss

### User Experience
- Connection setup < 2 minutes
- Activities visible immediately
- Accurate data representation
- Intuitive UI/UX

### Business Impact
- Increased user engagement
- Reduced manual data entry
- Better workout tracking
- Higher retention rates

---

**Ready to Connect Any Fitness Device! 🔥**

This integration makes Wagner Coach compatible with virtually every fitness tracker, smartwatch, and workout app available. Users get a complete view of their fitness journey across all activities and devices.