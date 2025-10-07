# Coach Meal Preview Integration - Complete Documentation

**Date**: 2025-10-07
**Status**: ✅ Frontend Complete | ⚠️ Backend Needs Food Matching

---

## 🎯 Objective

When a user inputs a meal log inside the unified coach (e.g., "I ate chicken and rice"), the preview UI must be the **exact same** as the manual meal logging page (`/nutrition/log`) but with AI-detected fields already filled in.

---

## ✅ What's Been Implemented (Frontend)

### 1. New Component: `MealLogPreview.tsx`

**Location**: `components/Coach/MealLogPreview.tsx`

**Key Features**:
- **Identical UI** to `/nutrition/log/page.tsx`
- Uses `FoodSearchV2` for autocomplete food search
- Uses `MealEditor` for food list with add/remove/edit
- Same meal type selector (breakfast/lunch/dinner/snack)
- Same time picker (datetime-local)
- Same notes field (Textarea, max 500 chars)
- Same dark gradient styling (from-iron-black to-neutral-900)
- Pre-fills all fields from AI-detected data
- Fully editable before saving

**Interface**:
```typescript
interface MealLogPreviewProps {
  initialData: {
    primary_fields: {
      meal_type?: string
      meal_name?: string
      foods?: Array<{
        food_id?: string
        name: string
        quantity?: number
        unit?: string
        serving_size?: number
        serving_unit?: string
        calories?: number
        protein_g?: number
        carbs_g?: number
        fat_g?: number
        fiber_g?: number
      }>
      logged_at?: string
      notes?: string
    }
  }
  onSave: (editedData: any) => Promise<void>
  onCancel: () => void
}
```

### 2. Integration with `UnifiedCoachClient.tsx`

**Changes**:
- Added import: `import { MealLogPreview } from './MealLogPreview'`
- Replaced meal preview rendering (lines 968-993)
- Conditional rendering:
  ```typescript
  {pendingLogPreview.preview.log_type === 'meal' ? (
    <MealLogPreview
      initialData={pendingLogPreview.preview.data}
      onSave={handleConfirmLog}
      onCancel={handleCancelLog}
    />
  ) : (
    // Use old QuickEntryPreview for other types
  )}
  ```

### 3. Build Status

✅ **Build passes with zero errors**
- All TypeScript types correct
- All imports resolved
- No syntax errors
- Ready for deployment

---

## ⚠️ What Needs Implementation (Backend)

### Food Matching System

The backend meal parser currently returns food names as strings (e.g., `["chicken", "rice"]`), but the new UI requires **full food objects** with nutrition data from the `foods_enhanced` database.

### Required Backend Changes

#### 1. Food Search/Matching Service

**File**: `wagner-coach-backend/app/services/food_matching_service.py` (NEW)

**Purpose**: Match AI-detected food descriptions to database entries

**Key Functions**:

```python
async def match_food_description(
    description: str,
    supabase_client,
    confidence_threshold: float = 0.7
) -> Optional[Dict]:
    """
    Match a food description to foods_enhanced database.

    Args:
        description: AI-detected food name (e.g., "chicken", "grilled chicken breast")
        supabase_client: Supabase client instance
        confidence_threshold: Minimum similarity score (0-1)

    Returns:
        Food object with full nutrition data, or None if no match

    Example:
        Input: "chicken"
        Output: {
            "food_id": "uuid-chicken-breast",
            "name": "Chicken Breast, Grilled",
            "brand_name": null,
            "quantity": 1,
            "unit": "serving",
            "serving_size": 100,
            "serving_unit": "g",
            "calories": 165,
            "protein_g": 31,
            "carbs_g": 0,
            "fat_g": 3.6,
            "fiber_g": 0
        }
    """
    # Implementation:
    # 1. Clean/normalize description
    # 2. Search foods_enhanced with text similarity
    # 3. Use trigram similarity or full-text search
    # 4. Return best match above threshold
    # 5. Return None if no good match (user must search manually)
    pass

async def match_multiple_foods(
    descriptions: List[str],
    supabase_client
) -> List[Dict]:
    """
    Match multiple food descriptions at once.

    Returns list of matched foods (may be empty for some descriptions).
    """
    matched_foods = []
    for description in descriptions:
        match = await match_food_description(description, supabase_client)
        if match:
            matched_foods.append(match)
        else:
            # Return partial food object for manual completion
            matched_foods.append({
                "food_id": f"temp-{uuid.uuid4()}",
                "name": description.title(),
                "quantity": 1,
                "unit": "serving",
                "serving_size": 100,
                "serving_unit": "g",
                "calories": 0,
                "protein_g": 0,
                "carbs_g": 0,
                "fat_g": 0,
                "fiber_g": 0
            })
    return matched_foods
```

