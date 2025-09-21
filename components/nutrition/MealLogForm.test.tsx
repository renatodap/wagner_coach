import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import MealLogForm from './MealLogForm';
import { MealInsert } from '@/types/nutrition';

// Mock data
const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

describe('MealLogForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    test('should render all required form fields', () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/meal name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date.*time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });

    test('should display meal name input field', () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const mealNameInput = screen.getByLabelText(/meal name/i);
      expect(mealNameInput).toHaveAttribute('type', 'text');
      expect(mealNameInput).toHaveAttribute('required');
    });

    test('should display category selector with all options', () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const categorySelect = screen.getByLabelText(/category/i);
      expect(categorySelect).toBeInTheDocument();

      // Check for all meal category options
      expect(screen.getByText('Breakfast')).toBeInTheDocument();
      expect(screen.getByText('Lunch')).toBeInTheDocument();
      expect(screen.getByText('Dinner')).toBeInTheDocument();
      expect(screen.getByText('Snack')).toBeInTheDocument();
    });

    test('should display date/time picker with current time', () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const dateTimeInput = screen.getByLabelText(/date.*time/i);
      expect(dateTimeInput).toHaveAttribute('type', 'datetime-local');

      // Check that current time is set as default
      const now = new Date();
      const currentValue = dateTimeInput.getAttribute('value');
      expect(currentValue).toBeTruthy();
    });

    test('should display optional macro input fields', () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/calories/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/protein/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/carbs/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/fat/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/fiber/i)).toBeInTheDocument();
    });

    test('should display notes textarea', () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const notesTextarea = screen.getByLabelText(/notes/i);
      expect(notesTextarea).toBeInTheDocument();
      expect(notesTextarea.tagName.toLowerCase()).toBe('textarea');
    });

    test('should render submit button', () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByRole('button', { name: /save meal/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('should require meal name before submission', async () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const submitButton = screen.getByRole('button', { name: /save meal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    test('should require category selection before submission', async () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const mealNameInput = screen.getByLabelText(/meal name/i);
      await userEvent.type(mealNameInput, 'Test Meal');

      const submitButton = screen.getByRole('button', { name: /save meal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    test('should require date/time before submission', async () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const mealNameInput = screen.getByLabelText(/meal name/i);
      await userEvent.type(mealNameInput, 'Test Meal');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'lunch');

      // Clear the date/time field
      const dateTimeInput = screen.getByLabelText(/date.*time/i);
      await userEvent.clear(dateTimeInput);

      const submitButton = screen.getByRole('button', { name: /save meal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    test('should show error message for empty meal name', async () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const submitButton = screen.getByRole('button', { name: /save meal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/meal name is required/i)).toBeInTheDocument();
      });
    });

    test('should show error message for missing category', async () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const mealNameInput = screen.getByLabelText(/meal name/i);
      await userEvent.type(mealNameInput, 'Test Meal');

      const submitButton = screen.getByRole('button', { name: /save meal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/category is required/i)).toBeInTheDocument();
      });
    });

    test('should prevent submission with invalid data', async () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const submitButton = screen.getByRole('button', { name: /save meal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
        expect(screen.getByText(/meal name is required/i)).toBeInTheDocument();
      });
    });

    test('should allow submission with only required fields', async () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const mealNameInput = screen.getByLabelText(/meal name/i);
      await userEvent.type(mealNameInput, 'Test Meal');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'lunch');

      const submitButton = screen.getByRole('button', { name: /save meal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            meal_name: 'Test Meal',
            meal_category: 'lunch',
            logged_at: expect.any(String)
          })
        );
      });
    });

    test('should validate numeric inputs for macros (no negative values)', async () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const caloriesInput = screen.getByLabelText(/calories/i);
      await userEvent.type(caloriesInput, '-100');

      const mealNameInput = screen.getByLabelText(/meal name/i);
      await userEvent.type(mealNameInput, 'Test Meal');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'lunch');

      const submitButton = screen.getByRole('button', { name: /save meal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/calories must be a positive number/i)).toBeInTheDocument();
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Interaction', () => {
    test('should update meal name on input change', async () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const mealNameInput = screen.getByLabelText(/meal name/i) as HTMLInputElement;
      await userEvent.type(mealNameInput, 'Chicken Salad');

      expect(mealNameInput.value).toBe('Chicken Salad');
    });

    test('should update category on selection change', async () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
      await userEvent.selectOptions(categorySelect, 'dinner');

      expect(categorySelect.value).toBe('dinner');
    });

    test('should update date/time on picker change', async () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const dateTimeInput = screen.getByLabelText(/date.*time/i) as HTMLInputElement;
      const testDateTime = '2024-01-24T19:00';

      fireEvent.change(dateTimeInput, { target: { value: testDateTime } });

      expect(dateTimeInput.value).toBe(testDateTime);
    });

    test('should update macro values on input', async () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const caloriesInput = screen.getByLabelText(/calories/i) as HTMLInputElement;
      await userEvent.type(caloriesInput, '450');

      expect(caloriesInput.value).toBe('450');
    });

    test('should clear form after successful submission', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined);

      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const mealNameInput = screen.getByLabelText(/meal name/i) as HTMLInputElement;
      await userEvent.type(mealNameInput, 'Test Meal');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'lunch');

      const submitButton = screen.getByRole('button', { name: /save meal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mealNameInput.value).toBe('');
      });
    });

    test('should maintain form state during validation errors', async () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const mealNameInput = screen.getByLabelText(/meal name/i) as HTMLInputElement;
      await userEvent.type(mealNameInput, 'Test Meal');

      // Submit without category
      const submitButton = screen.getByRole('button', { name: /save meal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mealNameInput.value).toBe('Test Meal');
      });
    });

    test('should disable submit button during submission', async () => {
      const slowSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <MealLogForm onSubmit={slowSubmit} onCancel={mockOnCancel} />
      );

      const mealNameInput = screen.getByLabelText(/meal name/i);
      await userEvent.type(mealNameInput, 'Test Meal');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'lunch');

      const submitButton = screen.getByRole('button', { name: /save meal/i });
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
    });

    test('should show loading state during submission', async () => {
      const slowSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <MealLogForm onSubmit={slowSubmit} onCancel={mockOnCancel} />
      );

      const mealNameInput = screen.getByLabelText(/meal name/i);
      await userEvent.type(mealNameInput, 'Test Meal');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'lunch');

      const submitButton = screen.getByRole('button', { name: /save meal/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    test('should call onSubmit handler with form data', async () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const mealNameInput = screen.getByLabelText(/meal name/i);
      await userEvent.type(mealNameInput, 'Grilled Chicken');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'dinner');

      const caloriesInput = screen.getByLabelText(/calories/i);
      await userEvent.type(caloriesInput, '350');

      const proteinInput = screen.getByLabelText(/protein/i);
      await userEvent.type(proteinInput, '45');

      const submitButton = screen.getByRole('button', { name: /save meal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            meal_name: 'Grilled Chicken',
            meal_category: 'dinner',
            calories: 350,
            protein_g: 45
          })
        );
      });
    });

    test('should format data correctly for API', async () => {
      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const mealNameInput = screen.getByLabelText(/meal name/i);
      await userEvent.type(mealNameInput, 'Test Meal');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'lunch');

      const submitButton = screen.getByRole('button', { name: /save meal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const callData = mockOnSubmit.mock.calls[0][0];
        expect(callData).toHaveProperty('meal_name');
        expect(callData).toHaveProperty('meal_category');
        expect(callData).toHaveProperty('logged_at');
        expect(typeof callData.logged_at).toBe('string');
      });
    });

    test('should handle submission success', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined);

      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const mealNameInput = screen.getByLabelText(/meal name/i);
      await userEvent.type(mealNameInput, 'Test Meal');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'lunch');

      const submitButton = screen.getByRole('button', { name: /save meal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/meal saved successfully/i)).toBeInTheDocument();
      });
    });

    test('should handle submission errors', async () => {
      mockOnSubmit.mockRejectedValueOnce(new Error('Failed to save meal'));

      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const mealNameInput = screen.getByLabelText(/meal name/i);
      await userEvent.type(mealNameInput, 'Test Meal');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'lunch');

      const submitButton = screen.getByRole('button', { name: /save meal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to save meal/i)).toBeInTheDocument();
      });
    });

    test('should display success message on successful submission', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined);

      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const mealNameInput = screen.getByLabelText(/meal name/i);
      await userEvent.type(mealNameInput, 'Test Meal');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'lunch');

      const submitButton = screen.getByRole('button', { name: /save meal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/meal saved successfully/i)).toBeInTheDocument();
      });
    });

    test('should display error message on failed submission', async () => {
      mockOnSubmit.mockRejectedValueOnce(new Error('Network error'));

      render(
        <MealLogForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const mealNameInput = screen.getByLabelText(/meal name/i);
      await userEvent.type(mealNameInput, 'Test Meal');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'lunch');

      const submitButton = screen.getByRole('button', { name: /save meal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });
});