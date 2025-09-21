# AI-Powered Meal Photo Recognition - Comprehensive Test Plan

## Test Strategy Overview

This test plan follows Test-Driven Development (TDD) principles for the AI-powered meal photo recognition feature. Tests are designed before implementation to ensure complete coverage and proper functionality.

**Coverage Target**: ≥80% for all components and API routes
**Test Types**: Unit, Integration, E2E, Visual, and AI Model tests
**Test Framework**: Jest + React Testing Library + Playwright

## Component Test Cases

### PhotoCapture Component (`components/nutrition/PhotoCapture.test.tsx`)

#### Rendering Tests
1. **should render camera interface with capture button**
2. **should render file upload option**
3. **should render drag and drop zone**
4. **should show processing state when isProcessing=true**
5. **should disable capture button during processing**

#### Camera Functionality Tests
6. **should request camera permissions on mount**
7. **should display error message when camera access denied**
8. **should show camera preview when permissions granted**
9. **should call onPhotoCapture with image data when capture clicked**
10. **should provide retake option after capture**

#### File Upload Tests
11. **should accept JPEG files via file input**
12. **should accept PNG files via file input**
13. **should reject non-image files with error message**
14. **should show error for files larger than 10MB**
15. **should compress large images automatically**

#### Drag & Drop Tests
16. **should highlight drop zone on drag over**
17. **should accept dropped image files**
18. **should reject dropped non-image files**
19. **should handle multiple files by taking first image**
20. **should show preview of dropped image**

#### Error Handling Tests
21. **should handle camera initialization errors**
22. **should handle corrupt image file errors**
23. **should provide retry mechanism for failed captures**
24. **should call onCancel when cancel button clicked**

### AIAnalysis Component (`components/nutrition/AIAnalysis.test.tsx`)

#### Rendering Tests
25. **should render loading animation during analysis**
26. **should show progress steps indicator**
27. **should display estimated time remaining**
28. **should render analysis results when complete**
29. **should show error state when analysis fails**

#### Analysis Process Tests
30. **should call AI analysis API with image data**
31. **should handle successful analysis response**
32. **should handle API error responses gracefully**
33. **should retry failed requests with exponential backoff**
34. **should timeout long-running requests (30s)**

#### Results Display Tests
35. **should display identified food items list**
36. **should show confidence scores for each item**
37. **should display total nutrition summary**
38. **should render suggested meal name**
39. **should highlight low-confidence items**

#### Interaction Tests
40. **should allow reanalysis with different settings**
41. **should call onAnalysisComplete with results**
42. **should call onError when analysis fails**
43. **should provide manual entry fallback option**

### AIReview Component (`components/nutrition/AIReview.test.tsx`)

#### Rendering Tests
44. **should render original image preview**
45. **should display AI analysis results table**
46. **should show editable food item fields**
47. **should render nutrition totals summary**
48. **should display confidence indicators**

#### Food Item Editing Tests
49. **should allow editing individual food item names**
50. **should allow adjusting portion sizes**
51. **should recalculate nutrition when portions change**
52. **should validate edited nutrition values**
53. **should highlight modified items**

#### Review Actions Tests
54. **should call onConfirm with final meal data**
55. **should include user modifications in confirmed data**
56. **should call onReanalyze when reanalyze clicked**
57. **should call onManualEdit when manual edit clicked**
58. **should prevent confirmation with invalid data**

#### Multiple Items Tests
59. **should handle multiple food items in one photo**
60. **should allow removing incorrectly identified items**
61. **should allow adding missed food items manually**
62. **should merge similar food items when requested**
63. **should split combined items when needed**

#### Data Validation Tests
64. **should validate nutrition values are non-negative**
65. **should ensure meal name is provided**
66. **should check required fields before confirmation**
67. **should sanitize user input to prevent XSS**

## API Test Cases

### Photo Analysis API (`app/api/nutrition/analyze-photo/route.test.ts`)

#### Authentication Tests
68. **should reject unauthenticated requests**
69. **should accept requests with valid user session**
70. **should return 401 for expired sessions**

#### Request Validation Tests
71. **should reject requests without image data**
72. **should validate image data is base64 encoded**
73. **should reject oversized images (>10MB)**
74. **should accept valid JPEG/PNG images**
75. **should validate optional meal category parameter**

#### AI Service Integration Tests
76. **should call OpenAI Vision API with image**
77. **should fallback to Claude API if OpenAI fails**
78. **should handle AI service rate limiting**
79. **should retry failed AI requests with backoff**
80. **should timeout long AI requests (25s)**

#### Response Processing Tests
81. **should parse AI response into structured format**
82. **should validate AI response contains required fields**
83. **should calculate total nutrition from food items**
84. **should generate analysis ID for tracking**
85. **should store analysis for feedback collection**

#### Error Handling Tests
86. **should handle AI service unavailable (503)**
87. **should handle invalid image format errors**
88. **should handle no food detected responses**
89. **should handle malformed AI responses**
90. **should not expose sensitive AI API errors**