#### 2. Update Meal Parser Service

**File**: `wagner-coach-backend/app/services/meal_parser_service.py` (MODIFY)

**Changes Needed**:

```python
# BEFORE (current):
async def parse_meal_from_text(text: str, llm_client) -> Dict:
    """Parse meal from text description."""
    # ... AI parsing logic ...
    return {
        "meal_type": "lunch",
        "meal_name": "Chicken and Rice",
        "foods": ["chicken", "rice"],  # ❌ Just strings
        "calories": 450,
        "protein_g": 35
    }

# AFTER (required):
async def parse_meal_from_text(
    text: str,
    llm_client,
    supabase_client
) -> Dict:
    """Parse meal from text description with food matching."""
    # ... AI parsing logic ...

    # NEW: Match foods to database
    food_descriptions = ["chicken", "rice"]
    matched_foods = await match_multiple_foods(food_descriptions, supabase_client)

    return {
        "meal_type": "lunch",
        "meal_name": "Chicken and Rice",
        "foods": matched_foods,  # ✅ Full food objects
        "logged_at": datetime.utcnow().isoformat(),
        "notes": "Detected from: 'I ate chicken and rice'"
    }
```

#### 3. Database Query for Food Matching

**SQL Query** (using PostgreSQL text search):

```sql
-- Option 1: Trigram similarity (requires pg_trgm extension)
SELECT
    id as food_id,
    name,
    brand_name,
    serving_size,
    serving_unit,
    calories,
    protein_g,
    carbs_g,
    fat_g,
    fiber_g
FROM foods_enhanced
WHERE
    similarity(name, 'chicken breast') > 0.3
    OR name ILIKE '%chicken breast%'
ORDER BY
    similarity(name, 'chicken breast') DESC,
    quality_score DESC
LIMIT 5;

-- Option 2: Full-text search (simpler, no extension needed)
SELECT
    id as food_id,
    name,
    brand_name,
    serving_size,
    serving_unit,
    calories,
    protein_g,
    carbs_g,
    fat_g,
    fiber_g
FROM foods_enhanced
WHERE
    name ILIKE '%chicken%'
    OR name ILIKE '%breast%'
ORDER BY
    quality_score DESC,
    CASE
        WHEN name ILIKE 'chicken breast%' THEN 1
        WHEN name ILIKE '%chicken breast%' THEN 2
        ELSE 3
    END
LIMIT 5;
```

#### 4. Update API Response Schema

**File**: `wagner-coach-backend/app/models/responses.py` (MODIFY)

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class DetectedFood(BaseModel):
    """A single detected food item with nutrition data."""
    food_id: str
    name: str
    brand_name: Optional[str] = None
    quantity: float = 1.0
    unit: str = "serving"
    serving_size: float
    serving_unit: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    confidence: Optional[float] = None  # Match confidence (0-1)

class MealLogPreview(BaseModel):
    """AI-detected meal log preview."""
    log_type: str = "meal"
    confidence: float
    data: dict

    class Config:
        json_schema_extra = {
            "example": {
                "log_type": "meal",
                "confidence": 0.95,
                "data": {
                    "primary_fields": {
                        "meal_type": "lunch",
                        "meal_name": "Chicken and Rice",
                        "logged_at": "2025-10-07T12:30:00Z",
                        "notes": "Detected from user message",
                        "foods": [
                            {
                                "food_id": "uuid-chicken-breast",
                                "name": "Chicken Breast, Grilled",
                                "quantity": 1,
                                "unit": "serving",
                                "serving_size": 100,
                                "serving_unit": "g",
                                "calories": 165,
                                "protein_g": 31,
                                "carbs_g": 0,
                                "fat_g": 3.6,
                                "fiber_g": 0
                            },
                            {
                                "food_id": "uuid-white-rice",
                                "name": "White Rice, Cooked",
                                "quantity": 1,
                                "unit": "cup",
                                "serving_size": 158,
                                "serving_unit": "g",
                                "calories": 205,
                                "protein_g": 4.3,
                                "carbs_g": 44.5,
                                "fat_g": 0.4,
                                "fiber_g": 0.6
                            }
                        ]
                    }
                }
            }
        }
