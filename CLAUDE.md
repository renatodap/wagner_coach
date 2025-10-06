# Production-Level Development Standards - Wagner Coach Frontend

This document defines the mandatory standards for all production-level code in the Wagner Coach frontend application. Claude Code must follow these standards for every feature, component, and deployment.

---

## Core Principle
**Production-level means the code is ready to be used by real users, withstand scrutiny from other developers, pass legal requirements, and operate reliably at scale with delightful UX.**

---

## 1. Development Process (TDD + UI Verification)

All features **MUST** follow this 7-step sequence:

### Step 1: Feature Design
- Create `docs/design/{feature}.md` with:
  - User stories & user flows
  - UI mockups or wireframes
  - Component hierarchy
  - API integration points
  - State management approach
  - Edge cases & error states

### Step 2: Test Design
- Create `docs/testing/{feature}_test.md` with:
  - Test scenarios (happy path, edge cases, errors)
  - Component testing approach
  - Integration testing plan
  - E2E user flows
  - Accessibility testing checklist

### Step 3: Code Design
- Define TypeScript interfaces/types first
- Plan component structure
- Define props interfaces
- Plan state management (useState, useContext, etc.)
- Define API client functions

### Step 4: Test Implementation
- Write tests **BEFORE** implementation
- Component tests with React Testing Library
- Integration tests for forms & user flows
- E2E tests for critical paths
- Accessibility tests

### Step 5: Feature Implementation
- Implement until all tests pass
- Follow code quality standards (Section 2)
- Handle all error cases
- Add loading states
- Implement responsive design

### Step 6: Validation
- Run all linters (ESLint, TypeScript)
- Manual testing across devices
- Lighthouse score verification
- Accessibility testing with axe

### Step 7: UI Verification (MANDATORY)
Every single aspect must be accessible and functional through UI:

#### 7a. Verify All Buttons Created
- [ ] Every action has a corresponding button/link
- [ ] No orphaned functionality (backend features must have UI)
- [ ] All buttons are properly labeled with descriptive text
- [ ] Icons have accessible labels

#### 7b. Verify All Pages Accessible
- [ ] All routes are linked from navigation or other pages
- [ ] No dead-end pages without back navigation
- [ ] Bottom nav works on all pages
- [ ] Deep linking works (refresh on any page)

#### 7c. Verify Button Feedback
- [ ] Loading states (spinners, skeleton screens, disabled buttons)
- [ ] Success confirmations (toasts, modals, inline messages)
- [ ] Error messages (user-friendly, actionable, specific)
- [ ] Disabled states when action unavailable (with tooltips explaining why)
- [ ] Hover states clearly indicate clickability

#### 7d. Verify Button Visibility
- [ ] Sufficient contrast (WCAG AA: 4.5:1 for text, 3:1 for UI)
- [ ] Clear visual hierarchy (primary, secondary, tertiary actions)
- [ ] Adequate size (minimum 44x44px touch target on mobile)
- [ ] Consistent styling across app (use design tokens)
- [ ] Clear focus indicators for keyboard navigation (visible ring)

#### 7e. Verify Style Best Practices
- [ ] Responsive on mobile (320px), tablet (768px), desktop (1024px+)
- [ ] Consistent spacing (use Tailwind spacing scale)
- [ ] Professional typography hierarchy (clear heading levels)
- [ ] Color system follows brand guidelines
- [ ] Smooth transitions and animations (not janky)
- [ ] No layout shifts or content jumping (CLS)
- [ ] Images optimized (Next.js Image component)

---

## 2. Code Quality Standards

### TypeScript
```typescript
// ✅ REQUIRED
- Strict mode enabled in tsconfig.json
- No 'any' types (use 'unknown' if necessary)
- Explicit return types on functions
- Interfaces for all data structures
- Zod schemas for API response validation
- Proper null checking

// ❌ FORBIDDEN
- Type assertions without validation (as Type)
- Ignoring TypeScript errors with @ts-ignore
- Implicit any
- Unused variables/imports
- Non-null assertions (!.) without checks
```

