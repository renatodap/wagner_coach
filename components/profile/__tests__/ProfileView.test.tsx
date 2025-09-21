import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileView } from '../ProfileView';
import { Profile, UserGoal } from '@/types/profile';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('ProfileView Component', () => {
  const mockProfile: Profile = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    age: 30,
    experience_level: 'intermediate',
    about_me: 'Fitness enthusiast looking to improve strength',
    fitness_goals: ['weight_loss', 'muscle_gain'],
    available_equipment: ['dumbbells', 'resistance_bands'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z'
  };

  const mockGoals: UserGoal[] = [
    {
      id: 'goal-1',
      user_id: 'user-123',
      goal_type: 'weight_loss',
      goal_description: 'Lose 15 pounds',
      target_value: 15,
      target_unit: 'lbs',
      priority: 1,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-20T00:00:00Z'
    },
    {
      id: 'goal-2',
      user_id: 'user-123',
      goal_type: 'strength',
      goal_description: 'Bench press 200 lbs',
      target_value: 200,
      target_unit: 'lbs',
      priority: 2,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-20T00:00:00Z'
    }
  ];

  const mockStats = {
    totalWorkouts: 25,
    currentStreak: 7,
    goalsCompleted: 3,
    totalMinutes: 1200,
    favoriteActivity: 'strength_training',
    progressThisWeek: 85
  };

  const mockRecentActivity = [
    {
      id: 'activity-1',
      type: 'workout',
      description: 'Completed strength workout',
      created_at: '2024-01-20T10:00:00Z'
    },
    {
      id: 'activity-2',
      type: 'goal_update',
      description: 'Updated weight loss progress',
      created_at: '2024-01-19T15:30:00Z'
    }
  ];

  const defaultProps = {
    profile: mockProfile,
    goals: mockGoals,
    stats: mockStats,
    recentActivity: mockRecentActivity,
    onEditProfile: jest.fn(),
    onEditGoal: jest.fn(),
    onAddGoal: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Profile Display', () => {
    test('should render all profile sections', () => {
      render(<ProfileView {...defaultProps} />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('30 years old')).toBeInTheDocument();
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('Fitness enthusiast looking to improve strength')).toBeInTheDocument();
    });

    test('should show user avatar and basic info', () => {
      render(<ProfileView {...defaultProps} />);

      expect(screen.getByRole('img', { name: /profile avatar/i })).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    test('should display quick stats correctly', () => {
      render(<ProfileView {...defaultProps} />);

      expect(screen.getByText('25')).toBeInTheDocument(); // Total workouts
      expect(screen.getByText('7')).toBeInTheDocument(); // Current streak
      expect(screen.getByText('3')).toBeInTheDocument(); // Goals completed
      expect(screen.getByText('1,200')).toBeInTheDocument(); // Total minutes
    });

    test('should handle missing profile data gracefully', () => {
      const incompleteProfile = {
        ...mockProfile,
        full_name: null,
        age: null,
        about_me: null
      };

      render(<ProfileView {...defaultProps} profile={incompleteProfile} />);

      expect(screen.getByText('Unknown User')).toBeInTheDocument();
      expect(screen.getByText('Age not provided')).toBeInTheDocument();
      expect(screen.getByText('No description provided')).toBeInTheDocument();
    });

    test('should show loading state while fetching', () => {
      render(<ProfileView {...defaultProps} profile={null} />);

      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });
  });

  describe('Goal Display', () => {
    test('should render active goals list', () => {
      render(<ProfileView {...defaultProps} />);

      expect(screen.getByText('Lose 15 pounds')).toBeInTheDocument();
      expect(screen.getByText('Bench press 200 lbs')).toBeInTheDocument();
    });

    test('should show goal progress bars', () => {
      const goalsWithProgress = mockGoals.map(goal => ({
        ...goal,
        progress: goal.id === 'goal-1' ? 60 : 75 // 60% and 75% progress
      }));

      render(<ProfileView {...defaultProps} goals={goalsWithProgress} />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(2);
      expect(progressBars[0]).toHaveAttribute('aria-valuenow', '60');
      expect(progressBars[1]).toHaveAttribute('aria-valuenow', '75');
    });

    test('should display goal priorities correctly', () => {
      render(<ProfileView {...defaultProps} />);

      const goalCards = screen.getAllByTestId(/goal-card/);
      expect(goalCards[0]).toHaveTextContent('Priority 1');
      expect(goalCards[1]).toHaveTextContent('Priority 2');
    });

    test('should handle empty goals state', () => {
      render(<ProfileView {...defaultProps} goals={[]} />);

      expect(screen.getByText('No active goals')).toBeInTheDocument();
      expect(screen.getByText('Set your first goal to get started!')).toBeInTheDocument();
    });

    test('should show add goal button when < 5 goals', () => {
      render(<ProfileView {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /add goal/i });
      expect(addButton).toBeInTheDocument();
      expect(addButton).not.toBeDisabled();
    });

    test('should disable add goal button when at limit', () => {
      const fiveGoals = Array.from({ length: 5 }, (_, i) => ({
        ...mockGoals[0],
        id: `goal-${i + 1}`,
        priority: i + 1
      }));

      render(<ProfileView {...defaultProps} goals={fiveGoals} />);

      const addButton = screen.getByRole('button', { name: /add goal/i });
      expect(addButton).toBeDisabled();
      expect(screen.getByText('Maximum goals reached')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('should navigate to edit profile on button click', async () => {
      const user = userEvent.setup();
      render(<ProfileView {...defaultProps} />);

      const editButton = screen.getByRole('button', { name: /edit profile/i });
      await user.click(editButton);

      expect(defaultProps.onEditProfile).toHaveBeenCalled();
    });

    test('should navigate to add goal on CTA click', async () => {
      const user = userEvent.setup();
      render(<ProfileView {...defaultProps} />);

      const addGoalButton = screen.getByRole('button', { name: /add goal/i });
      await user.click(addGoalButton);

      expect(defaultProps.onAddGoal).toHaveBeenCalled();
    });

    test('should navigate to goal edit on goal click', async () => {
      const user = userEvent.setup();
      render(<ProfileView {...defaultProps} />);

      const goalCard = screen.getByTestId('goal-card-goal-1');
      await user.click(goalCard);

      expect(defaultProps.onEditGoal).toHaveBeenCalledWith('goal-1');
    });

    test('should handle navigation errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const failingOnEdit = jest.fn().mockRejectedValue(new Error('Navigation failed'));

      render(<ProfileView {...defaultProps} onEditProfile={failingOnEdit} />);

      const editButton = screen.getByRole('button', { name: /edit profile/i });
      await userEvent.click(editButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Navigation error'),
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Recent Activity', () => {
    test('should display recent activity timeline', () => {
      render(<ProfileView {...defaultProps} />);

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Completed strength workout')).toBeInTheDocument();
      expect(screen.getByText('Updated weight loss progress')).toBeInTheDocument();
    });

    test('should handle empty activity', () => {
      render(<ProfileView {...defaultProps} recentActivity={[]} />);

      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });

    test('should format activity timestamps', () => {
      render(<ProfileView {...defaultProps} />);

      expect(screen.getByText('Jan 20, 10:00 AM')).toBeInTheDocument();
      expect(screen.getByText('Jan 19, 3:30 PM')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should adapt layout for mobile screens', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ProfileView {...defaultProps} />);

      const container = screen.getByTestId('profile-container');
      expect(container).toHaveClass('mobile-layout');
    });

    test('should show desktop layout on large screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<ProfileView {...defaultProps} />);

      const container = screen.getByTestId('profile-container');
      expect(container).toHaveClass('desktop-layout');
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<ProfileView {...defaultProps} />);

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'User profile');
      expect(screen.getByRole('region', { name: /goals section/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /stats section/i })).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ProfileView {...defaultProps} />);

      const editButton = screen.getByRole('button', { name: /edit profile/i });
      editButton.focus();

      await user.keyboard('{Enter}');
      expect(defaultProps.onEditProfile).toHaveBeenCalled();

      await user.keyboard('{Space}');
      expect(defaultProps.onEditProfile).toHaveBeenCalledTimes(2);
    });

    test('should announce dynamic content changes', async () => {
      const { rerender } = render(<ProfileView {...defaultProps} />);

      const updatedGoals = [
        ...mockGoals,
        {
          ...mockGoals[0],
          id: 'goal-3',
          goal_description: 'New goal added',
          priority: 3
        }
      ];

      rerender(<ProfileView {...defaultProps} goals={updatedGoals} />);

      expect(screen.getByRole('status')).toHaveTextContent('Goals updated');
    });
  });
});