```

---

## 🔄 Complete User Flow

### 1. User Input
**User**: "I ate chicken and rice for lunch"

### 2. AI Detection
**Backend** (`/api/v1/coach/chat`):
1. AI detects this is a meal log
2. Extracts: meal_type="lunch", foods=["chicken", "rice"]
3. **NEW**: Matches foods to database:
   - "chicken" → "Chicken Breast, Grilled" (165 cal, 31g protein)
   - "rice" → "White Rice, Cooked" (205 cal, 4.3g protein)
4. Returns preview with full food objects

### 3. Preview Display
**Frontend** (`MealLogPreview`):
1. Shows dark themed preview UI
2. Pre-fills:
   - Meal type: Lunch ✓
   - Time: Now (default)
   - Foods: 2 items with full nutrition
   - Totals: 370 cal, 35.3g protein
3. User can:
   - Edit quantities (change "1 serving" to "200g")
   - Remove foods (delete rice)
   - Add more foods (search "broccoli" and add)
   - Change meal type
   - Add notes

### 4. User Edits (Optional)
**User Actions**:
- Searches "broccoli" → Adds "Broccoli, Cooked" (55 cal, 3.7g protein)
- Changes chicken quantity to 200g (doubles nutrition)
- Adds note: "Post-workout lunch"

### 5. Save
**Frontend → Backend**:
```json
{
  "meal_type": "lunch",
  "logged_at": "2025-10-07T12:30:00Z",
  "notes": "Post-workout lunch",
  "foods": [
    {
      "food_id": "uuid-chicken-breast",
      "quantity": 2,
      "unit": "serving"
    },
    {
      "food_id": "uuid-white-rice",
      "quantity": 1,
      "unit": "cup"
    },
    {
      "food_id": "uuid-broccoli",
      "quantity": 1,
      "unit": "cup"
    }
  ]
}
```

**Backend** (`confirmLog`):
1. Validates data
2. Recalculates nutrition from food_ids
3. Saves to `meal_logs` table
4. Returns success

### 6. Confirmation
**Frontend**:
1. Closes preview
2. Shows success message
3. Updates chat with confirmation

---

## 🧪 Testing Plan

### Frontend Testing (Manual)

**Test Case 1: Basic Meal Detection**
1. Open coach page
2. Type: "I ate chicken and rice"
3. Verify: MealLogPreview appears with dark theme
4. Verify: Meal type shows "lunch" (or default)
5. Verify: Foods list shows 2 items
6. Verify: Totals calculate correctly

**Test Case 2: Editing Before Save**
1. Trigger meal preview
2. Click Edit on chicken
3. Change quantity to 200g
4. Verify: Totals update in real-time
5. Search for "broccoli"
6. Add broccoli
7. Verify: 3 foods in list
8. Click Save
9. Verify: Success confirmation

**Test Case 3: Cancel Preview**
1. Trigger meal preview
2. Click Cancel
3. Verify: Preview closes
4. Verify: No meal saved

**Test Case 4: Empty Foods Handling**
1. Trigger meal preview with no matched foods
2. Verify: "No foods added yet" message
3. Verify: Save button disabled
4. Search and add food manually
5. Verify: Can now save

### Backend Testing (When Implemented)

**Test Case 1: Food Matching**
```bash
# Test direct food search
curl -X POST http://localhost:8000/api/v1/foods/match \
  -H "Content-Type: application/json" \
  -d '{"description": "chicken"}'

# Expected:
{
  "food_id": "uuid-chicken-breast",
  "name": "Chicken Breast, Grilled",
  "calories": 165,
  ...
}
```

**Test Case 2: Meal Parsing with Matching**
```bash
# Test meal parser with food matching
curl -X POST http://localhost:8000/api/v1/coach/chat \
  -H "Authorization: Bearer $JWT" \
  -d '{"message": "I ate chicken and rice for lunch"}'

