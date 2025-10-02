# Essential Onboarding Questions

## TIER 1: ABSOLUTE ESSENTIALS (Cannot create program without these)

### 1. User Goal (Primary Objective)
**Question**: "What's your primary fitness goal?"
**Type**: Single-select button
**Options**:
- Build Muscle
- Lose Fat
- Improve Endurance
- Increase Strength
- Sport Performance
- General Health/Maintenance
- Rehab/Recovery

**Why Essential**: Determines program structure, calorie target, training approach

---

### 2. User Persona (Activity Profile)
**Question**: "Which best describes you?"
**Type**: Single-select button
**Options**:
- Strength Athlete (Powerlifting, Weightlifting)
- Bodybuilder
- Endurance Runner
- Triathlete
- CrossFit Athlete
- Team Sport Athlete
- General Fitness Enthusiast
- Beginner/Recovery

**Why Essential**: Determines workout types, volume, intensity patterns

---

### 3. Current Activity Level
**Question**: "How often do you currently train?"
**Type**: Single-select button
**Options**:
- Sedentary (0-1 days/week)
- Lightly Active (2-3 days/week)
- Moderately Active (4-5 days/week)
- Very Active (6-7 days/week)

**Why Essential**: Sets baseline for program volume, prevents overtraining

---

### 4. Desired Training Frequency
**Question**: "How many days per week can you train?"
**Type**: Single-select button
**Options**:
- 3 days/week
- 4 days/week
- 5 days/week
- 6 days/week
- 7 days/week

**Why Essential**: Structures weekly training split

---

### 5. Program Duration
**Question**: "How long do you want your program to be?"
**Type**: Single-select button
**Options**:
- 1 Month (4 weeks)
- 2 Months (8 weeks)
- 3 Months (12 weeks)
- 4 Months (16 weeks)

**Why Essential**: Determines periodization, progression rate

---

### 6. Biological Sex
**Question**: "What is your biological sex?"
**Type**: Single-select button
**Options**:
- Male
- Female

**Why Essential**: Affects calorie calculations, hormonal considerations

---

### 7. Age
**Question**: "What is your age?"
**Type**: Dropdown (18-80)
**Options**: Dropdown menu

**Why Essential**: Affects recovery capacity, training volume recommendations

---

### 8. Current Weight
**Question**: "What is your current weight?"
**Type**: Number input + unit select
**Units**: kg or lbs (toggle)

**Why Essential**: Required for calorie and macro calculations

---

### 9. Height
**Question**: "What is your height?"
**Type**: Number input + unit select
**Units**: cm or ft/in (toggle)

**Why Essential**: Required for calorie calculations (BMR)

---

### 10. Daily Meal Preference
**Question**: "How many meals per day do you prefer?"
**Type**: Single-select button
**Options**:
- 2 meals/day (Intermittent Fasting)
- 3 meals/day (Standard)
- 4 meals/day
- 5-6 meals/day (Frequent feeding)

**Why Essential**: Structures meal plan, affects meal size/macros per meal

---

## TIER 2: IMPORTANT FOR OPTIMIZATION (Improve program quality)

### 11. Training Time Preferences
**Question**: "When do you typically train?"
**Type**: Multi-select checkboxes
**Options**:
- Early Morning (5-8 AM)
- Morning (8-11 AM)
- Midday (11 AM-2 PM)
- Afternoon (2-5 PM)
- Evening (5-8 PM)
- Night (8-10 PM)

**Why Important**: Affects nutrient timing recommendations

---

### 12. Dietary Restrictions
**Question**: "Do you have any dietary restrictions?"
**Type**: Multi-select checkboxes
**Options**:
- None
- Vegetarian
- Vegan
- Dairy-free
- Gluten-free
- Nut allergies
- Shellfish allergies
- Other food allergies

**Why Important**: Determines food options in meal plan

---

### 13. Equipment Access
**Question**: "What equipment do you have access to?"
**Type**: Multi-select checkboxes
**Options**:
- Full Gym
- Home Gym (Barbell, Rack, Bench)
- Dumbbells Only
- Resistance Bands
- Bodyweight Only
- Cardio Equipment (Bike, Rower, Treadmill)

**Why Important**: Determines exercise selection

---

### 14. Injury/Limitation Concerns
**Question**: "Do you have any injuries or physical limitations?"
**Type**: Multi-select checkboxes
**Options**:
- None
- Lower Back Issues
- Shoulder Issues
- Knee Issues
- Hip Issues
- Wrist Issues
- Ankle Issues
- Other (specify)

**Why Important**: Exercise modifications and restrictions

---

### 15. Experience Level
**Question**: "How long have you been training?"
**Type**: Single-select button
**Options**:
- Beginner (0-1 year)
- Intermediate (1-3 years)
- Advanced (3-5 years)
- Expert (5+ years)

**Why Important**: Affects exercise complexity, progression rate

---

## TIER 3: ADDITIONAL QUESTIONS FOR "CREATE PROGRAM" FLOW

### 16. Specific Performance Goals
**Question**: "Do you have a specific performance goal?"
**Type**: Text input (LLM interpreted)
**Examples**:
- "Run a sub-4 hour marathon"
- "Bench press 315 lbs"
- "Complete a muscle-up"

**Why**: Adds specificity to program design

---

### 17. Timeline/Event Date
**Question**: "Are you training for a specific event or deadline?"
**Type**: Date picker (optional)
**Why**: Adjusts periodization and peaking strategy

---

### 18. Weak Points/Focus Areas
**Question**: "What are your weak points or areas you want to prioritize?"
**Type**: Multi-select OR text input (LLM interpreted)
**Options**:
- Upper Body Strength
- Lower Body Strength
- Core Strength
- Cardiovascular Endurance
- Mobility/Flexibility
- Specific Muscle Groups
- Other (specify)

**Why**: Adds targeted volume to program

---

### 19. Recovery Capacity
**Question**: "How would you rate your recovery ability?"
**Type**: Single-select button
**Options**:
- Excellent (young, good sleep, low stress)
- Good (decent sleep, moderate stress)
- Fair (poor sleep or high stress)
- Poor (both poor sleep and high stress)

**Why**: Affects training volume and frequency recommendations

---

### 20. Preferred Workout Duration
**Question**: "How long should each workout be?"
**Type**: Single-select button
**Options**:
- 30-45 minutes
- 45-60 minutes
- 60-90 minutes
- 90+ minutes (endurance athletes)

**Why**: Determines workout density and exercise selection

---

## DATA VECTORIZATION REQUIREMENTS

All answers from:
1. Tier 1 (Essential Onboarding)
2. Profile preferences (if updated)
3. Tier 3 (Create Program flow)

Must be converted to embeddings for:
- Semantic search of similar users
- AI program generation context
- Personalized coaching recommendations

**Vectorization Format**:
```json
{
  "user_profile_text": "Goal: Build Muscle. Persona: Bodybuilder. Activity: Very Active. Frequency: 6 days/week. Duration: 12 weeks. Sex: Male. Age: 28. Weight: 85kg. Height: 180cm. Meals: 5-6/day. Training: Evening. Restrictions: None. Equipment: Full Gym. Injuries: None. Experience: Advanced.",
  "embedding": [0.123, 0.456, ...]
}
```
