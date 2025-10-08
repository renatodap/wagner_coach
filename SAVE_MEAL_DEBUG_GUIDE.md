# Save Meal Button - Debugging Guide

## Summary of Findings

I've investigated the "Save Meal" button on the `/nutrition/log` page and made the following discoveries:

### ✅ What's Working

1. **Backend is Running & Healthy**
   - Production backend: `https://fitness-backend-production-5e77.up.railway.app`
   - Health status: ✅ Healthy
   - Database: ✅ Connected
   - API endpoint `/api/v1/meals` POST: ✅ Exists and properly configured

2. **Frontend Configuration**
   - ✅ `NEXT_PUBLIC_API_BASE_URL` correctly points to Railway backend
   - ✅ Form properly collects meal data (type, time, notes, foods)
   - ✅ API client function `createMeal()` exists and is properly implemented

3. **CORS Configuration**
   - ✅ Backend has `ALLOW_ALL_ORIGINS = True` (allows all origins)
   - ✅ No CORS blocking issues expected

4. **Database Schema**
   - ✅ `meal_logs` table exists
   - ✅ `meal_foods` table exists with relational structure
   - ✅ Database triggers exist for auto-calculating nutrition totals

### 🔧 Changes Made

I've added **comprehensive debug logging** to help diagnose the issue:

#### Frontend Logging (`app/nutrition/log/page.tsx`)
- 🔵 Logs when `handleSubmit` is called
- 🔵 Logs food count and validation
- 🔵 Logs Supabase session retrieval
- 📝 Logs prepared meal data
- 🤖 Logs which API path is used (coach vs normal)
- ✅ Logs successful meal creation
- ❌ Logs detailed error information
- 🏁 Logs completion

#### API Client Logging (`lib/api/meals.ts`)
- 🌐 Logs request URL
- 📤 Logs request body (formatted JSON)
- 🔑 Logs token (first 20 characters for security)
- 📥 Logs response status and headers
- ✅ Logs success response
- ❌ Logs error response body

---

## How to Test the Fix

### Step 1: Open Your Browser

1. Navigate to `http://localhost:3005` (or whichever port your frontend is running on)
2. Log in if not already authenticated
3. **Open Browser DevTools** (F12 or Right-click → Inspect)
4. Go to the **Console** tab

### Step 2: Navigate to Meal Log Page

1. Go to `/nutrition/log` page
2. You should see the meal logging form

### Step 3: Add a Test Meal

1. Select a meal type (e.g., "Breakfast")
2. Keep the default time or adjust it
3. Click "Search & Add Foods"
4. Search for a food (e.g., "chicken")
5. Add at least one food item
6. Optionally add notes

### Step 4: Click "Save Meal" and Monitor Console

Click the **"Save Meal"** button and watch the console output. You should see a sequence like this:

```
🔵 [Meal Log] handleSubmit called
🔵 [Meal Log] Foods count: 1
🔵 [Meal Log] Getting Supabase session...
✅ [Meal Log] Session obtained, token length: XXX
📝 [Meal Log] Meal data prepared: { category: 'breakfast', logged_at: '2025-10-08T...', foods_count: 1, notes_length: 0 }
💾 [Meal Log] Using createMeal API (normal flow)
🌐 [Meal Log] API Base URL: https://fitness-backend-production-5e77.up.railway.app
🌐 [createMeal] Making request to: https://fitness-backend-production-5e77.up.railway.app/api/v1/meals
📤 [createMeal] Request body: { ... }
🔑 [createMeal] Token (first 20 chars): eyJhbGciOiJIUzI1NiIsI...
📥 [createMeal] Response status: 201 Created
📥 [createMeal] Response headers: { ... }
✅ [createMeal] Meal created successfully: { id: 'xxx', ... }
🎉 [Meal Log] Setting success state
🔀 [Meal Log] Redirecting to: /nutrition
🏁 [Meal Log] handleSubmit finished
```

### Expected Outcomes

#### ✅ Success Scenario

If the meal saves successfully:
- Console shows all ✅ green checkmarks
- Success screen appears: "Meal Logged Successfully!"
- Page redirects to `/nutrition` after 1.5 seconds
- Meal appears in nutrition history

#### ❌ Error Scenarios

If there's an error, the console will show:
- ❌ Red error logs with detailed information
- Error message displayed on screen
- Button becomes clickable again

Common errors and what they mean:

| Error Message | What It Means | Solution |
|--------------|---------------|----------|
| "Not authenticated" | User is not logged in or session expired | Log in again |
| "Failed to create meal" | Backend request failed | Check network tab, verify backend is accessible |
| "Token has expired" | JWT token expired | Log in again |
| "Please add at least one food item" | Form validation failed | Add at least one food |
| Network error | Can't reach backend | Check internet connection, verify backend URL |

---

## Debugging Steps

### If You See Errors in Console:

1. **Copy the full error log** from console
2. **Check the Network tab** in DevTools:
   - Find the request to `/api/v1/meals`
   - Click on it to see request/response details
   - Check the status code (should be 201 for success)
   - Check the response body

