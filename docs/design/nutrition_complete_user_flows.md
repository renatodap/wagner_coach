# Complete Nutrition Tracking User Flows

## Overview
This document comprehensively maps ALL user interactions with the nutrition tracking system, including primary flows, edge cases, error scenarios, and exceptional situations.

## 1. MEAL/FOOD LOGGING FLOWS

### 1.1 Quick Add Single Food
**Primary Flow:**
1. User clicks "Quick Add" button on dashboard
2. Types food name (e.g., "banana")
3. Selects from search results
4. Adjusts quantity if needed
5. Clicks "Log"

**Edge Cases:**
- Food not found → Show "Create custom food" option
- Network error during search → Show cached/offline foods
- Invalid quantity (negative, zero) → Show validation error
- Extremely large quantity → Confirmation prompt
- Special characters in search → Sanitize and handle

### 1.2 Build Complex Meal
**Primary Flow:**
1. User clicks "Add Meal"
2. Optionally names meal
3. Selects category (breakfast/lunch/dinner/etc)
4. Searches and adds multiple foods
5. Adjusts quantities for each
6. Reviews totals
7. Saves meal

**Edge Cases:**
- Empty meal (no foods) → Prevent save, show error
- Duplicate foods in meal → Allow (user might eat 2 apples)
- > 50 foods in meal → Performance consideration
- Mixed units (g and cups) → Handle conversions
- Future date/time → Allow for meal planning
- Past date > 1 year → Warning but allow

### 1.3 Log from Barcode Scan
**Primary Flow:**
1. User clicks "Scan" button
2. Camera opens
3. Scans product barcode
4. System finds product
5. Shows nutrition info
6. User confirms quantity
7. Logs food

**Edge Cases:**
- Barcode not found → Prompt to create food
- Multiple matches → Show selection
- Camera permission denied → Show manual entry
- Poor lighting/blurry → Retry guidance
- Damaged barcode → Manual barcode entry option

### 1.4 Copy Previous Meal
**Primary Flow:**
1. User views meal history
2. Finds previous meal
3. Clicks "Copy"
4. Adjusts if needed
5. Saves as new entry

**Edge Cases:**
- Foods no longer in database → Show warning
- Copy meal from different user (shared) → Permission check
- Copy to different date → Allow
- Partial copy (some foods) → Selection interface

### 1.5 Quick Log Frequent Foods
**Primary Flow:**
1. Dashboard shows "Frequent Foods"
2. User clicks food
3. Quick quantity selector appears
4. Confirms with one tap

**Edge Cases:**
- No frequent foods yet → Show suggestions
- Frequent food deleted → Remove from quick list
- Stale data (>6 months) → Refresh frequent list

## 2. MEAL MANAGEMENT FLOWS

### 2.1 Edit Existing Meal
**Primary Flow:**
1. User views today's meals
2. Clicks meal to expand
3. Clicks "Edit"
4. Modifies foods/quantities
5. Saves changes

**Edge Cases:**
- Concurrent edits → Last write wins with warning
- Edit meal from previous day → Allow with timestamp
- Remove all foods → Convert to deletion
- Add foods after creation → Allow

### 2.2 Delete Meal
**Primary Flow:**
1. User views meal
2. Clicks "Delete" or swipes
3. Sees confirmation
4. Confirms deletion

**Edge Cases:**
- Delete with dependent data → Cascade appropriately
- Accidental delete → Undo option (30 seconds)
- Bulk delete → Multi-select interface
- Delete shared meal → Permission check

### 2.3 Split Meal
**User ate lunch in two parts:**
1. User edits meal
2. Selects foods to split
3. Creates second meal
4. Adjusts timestamps

**Edge Cases:**
- Split across days → Handle date boundary
- Uneven split → Proportion calculator

## 3. FOOD DATABASE FLOWS

### 3.1 Search Foods
**Primary Flow:**
1. User types in search box
2. Results appear as typing
3. Filters by verified/custom/all
4. Selects food

**Edge Cases:**
- Typos → Fuzzy search
- Different names (soda/pop) → Aliases
- Brand variations → Show all brands
- Regional foods → Localization
- No results → Suggest similar

### 3.2 Create Custom Food
**Primary Flow:**
1. User clicks "Create Food"
2. Enters name, brand
3. Adds nutrition info
4. Selects serving size
5. Saves food

**Edge Cases:**
- Duplicate name → Add differentiator
- Missing nutrition → Allow partial
- Multiple serving sizes → Add variations
- Private vs public → Privacy settings
- Import from photo → OCR nutrition label