### File Structure
```
wagner-coach-clean/
├── app/                           # Next.js App Router
│   ├── (auth)/
│   │   ├── login/                # Login page
│   │   ├── signup/               # Signup page
│   │   └── onboarding/           # User onboarding
│   ├── dashboard/                # Dashboard page
│   ├── coach/                    # AI coach chat
│   ├── programs/                 # AI program generation
│   │   └── [program_id]/         # Program detail pages
│   ├── quick-entry-optimized/    # Multimodal quick entry
│   ├── nutrition/                # Meal history
│   ├── workouts/                 # Workout logging
│   ├── activities/               # Strava/Garmin activities
│   ├── analytics/                # Progress charts
│   ├── profile/                  # User profile
│   ├── settings/                 # App settings
│   ├── api/                      # API routes (backend proxy)
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── Coach/                    # Coach-specific components
│   │   ├── ChatMessage.tsx
│   │   ├── QuickActions.tsx
│   │   └── StreamingResponse.tsx
│   ├── Programs/                 # Program components
│   │   ├── ProgramCard.tsx
│   │   ├── DayView.tsx
│   │   └── CalendarView.tsx
│   ├── QuickEntry/               # Quick entry components
│   │   ├── TextInput.tsx
│   │   ├── VoiceRecorder.tsx
│   │   ├── ImageUpload.tsx
│   │   └── ResultPreview.tsx
│   ├── Nutrition/                # Nutrition components
│   ├── Workouts/                 # Workout components
│   └── shared/                   # Shared components
│       ├── BottomNav.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── lib/
│   ├── api/                      # API client functions
│   │   ├── coach.ts
│   │   ├── programs.ts
│   │   ├── quick-entry.ts
│   │   ├── nutrition.ts
│   │   └── workouts.ts
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client
│   ├── auth/                     # Auth utilities
│   ├── utils/                    # Helper functions
│   │   ├── date.ts
│   │   ├── formatting.ts
│   │   └── validation.ts
│   └── validations/              # Zod schemas
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── useCoach.ts
│   ├── usePrograms.ts
│   └── useQuickEntry.ts
├── types/                        # TypeScript type definitions
│   ├── api.ts                    # API response types
│   ├── database.ts               # Database types
│   └── index.ts
├── public/                       # Static assets
├── middleware.ts                 # Next.js middleware (auth)
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── .env.example                  # Environment variables template
└── README.md
```

### Naming Conventions
- **Files**: `kebab-case.tsx` for pages, `PascalCase.tsx` for components
- **Components**: `PascalCase` (e.g., `QuickEntryForm`, `MealCard`)
- **Functions**: `camelCase` (e.g., `fetchUserMeals`, `formatDate`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`, `API_BASE_URL`)
- **Types/Interfaces**: `PascalCase` (e.g., `MealLog`, `User`, `CoachMessage`)
- **Hooks**: `use` prefix (e.g., `useAuth`, `useToast`)

### Code Organization
```typescript
// Component structure (top to bottom)
1. Imports (external, then internal)
2. Type definitions
3. Constants
4. Main component function
5. Helper functions (or extract to utils/)
6. Exports

// Example:
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { fetchUserMeals } from '@/lib/api/nutrition'
import type { MealLog } from '@/types/api'

interface MealHistoryProps {
  userId: string
  startDate?: string
  endDate?: string
}

const DEFAULT_PAGE_SIZE = 20

export function MealHistory({ userId, startDate, endDate }: MealHistoryProps) {
  const [meals, setMeals] = useState<MealLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadMeals()
  }, [userId, startDate, endDate])

  async function loadMeals() {
    try {
      setIsLoading(true)
      setError(null)
      const data = await fetchUserMeals(userId, { startDate, endDate })
      setMeals(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load meals'
      setError(message)
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <MealHistorySkeleton />
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={loadMeals} />
  }

  return (
    <div className="space-y-4">
      {meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} />
      ))}
    </div>
  )
}

function MealHistorySkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="h-32 animate-pulse bg-gray-200" />
      ))}
    </div>
  )
}
```

---

## 3. Security Standards

### Environment Variables
```typescript
// ✅ REQUIRED
// .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_BASE_URL=https://api.wagnercoach.com
NEXT_PUBLIC_APP_URL=https://wagnercoach.com

// Validation (lib/env.ts)
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
})
```

### Authentication
```typescript
// Always check auth on protected pages
// middleware.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/', '/login', '/signup']
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname)
  const isAuthRoute = authRoutes.includes(request.nextUrl.pathname)

  // Redirect to login if not authenticated
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to dashboard if already authenticated
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### Input Validation
```typescript
// Validate ALL user inputs with Zod
import { z } from 'zod'

const mealLogSchema = z.object({
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  logged_at: z.string().datetime(),
  calories: z.number().int().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(1000),
  fats: z.number().min(0).max(1000),
  foods: z.array(z.string()).max(20),
  notes: z.string().max(500).optional(),
})

type MealLogInput = z.infer<typeof mealLogSchema>

function validateMealLog(data: unknown): MealLogInput {
  return mealLogSchema.parse(data)
}
```

