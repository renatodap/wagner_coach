# Food Database Foundation - Feature Design

## Overview
Establish a working food database with comprehensive CRUD operations, search functionality, and personalization features to serve as the foundation for all meal logging functionality.

## Problem Statement
Current implementation has:
- Empty food database with no seed data
- Non-functional food search API
- No personalization or user preferences tracking
- Missing food creation flow for custom foods

## Success Criteria
- ✅ Database seeded with 1000+ common foods
- ✅ Fast food search (<100ms response time)
- ✅ User can create custom foods
- ✅ Personalization tracks frequently used foods
- ✅ API endpoints handle all CRUD operations
- ✅ Foods are properly categorized and validated

## Technical Requirements

### Database Schema
```sql
-- Enhanced foods table
foods:
  id: uuid (primary key)
  name: text (indexed, full-text search)
  brand: text (nullable, indexed)
  category: food_category_enum
  description: text (nullable)
  serving_size: numeric
  serving_unit: serving_unit_enum
  calories: numeric (nullable)
  protein_g: numeric (nullable)
  carbs_g: numeric (nullable)
  fat_g: numeric (nullable)
  fiber_g: numeric (nullable)
  sugar_g: numeric (nullable)
  sodium_mg: numeric (nullable)
  barcode: text (nullable, unique, indexed)
  is_verified: boolean (default false)
  source: food_source_enum (usda, user, manual)
  created_by: uuid (references profiles.id, nullable)
  created_at: timestamptz
  updated_at: timestamptz

-- User food preferences
user_food_preferences:
  id: uuid (primary key)
  user_id: uuid (references profiles.id)
  food_id: uuid (references foods.id)
  usage_count: integer (default 1)
  is_favorite: boolean (default false)
  last_used_at: timestamptz
  created_at: timestamptz

-- Food categories enum
food_category_enum:
  - fruits
  - vegetables
  - grains
  - protein
  - dairy
  - fats_oils
  - beverages
  - snacks
  - prepared_foods
  - supplements
  - other

-- Serving units enum
serving_unit_enum:
  - g
  - ml
  - oz
  - cup
  - tbsp
  - tsp
  - piece
  - slice
  - serving
```

### API Endpoints
```typescript
GET /api/nutrition/foods/search
  Query: q (search term), category, limit, user_id
  Response: { foods: Food[], personalized_foods: Food[] }

GET /api/nutrition/foods/:id
  Response: { food: Food }

POST /api/nutrition/foods
  Body: CreateFoodRequest
  Response: { food: Food }

PUT /api/nutrition/foods/:id
  Body: UpdateFoodRequest
  Response: { food: Food }

DELETE /api/nutrition/foods/:id
  Response: { success: boolean }

POST /api/nutrition/foods/seed
  Body: { force?: boolean }
  Response: { seeded_count: number }

GET /api/nutrition/foods/frequent
  Query: user_id, limit
  Response: { foods: Food[] }
```

## Core Features

### 1. Food Search with Personalization
- **Fast full-text search** across name, brand, description
- **Personalized results** showing user's frequent foods first
- **Category filtering** for focused searches
- **Fuzzy matching** for typos and variations
- **Recent searches** caching for quick re-access

### 2. Food Database Seeding
- **USDA FoodData Central** integration for verified nutrition data
- **Common foods first** - prioritize frequently consumed items
- **Proper categorization** for easy filtering
- **Batch import** with progress tracking
- **Deduplication** logic to prevent duplicates

### 3. Custom Food Creation
- **Simple form** for manual food entry
- **Nutrition label OCR** for easy data entry
- **Validation** for required fields and reasonable ranges
- **User ownership** and privacy controls
- **Sharing options** for verified custom foods

### 4. User Preferences & Learning
- **Usage tracking** - increment count when food is used
- **Favorites system** - star frequently used foods
- **Smart suggestions** based on time of day, previous meals
- **Privacy controls** - keep personal data separate

### 5. Data Quality & Verification
- **Source tracking** (USDA, user-created, manual)
- **Verification system** for community-submitted foods
- **Nutrition validation** against realistic ranges
- **Duplicate detection** and merging
- **Report incorrect data** functionality

## User Experience Flow

### Food Search Flow
```
1. User types in search box
2. Auto-suggest appears after 2+ characters
3. Results show:
   - Personalized foods (top, orange indicator)
   - Recent foods (if applicable)
   - All matching foods
4. Click to select food
5. Usage count increments automatically
```

### Custom Food Creation Flow
```
1. Click "Can't find food? Add custom"
2. Fill form:
   - Name (required)
   - Brand (optional)
   - Category (required)
   - Serving size & unit (required)
   - Nutrition info (at least calories)
3. Preview calculated nutrition
4. Save food
5. Food appears in personal library
```

## Performance Requirements
- **Search response time**: <100ms for cached results, <500ms for database queries
- **Database size**: Support 100K+ foods with efficient indexing
- **Concurrent users**: Handle 1000+ simultaneous searches
- **Personalization**: Update preferences in background, no user wait time

## Security & Privacy
- **User data isolation**: Personal foods and preferences are private
- **Input validation**: Prevent SQL injection, XSS attacks
- **Rate limiting**: Prevent search abuse
- **Data encryption**: Sensitive user data encrypted at rest

## Monitoring & Analytics
- **Search performance**: Track query times and success rates
- **Popular foods**: Identify most-used foods for better caching
- **User engagement**: Track custom food creation and usage
- **Error tracking**: Monitor API failures and data quality issues

## Migration Strategy
1. **Phase 1**: Seed database with core 1000 foods
2. **Phase 2**: Deploy API endpoints with basic search
3. **Phase 3**: Add personalization features
4. **Phase 4**: Implement custom food creation
5. **Phase 5**: Add advanced features (OCR, verification)

## Testing Strategy
- **Unit tests**: API endpoints, business logic, validation
- **Integration tests**: Database operations, external APIs
- **Performance tests**: Search speed, concurrent load
- **User acceptance tests**: Complete flows end-to-end
- **Coverage target**: ≥80% code coverage

## Dependencies
- **Supabase**: Database and real-time subscriptions
- **USDA FoodData Central**: Nutrition data source
- **Full-text search**: PostgreSQL search capabilities
- **Caching layer**: Redis for frequently accessed data
- **Background jobs**: For data seeding and maintenance