#### USDA Database Integration Tests
91. **should lookup nutritional data from USDA API**
92. **should handle USDA API failures gracefully**
93. **should use cached nutrition data when available**
94. **should validate USDA response data**

### Image Upload API (`app/api/nutrition/upload-image/route.test.ts`)

#### File Handling Tests
95. **should accept multipart form data uploads**
96. **should compress uploaded images**
97. **should store images in Supabase storage**
98. **should generate secure temporary URLs**
99. **should set 24-hour expiration on stored images**

#### Security Tests
100. **should validate file types are images only**
101. **should scan uploaded files for malware**
102. **should prevent path traversal attacks**
103. **should limit upload rate per user**
104. **should sanitize file names**

#### Storage Tests
105. **should store images in user-specific folders**
106. **should generate unique file names**
107. **should handle storage quota exceeded**
108. **should clean up failed uploads**

### Feedback API (`app/api/nutrition/analysis-feedback/route.test.ts`)

#### Feedback Collection Tests
109. **should accept user corrections to AI analysis**
110. **should validate feedback data structure**
111. **should store corrections for model improvement**
112. **should update user satisfaction ratings**
113. **should track correction patterns per user**

#### Data Validation Tests
114. **should validate analysis ID exists**
115. **should ensure corrections reference valid food items**
116. **should validate nutrition value corrections**
117. **should sanitize correction text inputs**

## Integration Test Cases

### Full Photo-to-Meal Workflow (`__tests__/integration/photo-to-meal.test.ts`)

#### Happy Path Tests
118. **should complete full workflow: photo → analysis → review → save**
119. **should preserve user edits through workflow**
120. **should create meal record with photo reference**
121. **should navigate back to nutrition dashboard**

#### Error Recovery Tests
122. **should handle AI service failures gracefully**
123. **should allow manual entry fallback**
124. **should preserve user data during network errors**
125. **should retry failed saves automatically**

#### Performance Tests
126. **should complete analysis within 10 seconds**
127. **should handle concurrent photo uploads**
128. **should not block UI during processing**

### Enhanced MealLogForm Integration (`components/nutrition/MealLogForm.integration.test.tsx`)

#### AI Integration Tests
129. **should show photo analysis option in meal form**
130. **should populate form fields from AI analysis**
131. **should allow switching between photo and manual entry**
132. **should preserve existing form validation**

#### Data Flow Tests
133. **should merge AI data with manual inputs**
134. **should handle partial AI analysis results**
135. **should validate combined data before submission**

## Visual and UI Test Cases

### Mobile Responsiveness (`__tests__/visual/mobile-photo.test.ts`)

#### Layout Tests
136. **should render camera interface properly on mobile**
137. **should handle device orientation changes**
138. **should show appropriate touch targets**
139. **should handle native camera app integration**

#### Performance Tests
140. **should not cause memory leaks with large images**
141. **should compress images efficiently on mobile**
142. **should handle low-memory conditions**

### Accessibility Tests (`__tests__/a11y/photo-capture.test.ts`)

#### WCAG Compliance Tests
143. **should provide alt text for all images**
144. **should support keyboard navigation**
145. **should announce state changes to screen readers**
146. **should meet color contrast requirements**
147. **should provide focus indicators**

## AI Model Test Cases

### Food Recognition Accuracy (`__tests__/ai/food-recognition.test.ts`)

#### Recognition Tests (with real test images)
148. **should identify common breakfast foods (eggs, toast, fruit)**
149. **should recognize lunch items (sandwich, salad, soup)**
150. **should detect dinner foods (protein, vegetables, grains)**
151. **should identify snack items (nuts, yogurt, chips)**
152. **should handle mixed meals with multiple items**

#### Portion Estimation Tests
153. **should estimate portions using reference objects**
154. **should provide reasonable defaults without references**
155. **should scale estimates based on plate/container size**
156. **should handle unclear portion visual cues**

#### Edge Case Tests
157. **should handle blurry or low-quality images**
158. **should detect when no food is present**
159. **should handle unusual angles or lighting**
160. **should process complex plated presentations**

#### Confidence Scoring Tests
161. **should provide higher confidence for clear images**
162. **should flag uncertain identifications**
163. **should adjust confidence based on food complexity**
164. **should correlate confidence with actual accuracy**

## Database Test Cases

### Photo Analysis Storage (`__tests__/database/photo-analysis.test.ts`)

#### Schema Tests
165. **should create meal_photo_analyses table correctly**
166. **should enforce foreign key constraints**
167. **should set default values properly**
168. **should handle JSONB data storage**

#### Data Integrity Tests
169. **should link analyses to users correctly**
170. **should associate analyses with meals**
171. **should store AI responses as valid JSON**
172. **should track user corrections**

### User Preferences Storage (`__tests__/database/ai-preferences.test.ts`)

#### Preferences Tests
173. **should store user dietary restrictions**
174. **should save preferred portion units**
175. **should track common foods list**
176. **should calculate satisfaction ratings**

## Security Test Cases

### Image Security (`__tests__/security/image-security.test.ts`)

#### Upload Security Tests
177. **should prevent malicious file uploads**
178. **should validate image file headers**
179. **should reject images with embedded scripts**
180. **should sanitize image metadata**

