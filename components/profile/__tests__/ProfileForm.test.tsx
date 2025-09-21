import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileForm } from '../ProfileForm';
import { ProfileUpdate, UserGoalInsert } from '@/types/profile';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

describe('ProfileForm Component', () => {
  const mockOnStepChange = jest.fn();
  const mockOnComplete = jest.fn();

  const defaultProps = {
    currentStep: 1,
    onStepChange: mockOnStepChange,
    onComplete: mockOnComplete,
    children: (
      <>
        <div data-testid="step-1">Step 1</div>
        <div data-testid="step-2">Step 2</div>
        <div data-testid="step-3">Step 3</div>
        <div data-testid="step-4">Step 4</div>
        <div data-testid="step-5">Step 5</div>
      </>
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Step Navigation', () => {
    test('should render with initial step 1', () => {
      render(<ProfileForm {...defaultProps} />);
      expect(screen.getByTestId('step-1')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    });

    test('should show correct total number of steps', () => {
      render(<ProfileForm {...defaultProps} />);
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /step/i })).toHaveLength(5);
    });

    test('should navigate to next step when Next is clicked', async () => {
      render(<ProfileForm {...defaultProps} />);
      const nextButton = screen.getByRole('button', { name: /next/i });

      await userEvent.click(nextButton);

      expect(mockOnStepChange).toHaveBeenCalledWith(2);
    });

    test('should navigate to previous step when Back is clicked', async () => {
      render(<ProfileForm {...defaultProps} currentStep={2} />);
      const backButton = screen.getByRole('button', { name: /back/i });

      await userEvent.click(backButton);

      expect(mockOnStepChange).toHaveBeenCalledWith(1);
    });

    test('should disable Back button on first step', () => {
      render(<ProfileForm {...defaultProps} />);
      const backButton = screen.getByRole('button', { name: /back/i });

      expect(backButton).toBeDisabled();
    });

    test('should show Complete button on last step', () => {
      render(<ProfileForm {...defaultProps} currentStep={5} />);

      expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
    });

    test('should not allow navigation with validation errors', async () => {
      const { rerender } = render(<ProfileForm {...defaultProps} />);

      // Simulate validation error
      const nextButton = screen.getByRole('button', { name: /next/i });
      const errorMessage = 'Please fill in all required fields';

      // Mock validation failure
      rerender(
        <ProfileForm {...defaultProps} validationErrors={[{ field: 'name', message: errorMessage }]} />
      );

      await userEvent.click(nextButton);

      expect(mockOnStepChange).not.toHaveBeenCalled();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Progress Indicator', () => {
    test('should show progress bar with correct percentage', () => {
      render(<ProfileForm {...defaultProps} currentStep={2} />);
      const progressBar = screen.getByRole('progressbar');

      expect(progressBar).toHaveAttribute('aria-valuenow', '40'); // 2/5 = 40%
    });

    test('should highlight current step', () => {
      render(<ProfileForm {...defaultProps} currentStep={3} />);
      const stepIndicator = screen.getByTestId('step-indicator-3');

      expect(stepIndicator).toHaveClass('active');
    });

    test('should mark completed steps with checkmark', () => {
      render(<ProfileForm {...defaultProps} currentStep={3} />);

      const step1 = screen.getByTestId('step-indicator-1');
      const step2 = screen.getByTestId('step-indicator-2');

      expect(step1).toContainElement(screen.getByTestId('checkmark-1'));
      expect(step2).toContainElement(screen.getByTestId('checkmark-2'));
    });

    test('should allow jumping to completed steps', async () => {
      render(<ProfileForm {...defaultProps} currentStep={3} />);

      const step1Button = screen.getByRole('button', { name: /go to step 1/i });
      await userEvent.click(step1Button);

      expect(mockOnStepChange).toHaveBeenCalledWith(1);
    });

    test('should not allow jumping to future steps', () => {
      render(<ProfileForm {...defaultProps} currentStep={2} />);

      const step4Button = screen.getByRole('button', { name: /go to step 4/i });

      expect(step4Button).toBeDisabled();
    });
  });

  describe('Data Persistence', () => {
    test('should save form data in state when fields change', async () => {
      const { rerender } = render(<ProfileForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/full name/i);
      await userEvent.type(nameInput, 'John Doe');

      // Check that state is updated
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    test('should persist data when navigating between steps', async () => {
      const { rerender } = render(<ProfileForm {...defaultProps} />);

      // Enter data in step 1
      const nameInput = screen.getByLabelText(/full name/i);
      await userEvent.type(nameInput, 'John Doe');

      // Navigate to step 2
      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);

      // Navigate back to step 1
      rerender(<ProfileForm {...defaultProps} currentStep={2} />);
      const backButton = screen.getByRole('button', { name: /back/i });
      await userEvent.click(backButton);

      // Check data is still there
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    test('should save draft to localStorage on changes', async () => {
      render(<ProfileForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/full name/i);
      await userEvent.type(nameInput, 'John Doe');

      // Wait for debounce
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'wagner_onboarding_draft',
          expect.stringContaining('John Doe')
        );
      }, { timeout: 3000 });
    });

    test('should restore draft from localStorage on mount', () => {
      const draftData = {
        stepData: {
          basicInfo: { full_name: 'John Doe', age: 30 }
        },
        currentStep: 2
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(draftData));

      render(<ProfileForm {...defaultProps} />);

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    });

    test('should clear draft after successful submission', async () => {
      mockOnComplete.mockResolvedValue(undefined);

      render(<ProfileForm {...defaultProps} currentStep={5} />);

      const completeButton = screen.getByRole('button', { name: /complete/i });
      await userEvent.click(completeButton);

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('wagner_onboarding_draft');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('wagner_onboarding_step');
      });
    });
  });

  describe('Form Validation', () => {
    test('should show validation errors inline', async () => {
      render(<ProfileForm {...defaultProps} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);

      expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/please enter a valid age/i)).toBeInTheDocument();
    });

    test('should clear errors when fields are corrected', async () => {
      render(<ProfileForm {...defaultProps} />);

      // Trigger validation errors
      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);

      expect(screen.getByText(/full name is required/i)).toBeInTheDocument();

      // Fix the error
      const nameInput = screen.getByLabelText(/full name/i);
      await userEvent.type(nameInput, 'John Doe');

      // Error should be cleared
      expect(screen.queryByText(/full name is required/i)).not.toBeInTheDocument();
    });

    test('should validate all steps before submission', async () => {
      render(<ProfileForm {...defaultProps} currentStep={5} />);

      const completeButton = screen.getByRole('button', { name: /complete/i });
      await userEvent.click(completeButton);

      // Should show validation summary
      expect(screen.getByText(/please complete all required fields/i)).toBeInTheDocument();
      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    test('should show loading spinner during save', async () => {
      const slowSave = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<ProfileForm {...defaultProps} onComplete={slowSave} currentStep={5} />);

      const completeButton = screen.getByRole('button', { name: /complete/i });
      await userEvent.click(completeButton);

      expect(screen.getByRole('status', { name: /saving/i })).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByRole('status', { name: /saving/i })).not.toBeInTheDocument();
      });
    });

    test('should disable navigation during save', async () => {
      const slowSave = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<ProfileForm {...defaultProps} onComplete={slowSave} currentStep={5} />);

      const completeButton = screen.getByRole('button', { name: /complete/i });
      await userEvent.click(completeButton);

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    test('should display error message on save failure', async () => {
      const errorMessage = 'Failed to save profile';
      mockOnComplete.mockRejectedValue(new Error(errorMessage));

      render(<ProfileForm {...defaultProps} currentStep={5} />);

      const completeButton = screen.getByRole('button', { name: /complete/i });
      await userEvent.click(completeButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
      });
    });

    test('should allow retry after error', async () => {
      mockOnComplete
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      render(<ProfileForm {...defaultProps} currentStep={5} />);

      const completeButton = screen.getByRole('button', { name: /complete/i });
      await userEvent.click(completeButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(2);
      });
    });
  });
});