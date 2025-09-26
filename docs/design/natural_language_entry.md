# Natural Language Entry - Feature Design

## Overview
Enable users to log meals using natural language descriptions that are intelligently parsed into structured meal data, automatically matched with foods from the database, and seamlessly integrated into the meal logging system.

## Problem Statement
Current natural language functionality has:
- Limited parsing accuracy and food matching
- No learning from user corrections
- Inconsistent confidence scoring
- Poor handling of complex meal descriptions
- No integration with user's food preferences
- Missing quantity and unit extraction refinement

## Success Criteria
- ✅ Parse 90%+ of common meal descriptions accurately
- ✅ Match foods from database with 85%+ accuracy
- ✅ Extract quantities and units correctly in 80%+ cases
- ✅ Provide confidence scores and correction interface
- ✅ Learn from user corrections to improve over time
- ✅ Handle complex multi-food meals effectively
- ✅ Integrate seamlessly with meal logging flow
- ✅ Support multiple languages and dietary terms

## Technical Requirements

### AI/ML Pipeline Architecture
```typescript
interface NaturalLanguageProcessor {
  // Main parsing pipeline
  parseMealDescription(description: string, userId?: string): Promise<ParsedMeal>;

  // Individual parsing steps
  extractFoodItems(description: string): FoodItem[];
  matchFoodsToDatabase(items: FoodItem[], userId?: string): FoodMatch[];
  calculateConfidenceScores(parsed: ParsedMeal): ConfidenceAnalysis;

  // Learning system
  learnFromCorrection(original: string, corrected: ParsedMeal): void;
  getUserPatterns(userId: string): UserParsingPatterns;
}

interface ParsedMeal {
  // Basic meal info
  meal_name?: string;
  meal_category: MealCategory;
  logged_at: string; // extracted from "yesterday", "this morning", etc.
  confidence: 'high' | 'medium' | 'low';

  // Extracted foods with quantities
  foods: ParsedFood[];

  // AI assumptions and uncertainties
  assumptions: string[];
  ambiguities: Ambiguity[];

  // Calculated nutrition totals
  total_calories?: number;
  total_protein_g?: number;
  total_carbs_g?: number;
  total_fat_g?: number;
}

interface ParsedFood {
  // Original extracted text
  raw_text: string;

  // Matched database food
  food_id?: string;
  food_name: string;
  confidence: number; // 0-1 for food match accuracy

  // Extracted quantity
  quantity: number;
  unit: ServingUnit;
  quantity_confidence: number; // 0-1 for quantity extraction accuracy

  // Alternative matches
  alternatives?: FoodMatch[];
}
```

### Database Enhancements
```sql
-- User parsing patterns and corrections
user_parsing_patterns:
  id: uuid (primary key)
  user_id: uuid (references profiles.id)
  pattern_type: parsing_pattern_enum
  pattern_text: text
  replacement: text
  usage_count: integer (default 1)
  created_at: timestamptz
  updated_at: timestamptz

-- Parsing pattern types
parsing_pattern_enum:
  - food_synonym      -- "chick breast" → "chicken breast"
  - quantity_format   -- "2 large eggs" → "2 eggs, large"
  - unit_preference   -- user always means "cup" when saying "bowl"
  - meal_timing       -- "this morning" → breakfast category
  - personal_terms    -- "my usual smoothie" → specific food combo

-- Parsing corrections for learning
parsing_corrections:
  id: uuid (primary key)
  user_id: uuid (references profiles.id)
  original_text: text
  parsed_result: jsonb
  corrected_result: jsonb
  correction_type: correction_type_enum
  created_at: timestamptz

correction_type_enum:
  - food_match        -- AI matched wrong food
  - quantity_error    -- Quantity/unit extraction wrong
  - timing_error      -- Meal timing misidentified
  - category_error    -- Meal category wrong
  - missing_food      -- AI missed a food in description
  - extra_food        -- AI added food not in description
```

