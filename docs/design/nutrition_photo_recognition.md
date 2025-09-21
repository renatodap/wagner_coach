# Nutrition Photo Recognition - Feature Design

## User Story
As a user, I want to upload a photo of my meal, have the app automatically identify the food and estimate its nutritional content, so I can log meals quickly without manual typing.

## Acceptance Criteria

1. **Photo Upload Interface**
   - The meal logging form (`/nutrition/add`) includes a file input for photo uploads
   - Supports common image formats (JPEG, PNG, WebP)
   - Shows image preview after selection
   - Maximum file size: 10MB
   - Provides clear upload status indicators

2. **AI Recognition API**
   - An API route at `/api/nutrition/recognize` handles image uploads
   - Sends image to LogMeal API for analysis
   - Returns structured JSON with:
     - Detected food items
     - Nutritional information (calories, protein, carbs, fat)
     - Confidence scores
     - Portion size estimates
   - Handles API errors gracefully with fallback to manual entry

3. **Form Auto-Population**
   - Recognition results automatically populate form fields:
     - Meal name (concatenated food items)
     - Nutritional values
   - Shows confidence indicators for each recognized item
   - Allows user to edit any auto-populated data

4. **User Review & Confirmation**
   - Display recognized items in a review component
   - Show nutritional breakdown for each item
   - Allow removal of incorrectly identified items
   - Enable manual addition of missed items
   - Require explicit user confirmation before saving

5. **Security & Performance**
   - API key stored securely in environment variables
   - Image compression before upload (client-side)
   - Request rate limiting (10 requests per minute per user)
   - Response caching for identical images

## Technical Approach

### Frontend Components
- `PhotoUpload.tsx`: File input with preview and compression
- `PhotoRecognitionResult.tsx`: Display and edit recognition results
- `NutritionReview.tsx`: Review component for confirming data
- Update `MealLogForm.tsx` to integrate photo upload

### API Routes
- `/api/nutrition/recognize` (POST): Process image through LogMeal API
- `/api/nutrition/recognize/cache` (GET): Check cache for existing analysis

### External Integration
- LogMeal Food API (https://logmeal.com)
- API endpoints:
  - `/v2/recognition/complete` - Full dish recognition
  - `/v2/nutrition/recipe` - Nutritional analysis

### Type Definitions
```typescript
interface FoodRecognitionResult {
  imageId: string;
  foods: RecognizedFood[];
  totalNutrition: NutritionInfo;
  confidence: number;
}

interface RecognizedFood {
  name: string;
  quantity: number;
  unit: string;
  nutrition: NutritionInfo;
  confidence: number;
}

interface NutritionInfo {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}
```

### State Management
- Image upload state (loading, success, error)
- Recognition results state
- Form integration with existing meal form
- Optimistic UI updates during processing

## User Flow

1. User navigates to `/nutrition/add`
2. User clicks "Upload Photo" button
3. User selects image from device
4. Image preview appears with "Analyzing..." indicator
5. API processes image (2-3 seconds)
6. Recognition results display below image
7. User reviews and edits results
8. User confirms and saves meal

## Error Scenarios

1. **Network Error**: Show retry button, keep image preview
2. **API Error**: Fall back to manual entry, preserve image
3. **Invalid Image**: Show error message, clear selection
4. **Rate Limit**: Queue request, show wait time
5. **No Foods Detected**: Prompt for manual entry

## Environment Variables
```
LOGMEAL_API_KEY=your_api_key_here
LOGMEAL_API_URL=https://api.logmeal.com
NEXT_PUBLIC_MAX_IMAGE_SIZE=10485760  # 10MB in bytes
```

## Success Metrics
- Photo analysis completes in < 3 seconds
- Recognition accuracy > 80% for common foods
- User edits required < 20% of recognized items
- Feature adoption rate > 60% of meal logs

## Dependencies
- LogMeal API subscription
- Next.js Image component for optimization
- Browser File API for client-side compression
- React Hook Form integration

## Security Considerations
- Never expose API key to client
- Validate image file types server-side
- Sanitize recognition results before display
- Implement request signing for API calls
- Use HTTPS for all image transfers