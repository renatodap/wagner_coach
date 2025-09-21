# AI-Powered Meal Photo Recognition - Feature Design

## Overview
This feature enables users to take or upload photos of their meals and automatically extract nutritional information using AI vision models. The system will analyze food items, estimate portions, and populate meal data automatically.

## User Stories

### Primary User Stories

**US-AI-001: Photo Upload Interface**
- **As a** fitness app user
- **I want to** upload or take a photo of my meal
- **So that** I can quickly log nutritional information without manual entry

**US-AI-002: AI Food Recognition**
- **As a** fitness app user
- **I want the** AI to identify food items in my photo
- **So that** I don't have to manually search for and select foods

**US-AI-003: Portion Estimation**
- **As a** fitness app user
- **I want the** AI to estimate portion sizes from my photo
- **So that** I get accurate nutritional calculations without measuring

**US-AI-004: Nutritional Data Extraction**
- **As a** fitness app user
- **I want the** AI to automatically fill in calories, protein, carbs, fat, and fiber
- **So that** I can review and confirm the data before saving

**US-AI-005: Review and Edit Interface**
- **As a** fitness app user
- **I want to** review and edit the AI-generated meal data
- **So that** I can correct any mistakes or add missing information

### Secondary User Stories

**US-AI-006: Multiple Food Items**
- **As a** fitness app user
- **I want the** AI to identify multiple food items in a single photo
- **So that** I can log complex meals with one photo

**US-AI-007: Confidence Indicators**
- **As a** fitness app user
- **I want to** see how confident the AI is in its identification
- **So that** I know which items might need manual review

**US-AI-008: Learning from Corrections**
- **As a** fitness app user
- **I want the** system to learn from my corrections
- **So that** future recognitions become more accurate for my eating habits

## Technical Requirements

### AI Vision Integration

**Primary AI Service**: OpenAI GPT-4 Vision
- **Reason**: Excellent food recognition capabilities, natural language output
- **Backup**: Claude Vision API (Anthropic)
- **Input**: Image file (JPEG/PNG, max 10MB)
- **Output**: Structured JSON with food items and nutritional estimates

### Image Handling

**Upload Methods**:
1. **Camera Capture**: Direct photo taking via device camera
2. **File Upload**: Gallery/file system selection
3. **Drag & Drop**: Desktop browser support

**Image Processing**:
- **Format**: Accept JPEG, PNG, WebP
- **Size Limits**: 10MB max file size
- **Compression**: Auto-compress large images client-side
- **Storage**: Temporary storage in Supabase storage bucket

### Nutritional Database Integration

**Data Sources**:
1. **USDA FoodData Central**: Primary nutritional database
2. **Edamam Food Database**: Secondary source for branded foods
3. **Custom Database**: User-created and corrected entries

**Portion Estimation**:
- **Reference Objects**: Use common items (coin, phone, hand) for scale
- **Visual Cues**: Plate size, food density, container analysis
- **Default Portions**: Reasonable defaults when scale unclear

## UI/UX Design Specifications

### Photo Capture Interface

**Camera Component** (`components/nutrition/PhotoCapture.tsx`):
```typescript
interface PhotoCaptureProps {
  onPhotoCapture: (imageData: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}
```

**Features**:
- Live camera preview
- Capture button with haptic feedback
- Gallery access button
- Upload progress indicator
- Retake option

### AI Analysis Interface

**Processing Component** (`components/nutrition/AIAnalysis.tsx`):
```typescript
interface AIAnalysisProps {
  imageData: string;
  onAnalysisComplete: (mealData: AIAnalysisResult) => void;
  onError: (error: string) => void;
}

interface AIAnalysisResult {
  foodItems: Array<{
    name: string;
    quantity: string;
    confidence: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  }>;
  totalNutrition: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
  suggestedMealName: string;
  confidence: number;
}
```

**Features**:
- Loading animation during analysis
- Progress steps indicator
- Error handling with retry option
- Analysis time estimation

### Review and Edit Interface

**Review Component** (`components/nutrition/AIReview.tsx`):
```typescript
interface AIReviewProps {
  aiResult: AIAnalysisResult;
  originalImage: string;
  onConfirm: (finalMealData: MealInsert) => void;
  onReanalyze: () => void;
  onManualEdit: () => void;
}
```

**Features**:
- Side-by-side image and results view
- Individual food item editing
- Confidence score indicators
- Total nutrition summary
- Merge/split food items
- Add missing items manually

## API Design

### AI Analysis Endpoint

**Endpoint**: `POST /api/nutrition/analyze-photo`

**Request**:
```typescript
interface AnalyzePhotoRequest {
  imageData: string; // Base64 encoded image
  userId: string;
  mealCategory?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  includePortionHelp?: boolean;
}
```

**Response**:
```typescript
interface AnalyzePhotoResponse {
  success: boolean;
  data?: AIAnalysisResult;
  error?: string;
  analysisId: string; // For feedback/correction tracking
}
```

### Image Upload Endpoint

**Endpoint**: `POST /api/nutrition/upload-image`

**Features**:
- Multipart form data handling
- Image compression and optimization
- Temporary storage with expiration
- Security validation (image type, malware scan)

### Feedback Endpoint

**Endpoint**: `POST /api/nutrition/analysis-feedback`

**Purpose**: Collect user corrections to improve AI accuracy

