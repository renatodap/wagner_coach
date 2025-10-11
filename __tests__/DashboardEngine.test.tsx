/**
 * Tests for DashboardEngine component
 *
 * Run with: npm test DashboardEngine.test.tsx
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { DashboardEngine } from '@/components/dashboard/DashboardEngine'
import { fetchDashboardContext } from '@/lib/api/dashboard'

// Mock API client
jest.mock('@/lib/api/dashboard')

const mockFetchDashboardContext = fetchDashboardContext as jest.MockedFunction<
  typeof fetchDashboardContext
>

describe('DashboardEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading skeleton initially', () => {
    mockFetchDashboardContext.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<DashboardEngine userId="test-user" variant="balanced" />)

    expect(screen.getByLabelText(/loading dashboard card/i)).toBeInTheDocument()
  })

  it('renders cards after context loads', async () => {
    const mockContext = {
      user: {
        hasCompletedConsultation: true,
        hasActiveProgram: true,
        streakDays: 5,
        tracksWeight: true,
        showsWeightCard: true,
        showsRecoveryCard: false,
        showsWorkoutCard: true,
      },
      program: {
        dayNumber: 10,
        adherenceLast3Days: 85,
        weekNumber: 2,
        programName: 'Test Program',
      },
      events: null,
    }

    mockFetchDashboardContext.mockResolvedValue(mockContext)

    render(<DashboardEngine userId="test-user" variant="balanced" />)

    // Wait for cards to render
    await waitFor(() => {
      expect(screen.queryByLabelText(/loading dashboard card/i)).not.toBeInTheDocument()
    })

    // Verify key cards are present
    expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument()
    expect(screen.getByText(/Nutrition/i)).toBeInTheDocument()
  })

  it('shows consultation banner when incomplete', async () => {
    const mockContext = {
      user: {
        hasCompletedConsultation: false, // Incomplete
        hasActiveProgram: false,
        streakDays: 0,
        tracksWeight: false,
        showsWeightCard: false,
        showsRecoveryCard: false,
        showsWorkoutCard: true,
      },
    }

    mockFetchDashboardContext.mockResolvedValue(mockContext)

    render(<DashboardEngine userId="test-user" variant="balanced" />)

    await waitFor(() => {
      expect(screen.getByText(/Complete Your Consultation/i)).toBeInTheDocument()
    })
  })

  it('shows streak card when streak >= 3 days', async () => {
    const mockContext = {
      user: {
        hasCompletedConsultation: true,
        hasActiveProgram: true,
        streakDays: 7, // 7 day streak
        tracksWeight: false,
        showsWeightCard: false,
        showsRecoveryCard: false,
        showsWorkoutCard: true,
      },
    }

    mockFetchDashboardContext.mockResolvedValue(mockContext)

    render(<DashboardEngine userId="test-user" variant="balanced" />)

    await waitFor(() => {
      expect(screen.getByText(/7 day streak/i)).toBeInTheDocument()
    })
  })

  it('does NOT show streak card when streak < 3 days', async () => {
    const mockContext = {
      user: {
        hasCompletedConsultation: true,
        hasActiveProgram: true,
        streakDays: 2, // Only 2 days
        tracksWeight: false,
        showsWeightCard: false,
        showsRecoveryCard: false,
        showsWorkoutCard: true,
      },
    }

    mockFetchDashboardContext.mockResolvedValue(mockContext)

    render(<DashboardEngine userId="test-user" variant="balanced" />)

    await waitFor(() => {
      expect(screen.queryByText(/day streak/i)).not.toBeInTheDocument()
    })
  })

  it('shows NextActionCard for Simple variant', async () => {
    const mockContext = {
      user: {
        hasCompletedConsultation: true,
        hasActiveProgram: true,
        streakDays: 5,
        tracksWeight: false,
        showsWeightCard: false,
        showsRecoveryCard: false,
        showsWorkoutCard: true,
      },
    }

    mockFetchDashboardContext.mockResolvedValue(mockContext)

    render(<DashboardEngine userId="test-user" variant="simple" />)

    await waitFor(() => {
      expect(screen.getByText(/Next Action/i)).toBeInTheDocument()
    })
  })

  it('shows TodaysPlanCard for Balanced variant', async () => {
    const mockContext = {
      user: {
        hasCompletedConsultation: true,
        hasActiveProgram: true,
        streakDays: 5,
        tracksWeight: false,
        showsWeightCard: false,
        showsRecoveryCard: false,
        showsWorkoutCard: true,
      },
    }

    mockFetchDashboardContext.mockResolvedValue(mockContext)

    render(<DashboardEngine userId="test-user" variant="balanced" />)

    await waitFor(() => {
      expect(screen.getByText(/Today's Plan/i)).toBeInTheDocument()
    })
  })

  it('shows weight card when enabled', async () => {
    const mockContext = {
      user: {
        hasCompletedConsultation: true,
        hasActiveProgram: true,
        streakDays: 5,
        tracksWeight: true,
        showsWeightCard: true, // Enabled
        showsRecoveryCard: false,
        showsWorkoutCard: true,
      },
    }

    mockFetchDashboardContext.mockResolvedValue(mockContext)

    render(<DashboardEngine userId="test-user" variant="balanced" />)

    await waitFor(() => {
      expect(screen.getByText(/Weight Tracking/i)).toBeInTheDocument()
    })
  })

  it('shows coach insight when adherence < 60%', async () => {
    const mockContext = {
      user: {
        hasCompletedConsultation: true,
        hasActiveProgram: true,
        streakDays: 5,
        tracksWeight: false,
        showsWeightCard: false,
        showsRecoveryCard: false,
        showsWorkoutCard: true,
      },
      program: {
        dayNumber: 10,
        adherenceLast3Days: 50, // Low adherence
        weekNumber: 2,
        programName: 'Test Program',
      },
    }

    mockFetchDashboardContext.mockResolvedValue(mockContext)

    render(<DashboardEngine userId="test-user" variant="balanced" />)

    await waitFor(() => {
      expect(screen.getByText(/Let's get back on track/i)).toBeInTheDocument()
    })
  })

  it('shows event countdown when event within 30 days', async () => {
    const mockContext = {
      user: {
        hasCompletedConsultation: true,
        hasActiveProgram: true,
        streakDays: 5,
        tracksWeight: false,
        showsWeightCard: false,
        showsRecoveryCard: false,
        showsWorkoutCard: true,
      },
      events: {
        primaryEvent: {
          name: 'Half Marathon',
          date: '2025-11-01',
          daysUntil: 21,
        },
      },
    }

    mockFetchDashboardContext.mockResolvedValue(mockContext)

    render(<DashboardEngine userId="test-user" variant="balanced" />)

    await waitFor(() => {
      expect(screen.getByText(/Half Marathon/i)).toBeInTheDocument()
      expect(screen.getByText(/21 days/i)).toBeInTheDocument()
    })
  })

  it('shows error state on API failure', async () => {
    mockFetchDashboardContext.mockRejectedValue(new Error('API error'))

    render(<DashboardEngine userId="test-user" variant="balanced" />)

    await waitFor(() => {
      expect(screen.getByText(/unable to load dashboard/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  it('retries on error state button click', async () => {
    // First call fails
    mockFetchDashboardContext.mockRejectedValueOnce(new Error('API error'))

    // Second call succeeds
    const mockContext = {
      user: {
        hasCompletedConsultation: true,
        hasActiveProgram: true,
        streakDays: 5,
        tracksWeight: false,
        showsWeightCard: false,
        showsRecoveryCard: false,
        showsWorkoutCard: true,
      },
    }
    mockFetchDashboardContext.mockResolvedValueOnce(mockContext)

    render(<DashboardEngine userId="test-user" variant="balanced" />)

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/unable to load dashboard/i)).toBeInTheDocument()
    })

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /retry/i })
    fireEvent.click(retryButton)

    // Wait for success
    await waitFor(() => {
      expect(screen.queryByText(/unable to load dashboard/i)).not.toBeInTheDocument()
      expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument()
    })
  })

  it('logs behavior signal on mount', async () => {
    const mockContext = {
      user: {
        hasCompletedConsultation: true,
        hasActiveProgram: true,
        streakDays: 5,
        tracksWeight: false,
        showsWeightCard: false,
        showsRecoveryCard: false,
        showsWorkoutCard: true,
      },
    }

    mockFetchDashboardContext.mockResolvedValue(mockContext)

    const logBehaviorSignal = jest.fn()
    jest.mock('@/lib/api/dashboard', () => ({
      fetchDashboardContext: mockFetchDashboardContext,
      logBehaviorSignal,
    }))

    render(<DashboardEngine userId="test-user" variant="balanced" />)

    await waitFor(() => {
      expect(logBehaviorSignal).toHaveBeenCalledWith(
        'dashboard_open',
        'balanced',
        expect.objectContaining({ timestamp: expect.any(String) })
      )
    })
  })
})