### 3.3 Edit Custom Food
**Primary Flow:**
1. User views their foods
2. Selects food to edit
3. Updates information
4. Saves changes

**Edge Cases:**
- Food used in past meals → Don't change history
- Shared food → Version control
- Significant changes → Create new version

### 3.4 Report Incorrect Food
**Primary Flow:**
1. User finds error
2. Clicks "Report"
3. Describes issue
4. Submits report

**Edge Cases:**
- Multiple reports → Prioritize review
- Malicious reports → User blocking

## 4. MEAL TEMPLATE FLOWS

### 4.1 Save Meal as Template
**Primary Flow:**
1. User creates/views meal
2. Clicks "Save as Template"
3. Names template
4. Saves for reuse

**Edge Cases:**
- Duplicate template names → Auto-number
- Template with custom foods → Include foods
- Template limit reached → Manage templates

### 4.2 Use Template
**Primary Flow:**
1. User clicks "Templates"
2. Selects template
3. Adjusts date/time
4. Logs meal

**Edge Cases:**
- Modified template foods → Show changes
- Partial template use → Select items
- Template sharing → Permission system

### 4.3 Edit Template
**Primary Flow:**
1. User manages templates
2. Edits template
3. Updates foods/quantities
4. Saves changes

**Edge Cases:**
- Template in use → Don't affect logged meals
- Rename conflicts → Handle duplicates

## 5. ANALYTICS & TRACKING FLOWS

### 5.1 View Daily Summary
**Primary Flow:**
1. Dashboard shows today
2. User sees totals
3. Clicks for detail
4. Views meal breakdown

**Edge Cases:**
- No meals today → Show encouragement
- Partial day → Project totals
- Multiple timezones → User's current zone

### 5.2 Weekly/Monthly View
**Primary Flow:**
1. User clicks "Analytics"
2. Selects period
3. Views trends
4. Exports data

**Edge Cases:**
- Incomplete weeks → Handle gaps
- Very old data → Performance paging
- Export formats → CSV, PDF, JSON

### 5.3 Goal Tracking
**Primary Flow:**
1. User sets goals
2. Logs meals
3. Sees progress
4. Gets notifications

**Edge Cases:**
- Unrealistic goals → Provide guidance
- Goal conflicts → Priority system
- Missed goals → Motivation, not shame

### 5.4 Nutrition Trends
**Primary Flow:**
1. User views trends
2. Sees patterns
3. Gets insights
4. Acts on recommendations

**Edge Cases:**
- Insufficient data → Minimum period
- Outlier days → Statistical handling
- Seasonal variations → Normalization

## 6. SPECIAL DIET FLOWS

### 6.1 Restaurant Meal
**Primary Flow:**
1. User searches restaurant
2. Finds menu item
3. Logs meal
4. Adds modifications

**Edge Cases:**
- Restaurant not found → Add manually
- Menu outdated → Report/update
- Custom modifications → Adjust nutrition
- Chain variations → Location-specific

### 6.2 Recipe Creation
**Primary Flow:**
1. User creates recipe
2. Adds ingredients
3. Sets servings
4. Calculates per serving
5. Saves recipe

**Edge Cases:**
- Cooking loss (water) → Yield adjustment
- Ingredient substitutions → Update nutrition
- Scaling recipes → Proportion math
- Recipe sharing → Privacy settings

### 6.3 Meal Prep Logging
**Primary Flow:**
1. User preps multiple meals
2. Logs as batch
3. System divides portions
4. Schedules future logs

**Edge Cases:**
- Uneven portions → Manual adjustment
- Prep spoilage → Remove future logs
- Freezer meals → Long-term tracking

## 7. INTEGRATION FLOWS

### 7.1 Import from Other Apps
**Primary Flow:**
1. User exports from app
2. Uploads file
3. Maps fields
4. Imports data

**Edge Cases:**
- Duplicate entries → Merge strategy
- Format mismatches → Conversion
- Partial imports → Rollback option
- Large files → Batch processing

### 7.2 Fitness App Sync
**Primary Flow:**
1. Links fitness app
2. Syncs workout data
3. Adjusts calorie goals
4. Shows net calories

**Edge Cases:**
- Sync conflicts → Resolution strategy
- API limits → Rate limiting
- Connection loss → Queue syncs

### 7.3 Photo Food Recognition
**Primary Flow:**
1. User takes photo
2. AI identifies foods
3. Estimates portions
4. User confirms
5. Logs meal

**Edge Cases:**
- Multiple foods → Identify all
- Unclear image → Request retake
- Unknown foods → Manual entry
- Portion errors → Easy adjustment