### Data Handling
- Never log sensitive data (passwords, tokens)
- Sanitize error messages before showing to users
- Use HTTPS only (enforce in production)
- Implement CSRF protection (Next.js handles this)
- Validate file uploads (size, type, content)
- Never trust client-side validation alone

---

## 4. UI/UX Standards

### Responsive Design
```typescript
// Mobile-first approach with Tailwind
// Always test on multiple screen sizes

<div className="
  px-4 sm:px-6 lg:px-8          // Responsive padding
  max-w-7xl mx-auto             // Max width container
  grid grid-cols-1              // Mobile: 1 column
  sm:grid-cols-2                // Tablet: 2 columns
  lg:grid-cols-3                // Desktop: 3 columns
  gap-4 sm:gap-6                // Responsive gap
">
  {/* Content */}
</div>

// Breakpoints:
// sm: 640px   (tablet)
// md: 768px   (small laptop)
// lg: 1024px  (desktop)
// xl: 1280px  (large desktop)
// 2xl: 1536px (extra large)
```

### Accessibility (WCAG 2.1 Level AA)
```typescript
// ✅ REQUIRED
- Semantic HTML (header, nav, main, footer, article)
- ARIA labels for interactive elements
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Focus visible indicators (focus-visible:ring-2)
- Alt text for all images
- Color contrast ratios (4.5:1 text, 3:1 UI)
- Screen reader testing with VoiceOver/NVDA

// Example accessible button:
<button
  type="button"
  aria-label="Delete meal log"
  aria-describedby="delete-warning"
  disabled={isDeleting}
  className="
    px-4 py-2
    bg-red-600 hover:bg-red-700
    text-white font-medium
    rounded-lg
    focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-200
  "
  onClick={handleDelete}
>
  {isDeleting ? (
    <>
      <Spinner className="inline mr-2" />
      Deleting...
    </>
  ) : (
    'Delete'
  )}
</button>

<p id="delete-warning" className="sr-only">
  This will permanently delete the meal log and cannot be undone.
</p>
```

### Loading States
```typescript
// Required for all async operations:

// 1. Skeleton screens (page loads, lists)
export function MealListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}

// 2. Inline spinners (button actions)
<Button disabled={isLoading}>
  {isLoading && <Spinner className="mr-2" />}
  {isLoading ? 'Saving...' : 'Save Meal'}
</Button>

// 3. Progress indicators (uploads, AI processing)
<div className="space-y-2">
  <Progress value={progress} max={100} />
  <p className="text-sm text-gray-600">{status}</p>
</div>

// 4. Optimistic UI (instant feedback)
const [meals, setMeals] = useState<MealLog[]>([])

async function addMeal(meal: MealLog) {
  // Add optimistically
  const tempId = `temp-${Date.now()}`
  const optimisticMeal = { ...meal, id: tempId }
  setMeals([optimisticMeal, ...meals])

  try {
    const savedMeal = await saveMeal(meal)
    // Replace temp with real data
    setMeals(meals => meals.map(m => m.id === tempId ? savedMeal : m))
  } catch (error) {
    // Remove on error
    setMeals(meals => meals.filter(m => m.id !== tempId))
    toast({ title: 'Error', description: 'Failed to save meal', variant: 'destructive' })
  }
}
```

### Error Handling
```typescript
// User-facing errors must be:
// - Clear and actionable
// - Non-technical language
// - Suggest next steps
// - Offer retry/fallback options

// ✅ Good error messages:
"Unable to upload photo. Please check your internet connection and try again."
"AI processing is taking longer than usual. Your request is still being processed."
"Failed to save meal. Please try again or contact support if the issue persists."

// ❌ Bad error messages:
"Error 500: Internal Server Error"
"Network request failed"
"Undefined is not an object"

// Error component:
interface ErrorDisplayProps {
  title?: string
  message: string
  onRetry?: () => void
  showSupport?: boolean
}

export function ErrorDisplay({
  title = 'Something went wrong',
  message,
  onRetry,
  showSupport = true
}: ErrorDisplayProps) {
  return (
    <Card className="p-6 text-center">
      <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      <div className="flex gap-2 justify-center">
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
        {showSupport && (
          <Button variant="outline" asChild>
            <a href="mailto:support@wagnercoach.com">Contact Support</a>
          </Button>
        )}
      </div>
    </Card>
  )
}
```

