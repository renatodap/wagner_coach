# Nutrition Core Logging - Feature Design

## User Story
As a user, I want to manually log a meal with its name, category (breakfast, lunch, dinner, snack), and time, so I can keep a basic record of my diet.

## Acceptance Criteria

1. **Database Schema**
   - A new `meals` table exists in Supabase with the following schema:
     - `id`: UUID (primary key)
     - `user_id`: UUID (foreign key to auth.users)
     - `meal_name`: TEXT (required)
     - `meal_category`: ENUM ('breakfast', 'lunch', 'dinner', 'snack') (required)
     - `logged_at`: TIMESTAMP WITH TIME ZONE (required)
     - `calories`: INTEGER (optional, for future use)
     - `protein_g`: FLOAT (optional, for future use)
     - `carbs_g`: FLOAT (optional, for future use)
     - `fat_g`: FLOAT (optional, for future use)
     - `notes`: TEXT (optional)
     - `created_at`: TIMESTAMP WITH TIME ZONE (auto-generated)
     - `updated_at`: TIMESTAMP WITH TIME ZONE (auto-updated)

2. **Security**
   - Row Level Security (RLS) is enabled on the `meals` table
   - Users can only view, create, update, and delete their own meals
   - Proper RLS policies are in place for CRUD operations

3. **User Interface**
   - A new page exists at `/nutrition/add` containing a form for manual meal entry
   - The form includes:
     - Text input for meal name (required)
     - Dropdown/radio for meal category (required)
     - Time picker for logged_at (defaults to current time)
     - Optional text area for notes
     - Submit button
     - Cancel button that returns to `/nutrition`
   - Form validation provides immediate feedback for required fields

4. **Navigation**
   - A new "Nutrition" icon is present in the main bottom navigation bar
   - The icon navigates to `/nutrition` (dashboard - placeholder for now)
   - The dashboard has a floating action button to navigate to `/nutrition/add`

5. **Data Submission**
   - Submitting the form successfully creates a new record in the `meals` table
   - Success provides user feedback (toast notification)
   - Error handling displays appropriate error messages
   - After successful submission, user is redirected to `/nutrition`

## Technical Approach

### Frontend Components
- `MealLogForm.tsx`: Main form component with state management
- `NutritionLayout.tsx`: Layout wrapper for nutrition pages
- Update `BottomNav.tsx` to include nutrition icon

### API Routes
- `/api/nutrition/meals` (POST): Create a new meal entry

### Database
- Supabase migration file for creating the `meals` table and RLS policies

### Type Definitions
- `Meal` interface for the complete meal object
- `MealInsert` interface for creating new meals
- `MealCategory` enum type

### State Management
- React Hook Form for form state and validation
- React Query for data fetching and caching
- Toast notifications for user feedback

## Dependencies
- Existing: React, Next.js, Supabase, React Hook Form, React Query
- New: None required

## Success Metrics
- Form submission successfully creates database records
- All tests pass with ≥80% coverage
- User can navigate between nutrition pages seamlessly
- Form validation prevents invalid submissions