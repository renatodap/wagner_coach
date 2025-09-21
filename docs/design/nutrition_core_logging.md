# Nutrition Core Logging - Feature Design

## User Story
"As a user, I want to manually log a meal with its name, category (breakfast, lunch, dinner, snack), and time, so I can keep a basic record of my diet."

## Acceptance Criteria

### Database Requirements
- [ ] A new `meals` table exists in Supabase with the following schema:
  - `id` (UUID, primary key)
  - `user_id` (UUID, foreign key to auth.users)
  - `name` (TEXT, required)
  - `meal_category` (ENUM: breakfast, lunch, dinner, snack, required)
  - `logged_at` (TIMESTAMPTZ, required)
  - `calories` (INTEGER, optional)
  - `protein_g` (DECIMAL, optional)
  - `carbs_g` (DECIMAL, optional)
  - `fat_g` (DECIMAL, optional)
  - `fiber_g` (DECIMAL, optional)
  - `notes` (TEXT, optional)
  - `created_at` (TIMESTAMPTZ, auto-generated)
  - `updated_at` (TIMESTAMPTZ, auto-generated)

### Security Requirements
- [ ] Row Level Security (RLS) is enabled on the `meals` table
- [ ] Users can only view, create, update, and delete their own meal records
- [ ] Appropriate indexes are created for performance (user_id, logged_at)

### User Interface Requirements
- [ ] A new page exists at `/nutrition/add` containing a meal logging form
- [ ] The form includes the following fields:
  - Meal name (text input, required)
  - Category (select dropdown, required)
  - Date and time (datetime picker, defaults to current time)
  - Optional macro fields (calories, protein, carbs, fat, fiber)
  - Notes (textarea, optional)
- [ ] Form validation provides clear error messages
- [ ] Successful submission shows a success message
- [ ] After submission, user is redirected to the nutrition dashboard

### Navigation Requirements
- [ ] A new "Nutrition" tab is added to the bottom navigation bar
- [ ] The nutrition icon is clearly visible and accessible
- [ ] The tab highlights when the user is on any nutrition-related page

### API Requirements
- [ ] POST endpoint at `/api/nutrition/meals` for creating new meal entries
- [ ] Request validation ensures all required fields are present
- [ ] Response includes the created meal record or appropriate error messages

## Technical Approach

### Frontend Stack
- **Framework**: Next.js 14 with App Router
- **UI Components**: React with TypeScript
- **Styling**: Tailwind CSS with the existing Iron theme
- **Form Management**: React Hook Form for validation and state
- **Date Picker**: Native HTML datetime-local input for simplicity

### Backend Stack
- **Database**: Supabase (PostgreSQL)
- **API**: Next.js API Routes
- **Authentication**: Supabase Auth (existing implementation)
- **Validation**: Zod schemas for type safety

### Data Flow
1. User navigates to `/nutrition/add` via bottom nav
2. Form is rendered with current datetime pre-filled
3. User enters meal details
4. On submit, form data is validated client-side
5. Valid data is sent to `/api/nutrition/meals`
6. API validates request and inserts into Supabase
7. Success response triggers redirect to dashboard
8. Error response displays inline error message

## UI/UX Considerations
- Mobile-first design matching existing app aesthetic
- Form fields are large and touch-friendly
- Category selector uses native select for accessibility
- Loading states during form submission
- Clear visual feedback for success/error states
- Consistent with existing Iron theme (black, orange, white, gray)

## Future Enhancements (Out of Scope)
- Barcode scanning for packaged foods
- Integration with food databases (MyFitnessPal, USDA)
- Meal templates and favorites
- Weekly/monthly nutrition reports
- Macro/calorie goals and tracking