### API Endpoints
```typescript
// Natural language parsing
POST /api/nutrition/parse
  Body: { description: string, user_id?: string }
  Response: { parsed: ParsedMeal, alternatives?: ParsedMeal[] }

// Correction and learning
POST /api/nutrition/parse/correct
  Body: { original: string, parsed: ParsedMeal, corrected: ParsedMeal }
  Response: { success: boolean, learned: boolean }

// User patterns
GET /api/nutrition/parse/patterns/:user_id
  Response: { patterns: UserParsingPattern[] }

// Parsing analytics
GET /api/nutrition/parse/analytics
  Query: user_id?, date_from, date_to
  Response: { accuracy_stats: ParsingStats }
```

## Core Features

### 1. Intelligent Food Extraction
**Purpose:** Accurately identify foods from natural language text

**Natural Language Patterns:**
```typescript
// Supported input formats
const supportedPatterns = [
  // Simple formats
  "I ate an apple",
  "Had 2 eggs for breakfast",
  "Greek yogurt with berries",

  // Complex formats
  "For lunch I had a chicken breast (about 6oz) with steamed broccoli and brown rice",
  "Yesterday's dinner: grilled salmon, roasted sweet potato, and a side salad with olive oil",
  "This morning's smoothie: banana, protein powder, almond milk, spinach",

  // Quantity variations
  "2 large eggs",
  "half a cup of oats",
  "200g chicken breast",
  "medium apple",
  "6 oz salmon fillet",

  // Timing expressions
  "breakfast this morning",
  "yesterday's lunch",
  "dinner last night",
  "snack around 3pm"
];
```

**Food Matching Algorithm:**
```typescript
interface FoodMatcher {
  // Primary matching strategies
  exactMatch(term: string): Food[];
  fuzzyMatch(term: string): Food[];
  synonymMatch(term: string): Food[];
  brandMatch(term: string): Food[];

  // User-personalized matching
  personalizedMatch(term: string, userId: string): Food[];

  // Confidence scoring
  scoreMatch(food: Food, term: string, context: string): number;
}
```

### 2. Advanced Quantity Extraction
**Purpose:** Accurately extract quantities and units from natural language

**Quantity Patterns:**
```typescript
const quantityPatterns = {
  // Numbers with units
  "2 cups", "150g", "6 oz", "1 tbsp",

  // Descriptive quantities
  "large apple", "small banana", "medium egg",
  "handful of nuts", "slice of bread", "bowl of cereal",

  // Fractions and decimals
  "half a cup", "1.5 servings", "quarter pound",
  "two and a half", "1/3 cup",

  // Implied quantities
  "an apple" → 1 medium apple
  "some rice" → estimate based on meal context
  "chicken breast" → 1 average serving (100-150g)
};
```

**Unit Standardization:**
```typescript
interface QuantityNormalizer {
  parseQuantity(text: string): { amount: number; unit: string; confidence: number };
  standardizeUnit(unit: string): ServingUnit;
  estimateImpliedQuantity(food: string, context: MealContext): Quantity;
}
```

### 3. Contextual Meal Categorization
**Purpose:** Intelligently determine meal type from context clues

**Categorization Logic:**
```typescript
interface MealCategorizer {
  categorizeFromTime(timeExpression: string): MealCategory;
  categorizeFromFoods(foods: string[]): MealCategory;
  categorizeFromContext(description: string): MealCategory;
}

// Time-based rules
const timeRules = {
  "breakfast|morning|AM|before 11": "breakfast",
  "lunch|midday|noon|12-2pm": "lunch",
  "dinner|evening|night|after 5pm": "dinner",
  "snack|between meals": "snack"
};

// Food-based rules
const foodRules = {
  ["cereal", "oatmeal", "eggs", "toast"]: "breakfast",
  ["sandwich", "salad", "soup"]: "lunch",
  ["pasta", "steak", "casserole"]: "dinner",
  ["chips", "nuts", "fruit"]: "snack"
};
```