3. **Common Issues to Check**:

   **Authentication Issues**:
   - Are you logged in?
   - Is the token valid (check console for token length)
   - Try logging out and back in

   **Network Issues**:
   - Is backend accessible? Try visiting: https://fitness-backend-production-5e77.up.railway.app/health
   - Check if you have internet connection
   - Check if Railway backend is down (check Railway dashboard)

   **Data Issues**:
   - Are food items valid (do they have `food_id`, `quantity`, `unit`)?
   - Is the meal type valid (breakfast, lunch, dinner, snack)?
   - Is the date/time in correct format?

4. **Backend Logs** (if you have access to Railway):
   - Go to Railway dashboard
   - Check the backend logs for errors
   - Look for the request from your user_id

---

## What the Debug Logs Tell Us

### Request Flow

1. **Frontend validates form** → "handleSubmit called"
2. **Gets authentication token** → "Session obtained"
3. **Prepares meal data** → "Meal data prepared"
4. **Calls API** → "Making request to..."
5. **Receives response** → "Response status: 201" (success) or error
6. **Updates UI** → "Setting success state" or error state

### Key Information in Logs

- **Token length**: Should be >100 characters (JWT token)
- **Foods count**: Should be ≥1
- **API URL**: Should be `https://fitness-backend-production-5e77.up.railway.app/api/v1/meals`
- **Response status**: Should be `201 Created` for success
- **Meal ID**: If successful, you'll see the created meal's UUID

---

## Next Steps

### If Meal Saves Successfully ✅

Congratulations! The feature is working. The debug logs can be removed or reduced for production.

### If You Still See Errors ❌

**Send me the following information:**

1. **Full console logs** (copy everything from browser console)
2. **Network tab details** for the `/api/v1/meals` request:
   - Request URL
   - Status code
   - Request headers
   - Request payload
   - Response body
3. **Screenshots** of the error message on screen
4. **Steps to reproduce** the issue

---

## Technical Details

### Backend Architecture

```
POST /api/v1/meals
↓
meals.py endpoint (auth middleware)
↓
MealLoggingServiceV2.create_meal()
↓
1. Creates meal_log entry (totals = 0)
2. Inserts meal_foods entries (with nutrition)
3. Database triggers calculate totals
4. Returns meal with foods and totals
```

### Database Triggers

Migration `007_fix_meal_nutrition_calculations.sql` creates:

1. **`calculate_meal_food_nutrition()`** trigger
   - Runs BEFORE INSERT/UPDATE on `meal_foods`
   - Calculates nutrition based on food data and quantity
   - Handles unit conversions (g, oz, cup, etc.)

2. **`update_meal_log_totals()`** trigger
   - Runs AFTER INSERT/UPDATE/DELETE on `meal_foods`
   - Sums all meal_foods nutrition into meal_logs totals
   - Updates `total_calories`, `total_protein_g`, etc.

### API Request Format

```json
POST /api/v1/meals
Headers:
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

Body:
{
  "category": "breakfast",
  "logged_at": "2025-10-08T12:30:00Z",
  "notes": "Post-workout meal",
  "foods": [
    {
      "food_id": "uuid-of-food",
      "quantity": 6,
      "unit": "oz"
    }
  ]
}
```

### Expected Response (Success)

```json
{
  "id": "meal-uuid",
  "user_id": "user-uuid",
  "category": "breakfast",
  "logged_at": "2025-10-08T12:30:00Z",
  "notes": "Post-workout meal",
  "total_calories": 450.0,
  "total_protein_g": 35.0,
  "total_carbs_g": 25.0,
  "total_fat_g": 15.0,
  "total_fiber_g": 2.0,
  "foods": [
    {
      "food_id": "uuid-of-food",
      "name": "Chicken Breast",
      "brand_name": null,
      "quantity": 6,
      "unit": "oz",
      "calories": 450.0,
      "protein_g": 35.0,
      ...
    }
  ],
  "source": "manual",
  "created_at": "2025-10-08T12:30:15Z",
  "updated_at": "2025-10-08T12:30:15Z"
}
```

---

## Files Modified

1. **`wagner-coach-clean/app/nutrition/log/page.tsx`**
   - Added debug logging to `handleSubmit()` function
   - Logs: form validation, session, API calls, success/error states

2. **`wagner-coach-clean/lib/api/meals.ts`**
   - Added debug logging to `createMeal()` function
   - Logs: request URL, body, headers, response details

---

## Cleanup (Optional)

After confirming the feature works, you can:

1. **Keep the logs** (recommended for production debugging)
2. **Reduce log verbosity** (keep only errors)
3. **Remove logs entirely** (if everything works perfectly)

To remove logs, search for `console.log`, `console.error`, `console.warn` in:
- `wagner-coach-clean/app/nutrition/log/page.tsx`
- `wagner-coach-clean/lib/api/meals.ts`

---

**Last Updated**: October 8, 2025
**Version**: 1.0
**Status**: Debug logging added, ready for testing