#### Privacy Tests
181. **should not retain images permanently**
182. **should delete temporary files after expiration**
183. **should not share images with unauthorized users**
184. **should anonymize AI analysis requests**

### API Security (`__tests__/security/api-security.test.ts`)

#### Rate Limiting Tests
185. **should limit photo uploads per user per hour**
186. **should prevent rapid AI analysis requests**
187. **should block suspicious upload patterns**

#### Data Protection Tests
188. **should encrypt stored analysis data**
189. **should validate all user inputs**
190. **should prevent SQL injection in feedback**

## Performance Test Cases

### Load Testing (`__tests__/performance/photo-load.test.ts`)

#### Concurrent Usage Tests
191. **should handle 100 concurrent photo uploads**
192. **should maintain response times under load**
193. **should queue AI requests during peak usage**
194. **should scale storage access appropriately**

#### Memory Management Tests
195. **should release image data after processing**
196. **should prevent memory leaks in components**
197. **should handle large image batches efficiently**

## Error Scenario Test Cases

### Network Failure Tests (`__tests__/errors/network-failures.test.ts`)

#### Connectivity Tests
198. **should handle offline state gracefully**
199. **should retry requests when connection restored**
200. **should save progress locally during outages**
201. **should sync when connectivity returns**

### Service Degradation Tests
202. **should fallback when primary AI service down**
203. **should use cached data when APIs unavailable**
204. **should provide manual entry when all AI fails**
205. **should maintain core functionality without AI**

## Test Data Management

### Test Image Assets (`__tests__/fixtures/images/`)

**Required Test Images**:
- `breakfast-eggs-toast.jpg` - Clear breakfast plate
- `lunch-sandwich-salad.jpg` - Mixed lunch items
- `dinner-steak-vegetables.jpg` - Protein and vegetables
- `snack-mixed-nuts.jpg` - Portion estimation test
- `blurry-food.jpg` - Quality test image
- `no-food-table.jpg` - Negative test case
- `multiple-items-feast.jpg` - Complex meal test
- `reference-object-coin.jpg` - Portion scaling test

### Mock AI Responses (`__tests__/fixtures/ai-responses/`)

**Structured Test Responses**:
- `successful-analysis.json` - Complete AI response
- `low-confidence-analysis.json` - Uncertain results
- `multiple-foods-analysis.json` - Complex meal
- `no-food-detected.json` - Negative result
- `partial-analysis.json` - Incomplete response

### Database Fixtures (`__tests__/fixtures/database/`)

**Test Data**:
- `test-users.sql` - User accounts for testing
- `sample-analyses.sql` - Historical analysis data
- `nutrition-data.sql` - USDA reference data subset

## Test Automation and CI/CD

### GitHub Actions Workflow (`.github/workflows/nutrition-ai-tests.yml`)

**Test Pipeline**:
1. **Unit Tests**: All component and API tests
2. **Integration Tests**: Full workflow tests
3. **Visual Tests**: Screenshot comparisons
4. **Performance Tests**: Load and memory tests
5. **Security Scans**: Vulnerability checks
6. **AI Model Tests**: Recognition accuracy validation

**Quality Gates**:
- ✅ All tests pass (0 failures)
- ✅ Coverage ≥80% for all components
- ✅ Performance within SLA (<10s analysis)
- ✅ Security scan clean
- ✅ Accessibility compliance (WCAG 2.1 AA)

### Test Environment Setup

**Required Environment Variables**:
```env
OPENAI_API_KEY=test_key_xxxxx
ANTHROPIC_API_KEY=test_key_xxxxx
USDA_API_KEY=test_key_xxxxx
SUPABASE_URL=test_instance_url
SUPABASE_ANON_KEY=test_anon_key
```

**Mock Services**:
- Mock OpenAI Vision API responses
- Mock USDA nutrition database
- Mock Supabase storage operations
- Mock camera/file system access

## Success Criteria

### Test Coverage Requirements

**Minimum Coverage Targets**:
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

**Component-Specific Targets**:
- `PhotoCapture`: 85% (critical user interface)
- `AIAnalysis`: 90% (core AI integration)
- `AIReview`: 85% (data validation critical)
- API routes: 90% (business logic critical)

### Quality Metrics

**Test Quality Indicators**:
- ✅ All 205 test cases implemented
- ✅ Zero flaky tests in CI pipeline
- ✅ Test execution time <5 minutes
- ✅ Clear test failure messages
- ✅ Comprehensive edge case coverage

### Definition of Test Completion

**Tests are complete when**:
1. All 205 test cases pass consistently
2. Coverage targets met for all components
3. AI model accuracy tests validate >80% recognition
4. Performance tests confirm <10s analysis time
5. Security tests pass all vulnerability checks
6. Accessibility tests meet WCAG 2.1 AA standards
7. Integration tests cover all user workflows
8. Error handling tests cover all failure modes

This comprehensive test plan ensures the AI photo recognition feature is robust, accurate, and user-friendly while maintaining the high quality standards established in Sub-Feature 1.