### 4. Confidence Analysis & Review System
**Purpose:** Provide transparency and allow user corrections

**Confidence Calculation:**
```typescript
interface ConfidenceAnalyzer {
  calculateOverallConfidence(parsed: ParsedMeal): ConfidenceLevel;
  calculateFoodConfidence(food: ParsedFood): number;
  calculateQuantityConfidence(quantity: string, unit: string): number;
  identifyAmbiguities(description: string, parsed: ParsedMeal): Ambiguity[];
}

interface Ambiguity {
  type: 'food_match' | 'quantity_unclear' | 'timing_unclear' | 'multiple_interpretations';
  description: string;
  suggestions: string[];
  original_text: string;
}
```

**Review Interface Flow:**
```
1. Show parsed result with confidence indicators
2. Highlight low-confidence items in yellow/orange
3. Provide "Did you mean?" alternatives for uncertain matches
4. Allow inline editing of any parsed component
5. Show assumptions made by AI
6. Confirm or correct before saving
```

### 5. Learning & Personalization System
**Purpose:** Improve parsing accuracy through user feedback

**Learning Mechanisms:**
```typescript
interface LearningSystem {
  // Learn from corrections
  recordCorrection(correction: ParsingCorrection): void;

  // Identify user patterns
  detectUserPatterns(userId: string): UserPattern[];

  // Apply learned patterns
  applyPersonalization(description: string, userId: string): string;

  // Update food matching preferences
  updateFoodPreferences(userId: string, corrections: FoodCorrection[]): void;
}

interface UserPattern {
  pattern: string;
  replacement: string;
  confidence: number;
  usage_count: number;
  examples: string[];
}
```

**Personalization Examples:**
```typescript
// User always says "chick breast" but means "chicken breast"
foodSynonyms: {
  "chick breast": "chicken breast",
  "greek yog": "greek yogurt"
}

// User's quantity preferences
quantityPatterns: {
  "large egg": "60g",  // user's large eggs are actually 60g
  "my smoothie": "protein powder + banana + almond milk"
}

// Meal timing preferences
timingPatterns: {
  "morning": "7:30 AM", // user typically eats breakfast at 7:30
  "lunch": "12:00 PM"
}
```

## User Experience Design

### Quick Entry Interface
```
┌─────────────────────────────────────┐
│ ✨ Quick Meal Entry                 │
├─────────────────────────────────────┤
│ Describe what you ate:              │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Had 2 eggs and toast for        │ │
│ │ breakfast this morning          │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Examples:                           │
│ • I ate an apple                    │
│ • Had chicken and rice for lunch    │ │
│ • Yesterday's dinner: pasta         │
│                                     │
│ [✨ Parse Meal] [Cancel]            │
└─────────────────────────────────────┘
```

### Review & Correction Interface
```
┌─────────────────────────────────────┐
│ 📝 Review Parsed Meal               │
├─────────────────────────────────────┤
│ "Had 2 eggs and toast for breakfast"│
│                                     │
│ ✅ Breakfast • This morning         │
│                                     │
│ Foods found:                        │
│ ┌─────────────────────────────────┐ │
│ │ ✅ Scrambled Eggs               │ │
│ │    2 large eggs (High confidence) │
│ │    140 cal, 12g protein         │ │
│ │    [Edit] [Change Food]         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⚠️ Whole Wheat Bread            │ │
│ │    2 slices (Medium confidence) │ │
│ │    Did you mean: Toast? Bagel?  │ │
│ │    [Edit] [Change Food]         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Totals: 300 cal | 18g P | 24g C    │
│                                     │
│ [✅ Confirm & Save] [✏️ Edit More]  │
└─────────────────────────────────────┘
```

## Integration Points

### Food Database Integration
- **Intelligent matching**: Use food names, brands, synonyms for matching
- **Personalized results**: Prioritize user's frequently used foods
- **Learning integration**: Update food preferences based on corrections
- **Fallback handling**: Handle unmatched foods gracefully