### Feedback Mechanisms
```typescript
// Use toast notifications for feedback
import { useToast } from '@/hooks/use-toast'

const { toast } = useToast()

// Success (green, auto-dismiss in 3-5 seconds)
toast({
  title: 'Meal saved!',
  description: '450 calories logged with 35g protein',
  variant: 'success',
})

// Error (red, dismissible)
toast({
  title: 'Failed to save meal',
  description: 'Please try again or contact support',
  variant: 'destructive',
})

// Info (blue, dismissible)
toast({
  title: 'Processing image',
  description: 'This may take a few seconds',
  variant: 'default',
})

// Loading (with action feedback)
<Button disabled={isProcessing}>
  {isProcessing ? (
    <>
      <Spinner className="mr-2" />
      Processing image...
    </>
  ) : (
    'Upload Photo'
  )}
</Button>
```

---

## 5. Performance Standards

### Metrics (Lighthouse)
- Performance: ≥90
- Accessibility: 100
- Best Practices: 100
- SEO: ≥90

### Optimization Checklist
```typescript
// ✅ REQUIRED

// 1. Images: Next.js Image component
import Image from 'next/image'

<Image
  src="/meal-photo.jpg"
  alt="Grilled chicken with vegetables"
  width={400}
  height={300}
  className="rounded-lg"
  priority={false}  // Only true for above-the-fold images
/>

// 2. Code splitting: Dynamic imports
import dynamic from 'next/dynamic'

const CoachChat = dynamic(() => import('@/components/Coach/ChatInterface'), {
  loading: () => <ChatSkeleton />,
  ssr: false,  // Client-only if needed
})

// 3. Lazy loading: Below-the-fold content
import { lazy, Suspense } from 'react'

const AnalyticsCharts = lazy(() => import('@/components/Analytics/Charts'))

function AnalyticsPage() {
  return (
    <Suspense fallback={<ChartsSkeleton />}>
      <AnalyticsCharts />
    </Suspense>
  )
}

// 4. API calls: Debounce & cache
import { useDebounce } from '@/hooks/useDebounce'
import useSWR from 'swr'

function SearchMeals() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  const { data, error, isLoading } = useSWR(
    debouncedQuery ? `/api/search?q=${debouncedQuery}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search meals..."
    />
  )
}

// 5. Memoization: Expensive calculations
import { useMemo } from 'react'

function NutritionSummary({ meals }: { meals: MealLog[] }) {
  const totals = useMemo(() => {
    return meals.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fats: acc.fats + meal.fats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 })
  }, [meals])

  return <div>{/* Display totals */}</div>
}
```

---

## 6. Testing Standards

### Test Coverage
- Minimum 80% overall coverage
- 100% coverage for critical paths:
  - Authentication flow
  - Quick entry processing
  - Meal/workout logging
  - Coach chat

### Testing Tools
```json
{
  "unit": "Vitest + React Testing Library",
  "integration": "Vitest + MSW (API mocking)",
  "e2e": "Playwright",
  "accessibility": "@axe-core/react"
}
```

### Test Structure
```typescript
// __tests__/components/QuickEntry/TextInput.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { TextInput } from '@/components/QuickEntry/TextInput'

