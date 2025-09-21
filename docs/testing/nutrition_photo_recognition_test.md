# Nutrition Photo Recognition - Test Plan

## Test Categories

### 1. Unit Tests

#### PhotoUpload Component Tests (`components/nutrition/PhotoUpload.test.tsx`)

**Test Cases:**
1. **Component Rendering**
   - Should render file input button
   - Should display "Upload Photo" text
   - Should show accepted file types hint

2. **File Selection**
   - Should accept JPEG images
   - Should accept PNG images
   - Should accept WebP images
   - Should reject non-image files
   - Should reject files over 10MB
   - Should show image preview after selection
   - Should display file name and size

3. **Image Preview**
   - Should display selected image
   - Should show loading state during upload
   - Should allow image removal
   - Should clear preview on removal

4. **Error Handling**
   - Should show error for oversized files
   - Should show error for invalid file types
   - Should allow retry after error

#### PhotoRecognitionResult Component Tests (`components/nutrition/PhotoRecognitionResult.test.tsx`)

**Test Cases:**
1. **Results Display**
   - Should display all recognized food items
   - Should show nutritional values for each item
   - Should display confidence scores
   - Should show total nutrition summary

2. **User Interactions**
   - Should allow editing food names
   - Should allow adjusting quantities
   - Should allow removing items
   - Should recalculate totals on changes

3. **Confidence Indicators**
   - Should highlight high confidence (>80%) in green
   - Should show medium confidence (50-80%) in yellow
   - Should show low confidence (<50%) in red
   - Should sort items by confidence

4. **Loading States**
   - Should show skeleton loader during analysis
   - Should show progress indicator
   - Should handle timeout gracefully

### 2. Integration Tests

#### API Route Tests (`app/api/nutrition/recognize/route.test.ts`)

**Test Cases:**
1. **POST /api/nutrition/recognize**
   - Should accept valid image upload
   - Should reject non-image files
   - Should enforce file size limits
   - Should require authentication
   - Should call LogMeal API with correct parameters
   - Should transform API response correctly
   - Should handle API errors gracefully
   - Should implement retry logic for failures

2. **LogMeal API Integration**
   - Should send image as base64 or multipart
   - Should include required headers and auth
   - Should parse recognition response
   - Should handle partial recognition results
   - Should handle API rate limits

3. **Response Transformation**
   - Should map food items to internal format
   - Should aggregate nutritional data
   - Should calculate confidence scores
   - Should handle missing nutrition data

4. **Caching**
   - Should cache successful recognitions
   - Should return cached results for duplicate images
   - Should expire cache after 24 hours

#### Form Integration Tests (`components/nutrition/MealLogForm.integration.test.tsx`)

**Test Cases:**
1. **Photo Upload Flow**
   - Should show upload button in form
   - Should process image on selection
   - Should populate form with results
   - Should maintain manual entry option

2. **Data Flow**
   - Should pass image to recognition API
   - Should update form values with results
   - Should preserve user edits
   - Should submit combined data

### 3. End-to-End Tests

#### Complete Photo Recognition Flow (`e2e/nutrition-photo-recognition.test.ts`)

**Test Scenarios:**

1. **Happy Path - Recognize and Save Meal**
   ```
   1. User navigates to /nutrition/add
   2. User clicks "Upload Photo" button
   3. User selects a photo of a burger and fries
   4. System shows "Analyzing..." loader
   5. Recognition results appear:
      - Hamburger (450 cal)
      - French Fries (320 cal)
   6. User adjusts portion size for fries
   7. User adds "Diet Coke" manually
   8. User clicks "Save Meal"
   9. System saves meal with all items
   10. User redirected to /nutrition dashboard
   ```

2. **Error Recovery Flow**
   ```
   1. User uploads photo
   2. API returns error (service unavailable)
   3. System shows error message
   4. System keeps image preview
   5. User clicks "Retry"
   6. API succeeds on retry
   7. Results populate form
   ```

3. **Low Confidence Flow**
   ```
   1. User uploads blurry/unclear photo
   2. System returns low confidence results
   3. Warning message displayed
   4. User manually corrects items
   5. User saves corrected meal
   ```

4. **Mixed Recognition Flow**
   ```
   1. User uploads photo with multiple dishes
   2. System recognizes some items
   3. User removes incorrect items
   4. User adds missing items manually
   5. User confirms and saves
   ```

## Test Data

### Mock Recognition Response
```typescript
export const mockRecognitionSuccess = {
  imageId: 'img_123',
  foods: [
    {
      name: 'Grilled Chicken Breast',
      quantity: 150,
      unit: 'g',
      nutrition: {
        calories: 250,
        protein_g: 45,
        carbs_g: 0,
        fat_g: 5
      },
      confidence: 0.92
    },
    {
      name: 'Brown Rice',
      quantity: 100,
      unit: 'g',
      nutrition: {
        calories: 110,
        protein_g: 2.5,
        carbs_g: 23,
        fat_g: 0.9
      },
      confidence: 0.85
    }
  ],
  totalNutrition: {
    calories: 360,
    protein_g: 47.5,
    carbs_g: 23,
    fat_g: 5.9
  },
  confidence: 0.88
};

export const mockRecognitionLowConfidence = {
  ...mockRecognitionSuccess,
  confidence: 0.45,
  foods: mockRecognitionSuccess.foods.map(f => ({
    ...f,
    confidence: 0.4
  }))
};
```

### Test Images
```typescript
export const testImages = {
  valid: new File([''], 'meal.jpg', { type: 'image/jpeg' }),
  oversized: new File(['x'.repeat(11_000_000)], 'large.jpg', { type: 'image/jpeg' }),
  invalid: new File([''], 'document.pdf', { type: 'application/pdf' }),
  corrupt: new File(['corrupted'], 'bad.jpg', { type: 'image/jpeg' })
};
```

## Mock LogMeal API

```typescript
export const mockLogMealAPI = {
  recognize: jest.fn().mockResolvedValue(mockRecognitionSuccess),
  getNutrition: jest.fn().mockResolvedValue(mockNutritionData),
  reset: () => {
    mockLogMealAPI.recognize.mockClear();
    mockLogMealAPI.getNutrition.mockClear();
  }
};
```

## Test Coverage Requirements

- **Unit Tests**: ≥85% coverage for photo components
- **Integration Tests**: ≥80% coverage for recognition API
- **E2E Tests**: Cover all critical recognition paths
- **Overall**: ≥80% total coverage

## Performance Benchmarks

- Image compression: < 500ms for 5MB image
- API recognition: < 3000ms response time
- Form population: < 100ms after response
- Total flow: < 5 seconds end-to-end

## Accessibility Testing

- File input keyboard accessible
- Image preview has alt text
- Recognition results screen reader compatible
- Confidence scores have ARIA labels
- Error messages announced

## Security Testing

- API key not exposed in client
- File type validation server-side
- Image size limits enforced
- XSS prevention in food names
- CSRF protection on upload