## 8. ERROR & RECOVERY FLOWS

### 8.1 Network Offline
**Scenarios:**
- Cache recent foods locally
- Queue meal logs for sync
- Show offline indicator
- Sync when connected

### 8.2 Data Conflicts
**Scenarios:**
- Show conflict resolution
- Merge changes
- Maintain history
- Prevent data loss

### 8.3 Invalid Data
**Scenarios:**
- Validation messages
- Suggest corrections
- Prevent corruption
- Maintain consistency

### 8.4 Account Issues
**Scenarios:**
- Session timeout → Re-authenticate
- Deleted account → Data recovery
- Suspended account → Appeal process
- Data export → Before deletion

## 9. USER PREFERENCE FLOWS

### 9.1 Dietary Restrictions
**Primary Flow:**
1. User sets restrictions
2. Foods are filtered
3. Warnings on conflicts
4. Alternatives suggested

**Edge Cases:**
- Multiple restrictions → Complex filtering
- Allergen warnings → Prominent display
- Hidden ingredients → Database flags

### 9.2 Measurement Units
**Primary Flow:**
1. User selects preference
2. All displays convert
3. Input accepts both
4. Conversion automatic

**Edge Cases:**
- Regional defaults → Auto-detect
- Mixed units → Smart conversion
- Precision loss → Rounding rules

### 9.3 Notification Settings
**Primary Flow:**
1. User sets reminders
2. Configures timing
3. Chooses frequency
4. Receives notifications

**Edge Cases:**
- Timezone changes → Adjust times
- Do not disturb → Respect settings
- Notification fatigue → Smart batching

## 10. SOCIAL & SHARING FLOWS

### 10.1 Share Meal
**Primary Flow:**
1. User views meal
2. Clicks share
3. Selects format
4. Shares via platform

**Edge Cases:**
- Privacy settings → Respect choices
- Share to nutritionist → Detailed format
- Social media → Attractive format

### 10.2 Family Meal Logging
**Primary Flow:**
1. Parent logs meal
2. Adjusts for family
3. Splits portions
4. Tracks per person

**Edge Cases:**
- Different portions → Individual adjustment
- Kid-friendly UI → Simplification
- Family templates → Shared access

## 11. ADVANCED FEATURES

### 11.1 Macro Tracking
**Primary Flow:**
1. User sets macro goals
2. Logs foods
3. Sees macro breakdown
4. Adjusts meals

**Edge Cases:**
- Macro calculator → From goals
- Flexible dieting → IIFYM support
- Carb cycling → Day-specific goals

### 11.2 Micronutrient Tracking
**Primary Flow:**
1. User enables micros
2. Views detailed nutrition
3. Identifies deficiencies
4. Gets recommendations

**Edge Cases:**
- Incomplete data → Show known
- Supplement logging → Separate category
- RDA variations → Age/gender specific

### 11.3 Water Tracking
**Primary Flow:**
1. User logs water
2. Quick increments
3. Daily goal tracking
4. Hydration reminders

**Edge Cases:**
- Other beverages → Count partially
- Exercise adjustment → Increase goal
- Climate adjustment → Weather API

## IMPLEMENTATION CHECKLIST

### Core Features (MUST HAVE)
- [x] Basic meal logging
- [x] Food search
- [x] Quantity tracking
- [x] Daily summary view
- [ ] Edit meal
- [ ] Delete meal
- [ ] Copy previous meal
- [ ] Meal history (past 7 days)
- [ ] Custom food creation
- [ ] Basic templates

### Important Features (SHOULD HAVE)
- [ ] Weekly/monthly view
- [ ] Nutritional goals
- [ ] Frequent foods
- [ ] Better search (fuzzy)
- [ ] Meal notes
- [ ] Export data
- [ ] Offline support
- [ ] Better error handling
- [ ] Loading states
- [ ] Empty states

### Nice to Have (COULD HAVE)
- [ ] Barcode scanning
- [ ] Photo recognition
- [ ] Restaurant menus
- [ ] Recipe builder
- [ ] Meal planning
- [ ] Shopping list
- [ ] Macro tracking
- [ ] Water tracking
- [ ] Share meals
- [ ] Family accounts

### Future Enhancements (WON'T HAVE NOW)
- [ ] AI meal suggestions
- [ ] Nutritionist integration
- [ ] Medical integration
- [ ] Wearable sync
- [ ] Voice input
- [ ] AR portion sizing
- [ ] DNA-based nutrition
- [ ] Meal delivery integration