# Verify response includes matched foods with full nutrition
```

**Test Case 3: Multiple Foods**
```bash
# Test with complex meal
curl -X POST http://localhost:8000/api/v1/coach/chat \
  -H "Authorization: Bearer $JWT" \
  -d '{"message": "I had eggs, toast, and orange juice for breakfast"}'

# Should match all 3 foods
```

**Test Case 4: Unmatched Foods**
```bash
# Test with obscure food
curl -X POST http://localhost:8000/api/v1/coach/chat \
  -H "Authorization: Bearer $JWT" \
  -d '{"message": "I ate [some weird exotic food]"}'

# Should return partial object for manual completion
```

---

## 📊 Success Criteria

### Frontend ✅ Complete
- [x] MealLogPreview component created
- [x] Exact same UI as manual logging page
- [x] Uses FoodSearchV2 and MealEditor
- [x] Dark theme styling matches
- [x] Pre-fills data from AI detection
- [x] Fully editable before saving
- [x] Build passes with zero errors
- [x] TypeScript types correct
- [x] Integrated with UnifiedCoachClient

### Backend ⚠️ Pending Implementation
- [ ] Food matching service created
- [ ] Meal parser updated to use food matching
- [ ] Database queries implemented
- [ ] API response schema updated
- [ ] Tests passing
- [ ] Food matching accuracy >70%
- [ ] Handles unmatched foods gracefully

---

## 🚀 Deployment Plan

### Phase 1: Frontend Only (Current)
**Status**: ✅ Ready to deploy

**What Works**:
- Preview UI renders correctly
- User can manually add foods via FoodSearchV2
- Edit/save/cancel functionality works
- Dark theme consistent

**Limitation**:
- AI-detected foods won't have nutrition data yet
- User must manually search and add foods
- Preview shows empty food list initially

**User Experience**:
User: "I ate chicken and rice"
→ Preview opens with empty food list
→ User searches "chicken" and adds manually
→ User searches "rice" and adds manually
→ User saves meal

**Still valuable** because:
- Detects it's a meal log (not a chat)
- Pre-selects meal type if mentioned
- Pre-fills time
- Provides consistent UI

### Phase 2: Backend Food Matching (Next)
**Status**: ⚠️ Implementation needed

**What Changes**:
- AI-detected foods come pre-filled
- Full nutrition data included
- User only edits if needed

**User Experience**:
User: "I ate chicken and rice"
→ Preview opens with 2 foods pre-filled:
   - Chicken Breast, Grilled (165 cal)
   - White Rice, Cooked (205 cal)
→ User reviews/edits
→ User saves meal

**Implementation Time**: ~4-6 hours
- 2 hours: Food matching service
- 1 hour: Meal parser integration
- 1 hour: Testing
- 1 hour: Documentation

---

## 📝 Next Steps

### Immediate (Frontend)
1. ✅ Commit frontend changes
2. ✅ Push to GitHub
3. ✅ Deploy to Vercel staging
4. ✅ Manual UI testing
5. ✅ Update documentation

### Short-term (Backend)
1. Create food matching service
2. Update meal parser
3. Add tests
4. Deploy to Railway staging
5. E2E testing
6. Production deployment

### Nice-to-Have Enhancements
- Fuzzy matching for misspellings ("chiken" → "chicken")
- Brand recognition ("McDonald's Big Mac")
- Portion size detection ("large chicken breast" → 200g)
- Cooking method recognition ("fried chicken" vs "grilled chicken")
- Recent foods prioritization (user's frequent foods first)

---

## 🎯 Summary

**What's Done**:
- ✅ Frontend completely implemented
- ✅ Exact same UI as manual logging
- ✅ Build passes, TypeScript clean
- ✅ Ready to deploy (with limitations)

**What's Next**:
- ⏳ Backend food matching service
- ⏳ Meal parser integration
- ⏳ Testing and deployment

**User Impact**:
- **Phase 1 (Now)**: Better UX, consistent UI, still requires manual food search
- **Phase 2 (Soon)**: Magical experience, foods pre-filled, minimal user effort

---

**Status**: ✅ **Frontend production-ready, backend enhancement planned**

*Generated: 2025-10-07*
