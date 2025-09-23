# Wagner Coach - Complete Application Documentation

> **Last Updated:** September 23, 2025
> **Version:** 0.1.0 (MVP)
> **Platform:** Progressive Web App (Next.js 15.5.3)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Core Features](#core-features)
5. [Database Schema](#database-schema)
6. [API Integrations](#api-integrations)
7. [User Journey](#user-journey)
8. [Component Library](#component-library)
9. [Security & Privacy](#security--privacy)
10. [Deployment Status](#deployment-status)
11. [Future Roadmap](#future-roadmap)

---

## 📊 Executive Summary

**Wagner Coach** (formerly "Iron Discipline MVP") is a comprehensive AI-powered fitness coaching platform that combines:

- **AI Coaching**: Conversational fitness coaching using OpenAI and Google Gemini
- **Workout Tracking**: Custom workout creation, active session tracking, and performance analytics
- **Activity Integration**: Automatic sync with Strava and Garmin for universal device compatibility
- **Nutrition Management**: Photo-based meal logging with AI analysis and macro tracking
- **Progress Analytics**: Comprehensive dashboards showing workout history, nutrition trends, and goal progress

### **Target Audience**
- Fitness enthusiasts seeking personalized AI coaching
- Athletes tracking cross-training activities (strength, cardio, recovery)
- Busy professionals wanting efficient, time-optimized workouts
- Health-conscious individuals managing nutrition and fitness together

---

## 🛠 Technology Stack

### **Frontend**
- **Framework**: Next.js 15.5.3 (React 19.1.0)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **UI Components**: Radix UI primitives (dialogs, dropdowns, tabs, etc.)
- **Markdown**: react-markdown with remark-gfm for rich text
- **Date Handling**: date-fns

### **Backend & Infrastructure**
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **File Storage**: Supabase Storage (meal photos, user content)
- **API Routes**: Next.js API routes (serverless functions)
- **Python Backend**: Flask API for Garmin integration (`/python-backend`)

### **AI & ML**
- **AI SDK**: Vercel AI SDK (@ai-sdk/openai)
- **LLM Providers**:
  - OpenAI GPT-4/3.5 (coaching, meal analysis)
  - Google Gemini (@google/generative-ai) for photo analysis
- **RAG System**: Custom implementation with nutrition and workout context

### **Third-Party Integrations**
- **Strava API**: Activity sync, OAuth authentication
- **Garmin Connect**: Health metrics, activity import (via Python)
- **OpenRouter**: Alternative LLM routing
- **DOMPurify**: XSS protection (isomorphic-dompurify)

### **Development & Testing**
- **Testing**: Jest 30 + React Testing Library
- **Linting**: ESLint 9 with Next.js config
- **Build**: Next.js with Turbopack (--turbopack flag)
- **Package Manager**: npm

---

## 🏗 Architecture Overview

### **Application Structure**

```
wagner-coach-clean/
├── app/                          # Next.js App Router pages
│   ├── activities/               # Activity tracking & management
│   ├── analytics/                # Performance dashboards
│   ├── auth/                     # Authentication & onboarding
│   ├── coach/                    # AI coach chat interface
│   ├── dashboard/                # Main user dashboard
│   ├── nutrition/                # Meal logging & tracking
│   ├── profile/                  # User profile & goals
│   ├── quick-entry/              # Fast meal/workout logging
│   ├── settings/                 # User settings & integrations
│   ├── workout/                  # Active workout sessions
│   └── workouts/                 # Workout library & builder
├── components/                   # React components
│   ├── ui/                       # shadcn/ui base components
│   ├── nutrition/                # Meal logging components
│   ├── analytics/                # Chart & visualization components
│   ├── profile/                  # Profile setup steps
│   └── Coach/                    # AI coach UI components
├── lib/                          # Core utilities & services
│   ├── ai/                       # AI integration & prompts
│   ├── supabase/                 # Database clients & types
│   ├── services/                 # Business logic services
│   ├── types/                    # TypeScript type definitions
│   └── utils/                    # Helper functions
├── hooks/                        # Custom React hooks
├── python-backend/               # Python Flask API (Garmin)
├── supabase/                     # Database migrations & config
│   └── migrations/               # SQL migration files
├── public/                       # Static assets
├── scripts/                      # Utility scripts
└── docs/                         # Documentation
```

### **Key Design Patterns**

1. **Server Components First**: Leverages Next.js 15 React Server Components for performance
2. **API Route Handlers**: Serverless functions for third-party integrations
3. **Row Level Security (RLS)**: Database-level access control per user
4. **Progressive Web App (PWA)**: Installable on mobile with web manifest
5. **RAG Architecture**: Retrieval-Augmented Generation for contextualized AI coaching

---

## 🎯 Core Features

### 1. **AI Coach** (`/coach`)

#### **Implementation**
- **Chat Interface**: Real-time conversational AI using streaming responses
- **Context Awareness**: RAG system pulls user's workout history, nutrition data, goals, and progress
- **Multi-Model Support**:
  - OpenAI GPT-4 for complex coaching
  - Google Gemini for quick responses and photo analysis
- **Conversation Persistence**: Messages stored in `ai_conversations` table
- **Quick Actions**: Predefined prompts for common questions

#### **Key Files**
- `app/coach/page.tsx` - Main chat UI
- `app/api/chat/route.ts` - Streaming chat endpoint
- `lib/ai/rag.ts` - RAG context retrieval
- `lib/ai/coaching-prompts.ts` - System prompts
- `components/Coach/MessageBubble.tsx` - Message rendering

#### **Features**
- ✅ Streaming responses for real-time feedback
- ✅ Markdown rendering with code blocks, lists, tables
- ✅ Context from last 30 days of workouts and nutrition
- ✅ Personal records and goal tracking integration
- ✅ Session management with conversation history
- ✅ Quick action buttons for common queries

---

### 2. **Workout System**

#### **A. Workout Library** (`/workouts`)

**Pre-built Workouts**:
- Push/Pull/Legs splits
- Full body routines
- Strength-focused programs
- Beginner to advanced difficulty levels
- Estimated duration and descriptions

**Workout Types**:
- `push`, `pull`, `legs`, `upper`, `lower`, `full_body`, `core`, `arms`, `shoulders`, `chest`, `back`, `cardio`

**Database Tables**:
- `workouts` - Workout templates
- `workout_exercises` - Exercise list per workout
- `exercises` - Exercise database with muscle groups

**Key Features**:
- ✅ Search and filter (type, difficulty, duration)
- ✅ Favorite workouts tracking
- ✅ Popularity scoring based on completion count
- ✅ Descriptions and workout goals

#### **B. Workout Builder** (`/workouts/builder`)

**Features**:
- ✅ Create custom workouts from scratch
- ✅ Exercise selection from database
- ✅ Set/rep/weight configuration
- ✅ Rest period customization
- ✅ Exercise ordering with drag-drop
- ✅ Save as template for reuse

**Implementation**:
- `app/workouts/builder/page.tsx` - Builder UI
- `lib/services/workout-flow-service.ts` - Workout logic

#### **C. Active Workout Sessions** (`/workout/active/[sessionId]`)

**Real-time Tracking**:
- ✅ Set-by-set performance logging
- ✅ Rest timer between sets
- ✅ Weight/rep entry with auto-save
- ✅ Pause/resume functionality
- ✅ Session duration tracking
- ✅ Personal record detection
- ✅ Post-workout rating and notes

**Database**:
- `active_workout_sessions` - Live sessions
- `set_performances` - Individual set data
- `user_workouts` - Scheduled/completed workouts
- `workout_completions` - Summary records

**Key Files**:
- `app/workout/active/[sessionId]/page.tsx` - Active session UI
- `app/api/workouts/[id]/start/route.ts` - Session initialization

#### **D. Workout Selection** (`/workout`)

**Intelligent Selection**:
- ✅ Shows favorited workouts first
- ✅ Displays average ratings and completion counts
- ✅ Quick start workflow
- ✅ Preview workout exercises before starting
- ✅ Filter by type, difficulty, max duration

---

### 3. **Activity Tracking** (`/activities`)

#### **Strava Integration**

**OAuth Flow**:
1. User clicks "Connect Strava" in settings
2. Redirects to Strava authorization
3. Callback stores access/refresh tokens (encrypted)
4. Auto-imports last 30 activities
5. Webhook subscription for real-time updates

**Data Synced**:
- All activity types (running, cycling, swimming, strength, yoga, etc.)
- Duration, distance, pace, elevation
- Heart rate data and zones
- Calories, training load
- Activity name, description, date

**Database Tables**:
- `strava_connections` - OAuth tokens and athlete info
- `activities` - Unified activity records
- `activity_segments` - Laps, intervals, splits
- `activity_streams` - Time-series data (HR, power, cadence)

**Key Features**:
- ✅ Universal device compatibility (any watch/app that syncs to Strava)
- ✅ Automatic sync via webhooks
- ✅ Manual sync trigger
- ✅ Activity deduplication
- ✅ Public/private activity visibility
- ✅ Link activities to workouts

**Implementation**:
- `app/api/strava/auth/route.ts` - OAuth initiation
- `app/api/strava/callback/route.ts` - Token exchange
- `app/api/strava/webhook/route.ts` - Real-time updates
- `lib/strava-api.ts` - API client
- `components/StravaConnection.tsx` - UI component

#### **Garmin Integration** (Partial Implementation)

**Status**: Python backend scaffolded, UI connected, needs completion

**Planned Features**:
- Session-based authentication (1-year token)
- Daily health metrics (steps, sleep, HRV)
- Activity import with deduplication
- Training readiness scores
- Body Battery and stress levels

**Files**:
- `python-backend/` - Flask API for Garmin Connect
- `components/GarminConnection.tsx` - Connection UI
- `app/api/garmin/*` - Proxy endpoints

#### **Activity Browse** (`/activities`)

**Features**:
- ✅ Complete activity history
- ✅ Filter by type, date range, source
- ✅ Detailed view per activity
- ✅ Edit activity details
- ✅ Delete activities
- ✅ Link to associated workouts
- ✅ Public workouts browse page

**Public Activities** (`/workouts/browse`):
- ✅ Browse community workouts marked as public
- ✅ Filter and search functionality
- ✅ Copy workouts to personal library

---

### 4. **Nutrition Management** (`/nutrition`)

#### **A. Meal Logging**

**Entry Methods**:
1. **Photo Upload**: AI analyzes meal photos for food items and macros
2. **Manual Entry**: Search food database or custom entries
3. **Quick Entry**: Common foods with saved portions

**AI Analysis**:
- Google Gemini vision API for photo recognition
- Identifies food items with portions
- Estimates macros (protein, carbs, fat, calories)
- Provides confidence scores
- Allows manual adjustment

**Database Tables**:
- `meals` - Meal records with macros
- `meal_foods` - Individual food items per meal
- `food_database` - Comprehensive food database
- `photo_analysis` - AI analysis results
- `nutrition_goals` - User macro targets

**Key Features**:
- ✅ Photo-based meal logging with camera integration
- ✅ AI macro estimation and food recognition
- ✅ Manual macro entry and editing
- ✅ Meal type categorization (breakfast, lunch, dinner, snack)
- ✅ Notes and meal descriptions
- ✅ Photo storage in Supabase
- ✅ Daily nutrition summary dashboard

**Implementation**:
- `app/nutrition/add/page.tsx` - Meal entry form
- `app/api/nutrition/analyze-photo/route.ts` - AI photo analysis
- `components/nutrition/PhotoCapture.tsx` - Camera component
- `components/nutrition/MealLogForm.tsx` - Entry form
- `components/nutrition/AIAnalysis.tsx` - Analysis display
- `lib/ai/meal-parser.ts` - Meal parsing logic

#### **B. Nutrition Dashboard** (`/nutrition`)

**Features**:
- ✅ Daily macro totals vs goals
- ✅ Visual progress bars (protein, carbs, fat, calories)
- ✅ Recent meals list with photos
- ✅ Weekly nutrition trends
- ✅ Quick meal re-logging

**Components**:
- `components/nutrition/NutritionDashboard.tsx` - Main dashboard
- `components/nutrition/DailySummary.tsx` - Macro summary
- `components/nutrition/MealList.tsx` - Meal history

#### **C. Food Database** (`/nutrition/foods`)

**Features**:
- ✅ Search 1000+ common foods
- ✅ Custom food creation
- ✅ Serving size management
- ✅ Nutrition info per serving

---

### 5. **User Profile & Goals** (`/profile`)

#### **Onboarding Flow** (`/auth/onboarding`)

**Multi-Step Setup**:
1. **Basic Info**: Name, age, height, weight
2. **Goals**: Build muscle, lose weight, gain strength
3. **Preferences**: Workout frequency, session length
4. **Equipment**: Available gym equipment
5. **Personalization**: Experience level, injuries, preferences

**Database**:
- `profiles` - Core user profile
- `profile_goals` - Current fitness goals with targets and deadlines
- `equipment_access` - Available equipment per user

**Implementation**:
- `app/auth/onboarding/page.tsx` - Onboarding flow
- `components/profile/steps/*.tsx` - Individual steps

#### **Profile Management** (`/profile`)

**Features**:
- ✅ View and edit personal info
- ✅ Update fitness goals
- ✅ Track progress toward goals
- ✅ View personal records
- ✅ Stats and achievements

**Goal Tracking**:
- Target weight, body fat %, strength milestones
- Deadline and progress tracking
- AI coach integration for goal-specific advice

---

### 6. **Analytics Dashboard** (`/analytics`)

#### **Workout Analytics**

**Metrics Tracked**:
- ✅ Workout completion rate
- ✅ Average workout duration
- ✅ Total volume (sets × reps × weight)
- ✅ Frequency per week/month
- ✅ Workout type distribution
- ✅ Personal record progression

**Visualizations**:
- Line charts for volume trends
- Bar charts for workout frequency
- Progress indicators for goals
- Heatmaps for consistency

**Implementation**:
- `app/analytics/page.tsx` - Analytics dashboard
- `components/analytics/WorkoutAnalytics.tsx` - Charts

#### **Nutrition Analytics**

**Metrics**:
- ✅ Daily macro totals
- ✅ Weekly averages
- ✅ Goal adherence percentage
- ✅ Calorie trends over time
- ✅ Macro distribution pie charts

---

### 7. **Quick Entry** (`/quick-entry`)

**Fast Logging**:
- ✅ Streamlined meal/workout entry
- ✅ Minimal UI for speed
- ✅ Saved templates for recurring entries
- ✅ One-tap logging for common items

---

### 8. **Settings & Integrations** (`/settings`)

#### **User Settings**

**Preferences**:
- ✅ Units (imperial/metric)
- ✅ Notification settings
- ✅ Privacy controls
- ✅ Account management

#### **Integrations**

**Connected Services**:
- ✅ Strava (OAuth, connection status, disconnect)
- ⏳ Garmin (in progress)
- 🔮 Future: Apple Health, Google Fit, MyFitnessPal

**Implementation**:
- `app/settings/page.tsx` - Settings page
- `components/StravaConnection.tsx` - Strava connection UI
- `components/GarminConnection.tsx` - Garmin connection UI
- `components/IntegrationsSection.tsx` - Integration hub

---

## 🗄 Database Schema

### **Core Tables**

#### **Authentication & Profiles**
```sql
profiles (
  id UUID PRIMARY KEY,                    -- Supabase auth user ID
  full_name TEXT,
  age INTEGER,
  height_cm DECIMAL,
  weight_kg DECIMAL,
  goal TEXT,                              -- 'build_muscle', 'lose_weight', 'gain_strength'
  experience_level TEXT,                  -- 'beginner', 'intermediate', 'advanced'
  onboarding_completed BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

profile_goals (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  goal_type TEXT,                         -- 'weight', 'body_fat', 'strength', 'endurance'
  target_value DECIMAL,
  current_value DECIMAL,
  deadline DATE,
  status TEXT,                            -- 'active', 'completed', 'abandoned'
  created_at TIMESTAMPTZ
)

equipment_access (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  equipment_name TEXT,
  has_access BOOLEAN
)
```

#### **Workouts**
```sql
workouts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,                              -- 'push', 'pull', 'legs', etc.
  goal TEXT,                              -- 'build_muscle', 'gain_strength', 'all'
  difficulty TEXT,                        -- 'beginner', 'intermediate', 'advanced'
  estimated_duration_minutes INTEGER,
  duration_minutes INTEGER,               -- Legacy field
  description TEXT,
  popularity_score INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,        -- For community sharing
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ
)

exercises (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  muscle_group TEXT[],                    -- Array of muscle groups
  equipment_needed TEXT[],
  difficulty TEXT,
  description TEXT,
  video_url TEXT
)

workout_exercises (
  id SERIAL PRIMARY KEY,
  workout_id INTEGER REFERENCES workouts(id),
  exercise_id INTEGER REFERENCES exercises(id),
  order_index INTEGER,
  sets INTEGER,
  reps INTEGER,
  rest_seconds INTEGER,
  notes TEXT
)

user_workouts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  workout_id INTEGER REFERENCES workouts(id),
  scheduled_date DATE,
  status TEXT,                            -- 'scheduled', 'active', 'completed', 'skipped'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT
)

active_workout_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  user_workout_id INTEGER REFERENCES user_workouts(id),
  workout_id INTEGER REFERENCES workouts(id),
  status TEXT,                            -- 'active', 'paused', 'completed'
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  total_pause_duration_seconds INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

set_performances (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES active_workout_sessions(id),
  user_id UUID REFERENCES profiles(id),
  exercise_id INTEGER REFERENCES exercises(id),
  set_number INTEGER,
  reps INTEGER,
  weight_kg DECIMAL,
  rpe INTEGER,                            -- Rate of Perceived Exertion (1-10)
  notes TEXT,
  created_at TIMESTAMPTZ
)

workout_completions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  workout_id INTEGER REFERENCES workouts(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  workout_rating INTEGER,                 -- 1-5 stars
  created_at TIMESTAMPTZ
)

favorite_workouts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  workout_id INTEGER REFERENCES workouts(id),
  created_at TIMESTAMPTZ,
  UNIQUE(user_id, workout_id)
)

personal_records (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  exercise_id INTEGER REFERENCES exercises(id),
  record_type TEXT,                       -- '1rm', 'max_reps', 'total_volume'
  value DECIMAL,
  achieved_date DATE,
  previous_record DECIMAL,
  created_at TIMESTAMPTZ
)
```

#### **Activities (Strava/Garmin)**
```sql
strava_connections (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  athlete_id BIGINT,
  access_token TEXT,                      -- Encrypted
  refresh_token TEXT,                     -- Encrypted
  expires_at TIMESTAMPTZ,
  scope TEXT,
  athlete_data JSONB,                     -- Name, profile photo, etc.
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id)
)

activities (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  strava_id BIGINT,                       -- NULL if manual entry
  activity_type TEXT,                     -- 'run', 'ride', 'swim', 'strength', etc.
  name TEXT,
  description TEXT,
  start_date TIMESTAMPTZ,
  distance_meters DECIMAL,
  moving_time_seconds INTEGER,
  elapsed_time_seconds INTEGER,
  total_elevation_gain DECIMAL,
  calories DECIMAL,
  average_speed DECIMAL,
  max_speed DECIMAL,
  average_heartrate INTEGER,
  max_heartrate INTEGER,
  suffer_score INTEGER,                   -- Strava metric
  external_id TEXT,                       -- For deduplication
  source TEXT,                            -- 'strava', 'garmin', 'manual'
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

activity_segments (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER REFERENCES activities(id),
  segment_type TEXT,                      -- 'lap', 'interval', 'split'
  distance_meters DECIMAL,
  moving_time_seconds INTEGER,
  average_speed DECIMAL,
  average_heartrate INTEGER,
  order_index INTEGER
)

activity_streams (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER REFERENCES activities(id),
  stream_type TEXT,                       -- 'heartrate', 'cadence', 'power', 'altitude'
  data JSONB,                             -- Time-series array
  resolution TEXT                         -- 'low', 'medium', 'high'
)

garmin_connections (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  username TEXT,
  encrypted_password TEXT,                -- AES-256 encrypted
  session_token TEXT,
  session_expires_at TIMESTAMPTZ,
  last_sync TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id)
)
```

#### **Nutrition**
```sql
nutrition_goals (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  calories_target INTEGER,
  protein_grams_target INTEGER,
  carbs_grams_target INTEGER,
  fat_grams_target INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ
)

meals (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  meal_type TEXT,                         -- 'breakfast', 'lunch', 'dinner', 'snack'
  meal_time TIMESTAMPTZ,
  total_calories INTEGER,
  total_protein_grams INTEGER,
  total_carbs_grams INTEGER,
  total_fat_grams INTEGER,
  notes TEXT,
  photo_url TEXT,                         -- Supabase storage URL
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

meal_foods (
  id SERIAL PRIMARY KEY,
  meal_id INTEGER REFERENCES meals(id),
  food_name TEXT,
  portion_size TEXT,
  calories INTEGER,
  protein_grams INTEGER,
  carbs_grams INTEGER,
  fat_grams INTEGER,
  created_at TIMESTAMPTZ
)

food_database (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  serving_size TEXT,
  calories INTEGER,
  protein_grams INTEGER,
  carbs_grams INTEGER,
  fat_grams INTEGER,
  category TEXT,                          -- 'protein', 'carb', 'fat', 'vegetable', etc.
  barcode TEXT,
  created_at TIMESTAMPTZ
)

photo_analysis (
  id SERIAL PRIMARY KEY,
  meal_id INTEGER REFERENCES meals(id),
  photo_url TEXT,
  analysis_result JSONB,                  -- AI response with food items
  confidence_score DECIMAL,
  model_used TEXT,                        -- 'gemini', 'gpt-4-vision', etc.
  created_at TIMESTAMPTZ
)
```

#### **AI Coach**
```sql
ai_conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  messages JSONB,                         -- Array of message objects
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### **Database Functions**

```sql
-- Toggle favorite workout (returns new favorite status)
toggle_favorite_workout(p_user_id UUID, p_workout_id INTEGER) RETURNS BOOLEAN

-- Start workout session (creates user_workout and active_session)
start_workout_session(p_user_id UUID, p_workout_id INTEGER) RETURNS INTEGER

-- Pause/resume workout
toggle_workout_pause(p_session_id INTEGER) RETURNS TEXT

-- Search workouts with filters
search_workouts(
  p_search_term TEXT,
  p_type TEXT,
  p_difficulty TEXT,
  p_max_duration INTEGER,
  p_favorites_only BOOLEAN,
  p_user_id UUID
) RETURNS TABLE (...)
```

### **Views**

```sql
-- Popular workouts ranked by usage
popular_workouts

-- User's favorite workouts with details
user_favorite_workouts

-- Active workout sessions with user/workout info
user_active_sessions
```

---

## 🔌 API Integrations

### **1. Strava API**

**OAuth 2.0 Flow**:
- Authorization URL: `https://www.strava.com/oauth/authorize`
- Token endpoint: `https://www.strava.com/oauth/token`
- Scopes: `read,activity:read_all,activity:write`

**API Endpoints Used**:
- `GET /athlete` - Athlete profile
- `GET /athlete/activities` - Activity list (pagination)
- `GET /activities/{id}` - Activity details
- `GET /activities/{id}/streams` - Time-series data
- `POST /push_subscriptions` - Webhook setup
- `POST /activities` - Create/update activity

**Rate Limits**:
- 100 requests per 15 minutes
- 1000 requests per day

**Implementation**:
- Token storage with automatic refresh
- Webhook-based real-time sync
- Activity deduplication logic
- Error handling and retry logic

### **2. Garmin Connect** (Partial)

**Authentication**:
- Username/password (no official OAuth)
- Session token with 1-year expiry
- AES-256 encrypted credential storage

**Python Library**: `garmin-connect` (v1.6.2)

**Data Retrieved**:
- Daily summaries (steps, calories, sleep)
- Activities (all types)
- Heart rate variability (HRV)
- Training readiness
- Device battery status

**Status**: Backend scaffolded, needs completion

### **3. OpenAI API**

**Models Used**:
- `gpt-4` - Complex coaching, detailed analysis
- `gpt-3.5-turbo` - Quick responses, chat
- `gpt-4-vision` - Potential meal photo analysis

**Features**:
- Streaming responses via SDK
- Function calling for workout suggestions
- Temperature tuning per use case
- Token usage tracking

### **4. Google Gemini API**

**Models**:
- `gemini-1.5-flash` - Fast photo analysis
- `gemini-pro-vision` - Detailed meal recognition

**Use Cases**:
- Meal photo analysis (primary)
- Food item recognition
- Portion estimation
- Macro calculation

---

## 👤 User Journey

### **New User Onboarding**

1. **Sign Up** (`/auth`)
   - Email/password via Supabase Auth
   - Social auth (Google, Apple) - if enabled

2. **Onboarding** (`/auth/onboarding`)
   - Step 1: Basic info (name, age, height, weight)
   - Step 2: Goals (muscle, weight loss, strength)
   - Step 3: Preferences (frequency, duration)
   - Step 4: Equipment access
   - Step 5: Personalization (experience, injuries)

3. **Dashboard** (`/dashboard`)
   - Welcome message
   - Quick actions (start workout, log meal, chat with coach)
   - Recent activities
   - Progress overview

### **Daily Usage Flow**

#### **Morning Routine**
1. Check dashboard for today's recommended workout
2. Review nutrition goals for the day
3. Ask AI coach about workout strategy

#### **Workout Time**
1. Browse workout library (`/workouts`)
2. Select or create workout
3. Start active session (`/workout/active/[id]`)
4. Log sets in real-time
5. Complete with rating and notes

#### **Meal Logging**
1. Open nutrition page (`/nutrition/add`)
2. Take photo of meal or manually enter
3. Review AI analysis
4. Adjust macros if needed
5. Save meal

#### **Evening Check-in**
1. View analytics (`/analytics`)
2. Chat with AI coach about progress
3. Plan next day's workout

### **Weekly/Monthly**
1. Review progress in analytics
2. Update goals in profile
3. Connect new integrations (Strava, Garmin)
4. Browse community workouts

---

## 🧩 Component Library

### **UI Primitives** (`components/ui/`)

Built on **Radix UI** + **Tailwind CSS**:
- `button.tsx` - Button variants (default, outline, ghost, destructive)
- `input.tsx` - Text inputs with validation states
- `select.tsx` - Dropdown selects
- `dialog.tsx` - Modals and dialogs
- `tabs.tsx` - Tabbed interfaces
- `card.tsx` - Card containers
- `avatar.tsx` - User avatars
- `badge.tsx` - Status badges
- `progress.tsx` - Progress bars
- `checkbox.tsx` - Checkboxes
- `textarea.tsx` - Multi-line text inputs
- `label.tsx` - Form labels
- `skeleton.tsx` - Loading skeletons
- `switch.tsx` - Toggle switches
- `dropdown-menu.tsx` - Context menus
- `calendar.tsx` - Date pickers
- `tooltip.tsx` - Tooltips
- `alert.tsx` - Alert messages
- `collapsible.tsx` - Expandable sections
- `popover.tsx` - Popovers

### **Feature Components**

#### **Nutrition**
- `PhotoCapture.tsx` - Camera UI for meal photos
- `MealLogForm.tsx` - Meal entry form
- `AIAnalysis.tsx` - AI analysis results display
- `AIReview.tsx` - Review and edit AI suggestions
- `DailySummary.tsx` - Daily macro summary
- `MealList.tsx` - Meal history
- `FoodSearch.tsx` - Food database search
- `MealBuilder.tsx` - Multi-item meal builder
- `QuickMealEntry.tsx` - Fast meal logging
- `NutritionDashboard.tsx` - Main nutrition page

#### **Workouts**
- `WorkoutAnalytics.tsx` - Workout charts and stats
- `ActivityList.tsx` - Activity feed
- `ActivityWorkoutLink.tsx` - Link activities to workouts

#### **Integrations**
- `StravaConnection.tsx` - Strava OAuth and status
- `GarminConnection.tsx` - Garmin connection UI
- `IntegrationsSection.tsx` - Settings integration hub

#### **AI Coach**
- `MessageBubble.tsx` - Chat message display
- `QuickActions.tsx` - Quick action buttons

#### **Profile**
- `ProfileView.tsx` - Profile display
- `BasicInfoStep.tsx` - Onboarding step 1
- `GoalsStep.tsx` - Onboarding step 2
- `PreferencesStep.tsx` - Onboarding step 3
- `EquipmentStep.tsx` - Onboarding step 4
- `PersonalizationStep.tsx` - Onboarding step 5

#### **General**
- `QuickEntry.tsx` - Quick logging UI

---

## 🔒 Security & Privacy

### **Authentication**
- **Provider**: Supabase Auth
- **Methods**: Email/password, magic links, OAuth (Google, Apple)
- **Session Management**: JWT tokens, HTTP-only cookies
- **Password Requirements**: Min 6 characters (configurable)

### **Authorization**
- **Row Level Security (RLS)**: Enabled on all user tables
- **Policies**: User can only access their own data (`auth.uid() = user_id`)
- **API Routes**: Protected with Supabase server client

### **Data Protection**
- **Encryption at Rest**: Supabase handles database encryption
- **Encrypted Fields**:
  - Strava tokens (access_token, refresh_token)
  - Garmin credentials (AES-256)
- **File Storage**: Supabase Storage with RLS policies
- **XSS Prevention**: DOMPurify for user-generated content
- **SQL Injection**: Parameterized queries via Supabase client

### **Privacy Controls**
- **Activity Visibility**: Public/private toggle per activity
- **Workout Sharing**: Opt-in for community sharing
- **Data Export**: Manual export via Supabase (needs UI)
- **Account Deletion**: Cascade deletes (needs completion)

### **API Security**
- **CORS**: Configured for app domain only
- **Rate Limiting**: Implemented on API routes
- **Environment Variables**: Never exposed to client
- **Token Rotation**: Automatic refresh for OAuth tokens

### **Compliance Gaps** ⚠️
- ❌ No Privacy Policy
- ❌ No Terms of Service
- ❌ No GDPR data export UI
- ❌ No account deletion flow
- ❌ No cookie consent banner
- ❌ No data retention policy

---

## 🚀 Deployment Status

### **Current Status: Development (PWA)**

**Platform**: Progressive Web App (not native mobile)

**Hosting**:
- Frontend: Likely Vercel (Next.js default)
- Database: Supabase Cloud
- Storage: Supabase Storage
- Python Backend: Needs deployment (Vercel serverless functions or separate host)

### **Build Configuration**

**Next.js Config** (`next.config.ts`):
```typescript
{
  typescript: {
    ignoreBuildErrors: true,  // ⚠️ Should be fixed
  },
  eslint: {
    ignoreDuringBuilds: true, // ⚠️ Should be fixed
  }
}
```

**Scripts** (`package.json`):
- `npm run dev` - Development with Turbopack
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - ESLint check
- `npm test` - Jest tests

### **Environment Variables Required**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Strava
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=
STRAVA_VERIFY_TOKEN=

# OpenAI
OPENAI_API_KEY=

# Google Gemini
GEMINI_API_KEY=

# OpenRouter (optional)
OPENROUTER_API_KEY=
```

### **Mobile App Requirements**

To submit to **App Store** or **Google Play**, needs:
1. **Native wrapper**: Capacitor or Expo
2. **App icons**: All required sizes
3. **Screenshots**: 6-8 different sizes
4. **Legal docs**: Privacy Policy, Terms, EULA
5. **Age rating**: Proper content rating
6. **Push notifications**: Native implementation
7. **Permissions**: Camera, health data (if used)

---

## 🗺 Future Roadmap

### **High Priority** (Next 3-6 Months)

1. **Legal Compliance** (Critical)
   - Privacy Policy
   - Terms of Service
   - GDPR data export/deletion
   - Age verification
   - Health disclaimers

2. **Garmin Integration** (Complete)
   - Finish Python backend
   - UI completion
   - Real-time sync
   - Health metrics dashboard

3. **Enhanced Nutrition** (Issue #7)
   - Meal timing recommendations
   - Macro balancing AI suggestions
   - Meal planning integration
   - Performance-nutrition correlation

4. **Training Plans** (Issue #8)
   - AI-generated periodized plans
   - Goal-specific programming
   - Progressive overload tracking
   - Deload week scheduling

5. **User Testimonials** (Issue #16)
   - Success story collection
   - Before/after photos
   - Segmented testimonials (beginners, executives, etc.)
   - Landing page optimization

6. **Behavioral Psychology** (Issue #17)
   - Mindset assessment
   - Habit formation tools
   - Mental resilience training
   - CBT techniques for fitness

### **Medium Priority** (6-12 Months)

7. **Executive Features** (Issue #18)
   - Time-efficient "exercise snacks"
   - Calendar integration
   - Business metric correlation
   - Premium tier features

8. **Recovery & Sleep** (Issue #9)
   - Sleep tracking
   - HRV integration
   - Training readiness scoring
   - Recovery recommendations

9. **Advanced Analytics** (Issue #12)
   - Training stress analysis
   - Performance predictions
   - Comparative analytics
   - Interactive dashboards

10. **Social Features** (Issue #10)
    - Training groups
    - Challenges and competitions
    - Achievement badges
    - Community leaderboards

11. **Injury Prevention** (Issue #11)
    - Pain tracking
    - Movement screening
    - Injury risk analysis
    - Rehab protocols

### **Low Priority** (12+ Months)

12. **Strava Feature Parity** (Issue #4)
    - Power data, cadence
    - Kudos and comments
    - Segments and leaderboards
    - Route builder

13. **Wearable Integration** (Issue #13)
    - Native mobile apps (iOS/Android)
    - Apple Watch app
    - Real-time workout guidance
    - Apple Health/Google Fit sync

14. **Coaching Marketplace** (Issue #14)
    - Human coach collaboration
    - Certification system
    - Booking and payments
    - Hybrid AI + human coaching

15. **Advanced Workout Features** (Issue #15)
    - Video exercise library
    - AI form analysis
    - Advanced timers
    - AR/VR experiences

16. **Holistic Wellness** (Issue #19)
    - Supplement recommendations
    - Sleep optimization
    - Expert practitioner network
    - Holistic health approach

17. **Lifestyle System** (Issue #20)
    - Philosophical framework ("Iron Will")
    - Daily rituals and routines
    - Purpose and vision tools
    - Motivational content system

---

## 📊 Key Metrics & KPIs

### **User Engagement**
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Workout completion rate
- Meal logging frequency
- AI coach interaction rate
- Session duration

### **Feature Adoption**
- % users connecting Strava/Garmin
- % users creating custom workouts
- % users logging nutrition
- % users completing onboarding
- Favorite workouts per user

### **Performance**
- Page load time (target: <2s)
- AI response time (target: <3s)
- Sync latency (target: <30s)
- Error rate (target: <1%)
- Uptime (target: 99.9%)

### **Business (Future)**
- Conversion rate (free to paid)
- Monthly Recurring Revenue (MRR)
- Churn rate
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)

---

## 🐛 Known Issues & Technical Debt

### **Critical**
- ❌ TypeScript errors ignored in build (`ignoreBuildErrors: true`)
- ❌ ESLint errors ignored in build (`ignoreDuringBuilds: true`)
- ❌ No error boundary for React errors
- ❌ Garmin integration incomplete

### **High Priority**
- ⚠️ No comprehensive test coverage
- ⚠️ Missing loading states on many pages
- ⚠️ No offline support (PWA caching)
- ⚠️ No push notifications
- ⚠️ File upload size limits not enforced consistently

### **Medium Priority**
- ⚠️ Some components missing accessibility (ARIA labels)
- ⚠️ No internationalization (i18n)
- ⚠️ API rate limiting needs improvement
- ⚠️ Database indexes could be optimized
- ⚠️ Image optimization for meal photos

### **Low Priority**
- ⚠️ Code splitting could be improved
- ⚠️ Some duplicate code between components
- ⚠️ Legacy database columns (`duration_minutes` vs `estimated_duration_minutes`)

---

## 📚 Documentation Files

### **Existing Docs**
- `README.md` - Basic setup instructions
- `FEATURE_ROADMAP.md` - Detailed feature planning (1045 lines)
- `STRAVA_INTEGRATION.md` - Strava setup guide
- `AI_COACH_SETUP.md` - AI coach configuration
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `ARCHITECTURE_ANALYSIS.md` - Architecture overview
- `USER_FLOW_ANALYSIS.md` - User journey mapping
- `FEATURE_VERIFICATION_CHECKLIST.md` - QA checklist
- `APPLY_MIGRATION_GUIDE.md` - Database migration guide
- `SUPABASE_CLI_GUIDE.md` - Supabase CLI usage

### **SQL Files**
- `RUN_THIS_IN_SUPABASE.sql` - Main setup script (345 lines)
- `ADD_WORKOUTS_TO_SUPABASE.sql` - Sample workout data
- `ENFORCE_WORKOUTS_WITH_EXERCISES.sql` - Data integrity
- `FIX_RLS_PERMISSIONS.sql` - Security policies
- `WORKOUT_PROGRESS_SYSTEM.sql` - Progress tracking
- Various migration files in `supabase/migrations/`

---

## 🔧 Development Setup

### **Prerequisites**
- Node.js 20+
- npm or yarn
- Supabase account
- Strava developer account
- OpenAI API key
- Google Gemini API key

### **Quick Start**

```bash
# Clone repo
git clone <repo-url>
cd wagner-coach-clean

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your keys

# Run database migrations
# (Follow SUPABASE_CLI_GUIDE.md)

# Start development server
npm run dev

# Open http://localhost:3000
```

### **Testing**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### **Building**

```bash
# Production build
npm run build

# Start production server
npm run start
```

---

## 🎨 Design System

### **Color Palette**
- Primary: Tailwind default (customizable)
- Accent: Based on workout types
- Neutral: Gray scale for text and backgrounds
- Success: Green for completed actions
- Warning: Yellow for alerts
- Error: Red for errors

### **Typography**
- Font: Geist (via next/font)
- Headings: Bold, larger sizes
- Body: Regular weight, readable sizes
- Code: Monospace for technical content

### **Spacing**
- Based on Tailwind spacing scale (4px increments)
- Consistent padding/margins via design tokens

### **Responsive Breakpoints**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px
- Mobile-first design approach

---

## 🏆 Competitive Advantages

1. **AI-First Coaching**: Deep integration of LLMs with fitness context
2. **Universal Device Sync**: Works with any fitness tracker via Strava
3. **Comprehensive Nutrition**: Photo-based logging with AI analysis
4. **Workout Flexibility**: Both pre-built and custom workout support
5. **Real-Time Tracking**: Live workout sessions with set-by-set logging
6. **Privacy-Focused**: User data isolation with RLS
7. **Progressive Web App**: No app store required, works everywhere

---

## 📞 Support & Contact

### **For Developers**
- Issues: GitHub issues (repo link needed)
- Docs: This file + `/docs` directory
- Architecture questions: See `ARCHITECTURE_ANALYSIS.md`

### **For Users**
- Help: `/help` page (needs creation)
- Feedback: Feedback form (needs creation)
- Support email: (needs setup)

---

## 📝 Changelog

### **v0.1.0 - Current MVP**
- ✅ AI coaching with RAG context
- ✅ Workout library and builder
- ✅ Active workout sessions
- ✅ Strava integration
- ✅ Nutrition logging with AI photo analysis
- ✅ User profiles and goals
- ✅ Analytics dashboard
- ✅ Mobile-responsive PWA

### **Next Release (v0.2.0) - Planned**
- 🔮 Garmin integration completion
- 🔮 Legal compliance (Privacy Policy, ToS)
- 🔮 Training plan generator
- 🔮 Enhanced AI nutrition coaching
- 🔮 User testimonials system

---

## 🙏 Credits

### **Technologies**
- Next.js - Vercel
- Supabase - Open source Firebase alternative
- OpenAI - LLM provider
- Google Gemini - AI vision
- Strava API - Activity sync
- Radix UI - Component primitives
- Tailwind CSS - Utility-first CSS
- shadcn/ui - Component library

### **Open Source Libraries**
- react-markdown - Markdown rendering
- date-fns - Date utilities
- axios - HTTP client
- garmin-connect - Garmin API wrapper
- isomorphic-dompurify - XSS protection
- Jest & React Testing Library - Testing

---

**End of Documentation**

*This documentation represents the complete state of Wagner Coach as of September 2025. For updates, see the changelog and roadmap sections.*