### Meal Logging Integration
- **Seamless handoff**: Parsed meal flows directly into meal builder
- **Editable results**: User can refine parsed meal before saving
- **Macro calculation**: Automatic nutrition calculation from parsed foods
- **Template creation**: Save parsed meals as reusable templates

## Performance Requirements
- **Parsing speed**: < 2 seconds for typical meal descriptions
- **Database matching**: < 500ms for food lookups
- **Confidence analysis**: < 100ms for scoring
- **Learning updates**: Asynchronous, no user wait time

## Accuracy Targets
- **Food identification**: 85% accuracy on first attempt
- **Quantity extraction**: 80% accuracy for explicit quantities
- **Meal categorization**: 90% accuracy with time/context clues
- **Overall satisfaction**: 90% of parsed meals accepted with minimal editing

## Error Handling & Fallbacks

### Parsing Failures
```typescript
interface FallbackStrategies {
  // When no foods identified
  noFoodsFound(description: string): FallbackResponse;

  // When quantities unclear
  quantityAmbiguous(food: string, context: string): QuantityEstimate;

  // When meal timing unclear
  timingAmbiguous(description: string): TimeEstimate;

  // When food matching fails
  foodNotFound(term: string): CustomFoodSuggestion;
}
```

### User Guidance
- **Clear error messages**: "I couldn't identify any foods in that description"
- **Helpful suggestions**: "Try including specific foods like 'chicken breast' or 'apple'"
- **Example formats**: Show successful parsing examples
- **Progressive disclosure**: Start simple, show advanced features as user engages

## Analytics & Monitoring

### Parsing Analytics
```typescript
interface ParsingAnalytics {
  accuracy_rate: number;          // % of meals accepted without corrections
  food_match_rate: number;        // % of foods matched correctly
  quantity_accuracy: number;      // % of quantities extracted correctly
  confidence_calibration: number; // How well confidence scores predict accuracy
  user_satisfaction: number;      // User rating of parsed results
}
```

### Learning Analytics
```typescript
interface LearningAnalytics {
  correction_patterns: CorrectionPattern[];    // Most common correction types
  user_improvement: UserImprovementMetrics;    // How accuracy improves over time
  popular_synonyms: SynonymUsage[];            // Most commonly used synonyms
  quantity_preferences: QuantityPreferences;   // User quantity patterns
}
```

## Security & Privacy

### Data Protection
- **Personal patterns**: Encrypted storage of user-specific learning data
- **Input sanitization**: Prevent injection attacks through meal descriptions
- **Rate limiting**: Prevent API abuse of parsing endpoints
- **Data retention**: Clear policies on storing meal descriptions vs parsed results

### AI Ethics
- **Bias prevention**: Ensure parsing works across dietary preferences and cultures
- **Transparency**: Clear indication when AI is making assumptions
- **User control**: Always allow user to override AI decisions
- **Privacy preservation**: Don't store or share personal meal descriptions

## Future Enhancements

### Advanced NLP Features
- **Multi-language support**: Parse meals in different languages
- **Recipe parsing**: Break down complex recipes into ingredients
- **Photo + text**: Combine image recognition with text descriptions
- **Voice input**: Speech-to-text for hands-free meal logging

### Intelligent Assistance
- **Proactive suggestions**: "Based on the time, did you mean breakfast?"
- **Nutritional guidance**: "This meal is high in protein, low in carbs"
- **Pattern recognition**: "You often eat similar meals on Mondays"
- **Health insights**: "This matches your dietary goals"

## Testing Strategy
- **NLP accuracy testing**: Test parsing against diverse meal descriptions
- **Performance testing**: Ensure parsing speed meets requirements
- **Learning validation**: Verify that corrections improve future accuracy
- **Integration testing**: End-to-end meal logging via natural language
- **User acceptance testing**: Real users testing parsing accuracy and satisfaction
- **Edge case testing**: Handle unusual descriptions, multiple foods, complex quantities