describe('TextInput', () => {
  it('should process text input and show result', async () => {
    const mockOnSubmit = vi.fn()
    render(<TextInput onSubmit={mockOnSubmit} />)

    const input = screen.getByPlaceholderText(/what did you eat/i)
    const submitButton = screen.getByRole('button', { name: /submit/i })

    fireEvent.change(input, { target: { value: 'chicken and rice' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        text: 'chicken and rice',
        type: 'meal',
      })
    })
  })

  it('should show error for empty input', () => {
    render(<TextInput onSubmit={vi.fn()} />)

    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)

    expect(screen.getByText(/please enter some text/i)).toBeInTheDocument()
  })

  it('should be keyboard accessible', () => {
    render(<TextInput onSubmit={vi.fn()} />)

    const input = screen.getByPlaceholderText(/what did you eat/i)
    input.focus()

    expect(input).toHaveFocus()
    expect(input).toHaveAccessibleName()
  })
})
```

---

## 7. Wagner Coach-Specific Patterns

### Bottom Navigation
```typescript
// Always visible on all pages except landing
// components/shared/BottomNav.tsx

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/programs', icon: Calendar, label: 'Programs' },
  { href: '/quick-entry-optimized', icon: PlusCircle, label: 'Quick Entry' },
  { href: '/coach', icon: MessageCircle, label: 'Coach' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="
      fixed bottom-0 left-0 right-0
      bg-white border-t border-gray-200
      safe-area-pb  // iOS safe area
      z-50
    ">
      <div className="max-w-screen-xl mx-auto">
        <ul className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
                    isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
```

### Multimodal Quick Entry
```typescript
// Quick entry handles text, voice, images
// Components must handle all input types gracefully

"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TextInput } from '@/components/QuickEntry/TextInput'
import { VoiceRecorder } from '@/components/QuickEntry/VoiceRecorder'
import { ImageUpload } from '@/components/QuickEntry/ImageUpload'

export function QuickEntryForm() {
  const [result, setResult] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  async function handleTextSubmit(text: string) {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/quick-entry/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to process text', variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleImageSubmit(imageFile: File) {
    setIsProcessing(true)
    try {
      // Upload to Supabase Storage first
      const imageUrl = await uploadImage(imageFile)

      // Process with AI
      const response = await fetch('/api/quick-entry/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to process image', variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleVoiceSubmit(audioBlob: Blob) {
    setIsProcessing(true)
    try {
      // Upload audio to backend
      const formData = new FormData()
      formData.append('audio', audioBlob)

      const response = await fetch('/api/quick-entry/voice', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to process voice', variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="text">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="image">Photo</TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <TextInput onSubmit={handleTextSubmit} isProcessing={isProcessing} />
        </TabsContent>

        <TabsContent value="voice">
          <VoiceRecorder onSubmit={handleVoiceSubmit} isProcessing={isProcessing} />
        </TabsContent>

        <TabsContent value="image">
          <ImageUpload onSubmit={handleImageSubmit} isProcessing={isProcessing} />
        </TabsContent>
      </Tabs>

      {isProcessing && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Spinner />
            <p className="text-sm text-gray-600">Processing your entry...</p>
          </div>
        </Card>
      )}

      {result && <ResultPreview result={result} />}
    </div>
  )
}
```

### Streaming AI Responses
```typescript
// Coach chat uses streaming for better UX

"use client"

import { useState } from 'react'
import { useChat } from '@/hooks/useChat'

export function CoachChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  async function sendMessage() {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages([...messages, userMessage])
    setInput('')
    setIsStreaming(true)

    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = { role: 'assistant', content: '' }

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          assistantMessage.content += chunk

          // Update UI with each chunk
          setMessages((prev) => {
            const withoutLast = prev.slice(0, -1)
            return [...withoutLast, assistantMessage]
          })
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' })
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, i) => (
          <ChatMessage key={i} message={message} />
        ))}
        {isStreaming && <TypingIndicator />}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask your coach anything..."
            className="flex-1 px-4 py-2 border rounded-lg"
            disabled={isStreaming}
          />
          <Button onClick={sendMessage} disabled={isStreaming || !input.trim()}>
            {isStreaming ? <Spinner /> : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 8. Quick Reference: Daily Checklist

When implementing any frontend feature:
- [ ] Create design doc with UI mockups
- [ ] Create test plan
- [ ] Define TypeScript types
- [ ] Write component tests first
- [ ] Implement component
- [ ] Add loading states
- [ ] Add error handling
- [ ] Implement responsive design (mobile, tablet, desktop)
- [ ] Test keyboard navigation
- [ ] Test with screen reader
- [ ] Verify color contrast (WCAG AA)
- [ ] Optimize images (Next.js Image)
- [ ] Test on real mobile device
- [ ] Run Lighthouse audit
- [ ] Update documentation

---

## Summary: Production-Level Frontend

Code is production-level when:
1. ✅ All 7 TDD steps completed
2. ✅ All UI elements verified (7a-7e)
3. ✅ Fully responsive (mobile, tablet, desktop)
4. ✅ Accessible (WCAG AA)
5. ✅ Loading states everywhere
6. ✅ Error handling comprehensive
7. ✅ Test coverage ≥80%
8. ✅ Lighthouse scores ≥90
9. ✅ Bottom nav works on all pages
10. ✅ Ready for real users without shame

**If you can hand your phone to a user and they intuitively know what to do, it's production-level.**

---

**Remember**: Users don't see your code, they experience your UI. Make every interaction delightful, accessible, and intuitive.