```typescript
interface AnalysisFeedback {
  analysisId: string;
  corrections: Array<{
    originalItem: string;
    correctedItem: string;
    originalNutrition: NutritionData;
    correctedNutrition: NutritionData;
    correctionType: 'identification' | 'portion' | 'nutrition';
  }>;
  userSatisfaction: number; // 1-5 rating
}
```

## Database Schema Extensions

### Photo Analysis Table

```sql
CREATE TABLE meal_photo_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  meal_id UUID REFERENCES meals(id),
  image_url TEXT NOT NULL,
  ai_response JSONB NOT NULL,
  user_corrections JSONB,
  confidence_score FLOAT NOT NULL,
  processing_time_ms INTEGER NOT NULL,
  ai_service_used TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User AI Preferences Table

```sql
CREATE TABLE user_ai_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  preferred_portion_units TEXT DEFAULT 'imperial', -- 'metric' or 'imperial'
  dietary_restrictions TEXT[], -- ['vegetarian', 'gluten-free', etc.]
  common_foods TEXT[], -- Frequently eaten foods for better recognition
  correction_count INTEGER DEFAULT 0,
  satisfaction_rating FLOAT, -- Average user satisfaction
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Integration Points

### Existing MealLogForm Integration

**Enhancement**: `components/nutrition/MealLogForm.tsx`
- Add "Analyze Photo" button/tab
- Import AI analysis results
- Allow manual override of all AI suggestions
- Maintain existing manual entry workflow

### Navigation Integration

**Add Meal Page Enhancement**: `app/nutrition/add/page.tsx`
- Camera/upload option as primary entry method
- Quick manual entry as secondary option
- Recent analysis history for re-use

### Nutrition Dashboard Integration

**Dashboard Enhancement**: `app/nutrition/page.tsx`
- Show photo thumbnails with logged meals
- "Analyze Similar Photo" quick action
- AI accuracy feedback prompts

## Error Handling and Edge Cases

### AI Service Failures

**Fallback Strategy**:
1. **Primary**: OpenAI GPT-4 Vision
2. **Secondary**: Claude Vision API
3. **Tertiary**: Manual entry with optional Google Image Search suggestions

**Error Types**:
- Service unavailable (503)
- Rate limit exceeded (429)
- Invalid image format (400)
- No food detected (422)
- Low confidence analysis (200 with warnings)

### Image Quality Issues

**Validation**:
- Minimum resolution check (640x480)
- Blur detection algorithm
- Lighting adequacy assessment
- Food visibility validation

**User Guidance**:
- Real-time capture tips
- Retake suggestions with specific feedback
- Optimal lighting recommendations
- Portion reference object suggestions

### Privacy and Security

**Image Storage**:
- Temporary storage only (24-hour expiration)
- No permanent image retention
- User-controlled deletion option
- No sharing with third parties

**AI Processing**:
- No image data retention by AI providers
- Anonymized analysis requests
- No personal identifying information in prompts

## Success Metrics

### Accuracy Metrics

**AI Recognition Accuracy**:
- **Target**: >80% food identification accuracy
- **Measure**: User confirmation rate of AI suggestions

**Nutritional Estimation Accuracy**:
- **Target**: ±15% of actual values for major macros
- **Measure**: Comparison with user corrections

### User Experience Metrics

**Adoption Rate**:
- **Target**: 60% of new meal logs use photo analysis
- **Measure**: Photo vs manual entry ratio

**Time Savings**:
- **Target**: 50% reduction in meal logging time
- **Measure**: Average time from photo to saved meal

**User Satisfaction**:
- **Target**: 4.2/5 average rating
- **Measure**: In-app feedback prompts

### Technical Performance

**Processing Speed**:
- **Target**: <10 seconds from upload to analysis results
- **Measure**: Server-side timing metrics

**Success Rate**:
- **Target**: 95% successful analysis completion
- **Measure**: Error rate monitoring

## Implementation Phases

### Phase 1: Basic Photo Analysis (Week 1)
- Camera capture component
- OpenAI Vision integration
- Basic food identification
- Simple review interface

### Phase 2: Nutritional Integration (Week 2)
- USDA database integration
- Portion estimation algorithms
- Full meal form integration
- Error handling improvements

### Phase 3: Enhanced Features (Week 3)
- Multiple food item detection
- Confidence scoring
- User correction feedback system
- Performance optimizations

### Phase 4: Learning and Polish (Week 4)
- User preference learning
- Advanced portion estimation
- UI/UX refinements
- Comprehensive testing

## Acceptance Criteria

### Definition of Done

**Feature Complete When**:
✅ Users can capture/upload meal photos
✅ AI accurately identifies food items (>80% accuracy)
✅ Nutritional data auto-populates in meal form
✅ Users can review and edit AI suggestions
✅ Analysis completes in <10 seconds
✅ All error cases handled gracefully
✅ Privacy and security requirements met
✅ Integration with existing meal logging workflow
✅ Comprehensive test coverage (>80%)
✅ User feedback collection system implemented

**Quality Gates**:
- Manual testing with 20+ diverse food photos
- Performance testing under load
- Security audit of image handling
- Accessibility compliance (WCAG 2.1 AA)
- Mobile responsiveness across devices

This feature will significantly enhance the user experience by reducing the friction of meal logging while maintaining the accuracy and control that serious fitness enthusiasts require.