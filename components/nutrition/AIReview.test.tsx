import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIReview from './AIReview';
import { AIReviewProps, AIAnalysisResult } from '@/types/nutrition';

describe('AIReview Component', () => {
  const mockOnConfirm = jest.fn();
  const mockOnReanalyze = jest.fn();
  const mockOnManualEdit = jest.fn();

  const mockAIResult: AIAnalysisResult = {
    foodItems: [
      {
        name: 'Grilled Chicken',
        quantity: '150g',
        confidence: 0.95,
        calories: 250,
        protein_g: 40,
        carbs_g: 0,
        fat_g: 10,
        fiber_g: 0,
      },
      {
        name: 'Brown Rice',
        quantity: '1 cup',
        confidence: 0.88,
        calories: 220,
        protein_g: 5,
        carbs_g: 45,
        fat_g: 2,
        fiber_g: 4,
      },
    ],
    totalNutrition: {
      calories: 470,
      protein_g: 45,
      carbs_g: 45,
      fat_g: 12,
      fiber_g: 4,
    },
    suggestedMealName: 'Grilled Chicken with Brown Rice',
    confidence: 0.92,
  };

  const defaultProps: AIReviewProps = {
    aiResult: mockAIResult,
    originalImage: 'data:image/jpeg;base64,test',
    onConfirm: mockOnConfirm,
    onReanalyze: mockOnReanalyze,
    onManualEdit: mockOnManualEdit,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Rendering Tests
  test('should render original image preview', () => {
    render(<AIReview {...defaultProps} />);
    const image = screen.getByAltText(/meal photo/i);
    expect(image).toHaveAttribute('src', 'data:image/jpeg;base64,test');
  });

  test('should display AI analysis results table', () => {
    render(<AIReview {...defaultProps} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Grilled Chicken')).toBeInTheDocument();
    expect(screen.getByText('Brown Rice')).toBeInTheDocument();
  });

  test('should show editable food item fields', () => {
    render(<AIReview {...defaultProps} />);
    const nameInputs = screen.getAllByRole('textbox', { name: /food name/i });
    expect(nameInputs).toHaveLength(2);
    expect(nameInputs[0]).toHaveValue('Grilled Chicken');
    expect(nameInputs[1]).toHaveValue('Brown Rice');
  });

  test('should render nutrition totals summary', () => {
    render(<AIReview {...defaultProps} />);
    expect(screen.getByText(/470.*calories/i)).toBeInTheDocument();
    expect(screen.getByText(/45g.*protein/i)).toBeInTheDocument();
    expect(screen.getByText(/45g.*carbs/i)).toBeInTheDocument();
    expect(screen.getByText(/12g.*fat/i)).toBeInTheDocument();
  });

  test('should display confidence indicators', () => {
    render(<AIReview {...defaultProps} />);
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
  });

  // Food Item Editing Tests
  test('should allow editing individual food item names', async () => {
    render(<AIReview {...defaultProps} />);
    const nameInputs = screen.getAllByRole('textbox', { name: /food name/i });

    fireEvent.change(nameInputs[0], { target: { value: 'Baked Chicken' } });

    await waitFor(() => {
      expect(nameInputs[0]).toHaveValue('Baked Chicken');
    });
  });

  test('should allow adjusting portion sizes', async () => {
    render(<AIReview {...defaultProps} />);
    const portionInputs = screen.getAllByRole('textbox', { name: /portion/i });

    fireEvent.change(portionInputs[0], { target: { value: '200g' } });

    await waitFor(() => {
      expect(portionInputs[0]).toHaveValue('200g');
    });
  });

  test('should recalculate nutrition when portions change', async () => {
    render(<AIReview {...defaultProps} />);
    const calorieInputs = screen.getAllByRole('spinbutton', { name: /calories/i });

    fireEvent.change(calorieInputs[0], { target: { value: '300' } });

    await waitFor(() => {
      expect(screen.getByText(/520.*calories/i)).toBeInTheDocument();
    });
  });

  test('should validate edited nutrition values', async () => {
    render(<AIReview {...defaultProps} />);
    const proteinInputs = screen.getAllByRole('spinbutton', { name: /protein/i });

    fireEvent.change(proteinInputs[0], { target: { value: '-10' } });

    await waitFor(() => {
      expect(screen.getByText(/invalid value/i)).toBeInTheDocument();
    });
  });

  test('should highlight modified items', async () => {
    render(<AIReview {...defaultProps} />);
    const nameInputs = screen.getAllByRole('textbox', { name: /food name/i });

    fireEvent.change(nameInputs[0], { target: { value: 'Modified Chicken' } });

    await waitFor(() => {
      const row = nameInputs[0].closest('tr');
      expect(row).toHaveClass('modified');
    });
  });

  // Review Actions Tests
  test('should call onConfirm with final meal data', async () => {
    render(<AIReview {...defaultProps} />);
    const confirmButton = screen.getByRole('button', { name: /confirm/i });

    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Grilled Chicken with Brown Rice',
          calories: 470,
          protein_g: 45,
          carbs_g: 45,
          fat_g: 12,
        })
      );
    });
  });

  test('should include user modifications in confirmed data', async () => {
    render(<AIReview {...defaultProps} />);
    const nameInputs = screen.getAllByRole('textbox', { name: /food name/i });

    fireEvent.change(nameInputs[0], { target: { value: 'Modified Chicken' } });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringContaining('Modified Chicken'),
        })
      );
    });
  });

  test('should call onReanalyze when reanalyze clicked', () => {
    render(<AIReview {...defaultProps} />);
    const reanalyzeButton = screen.getByRole('button', { name: /reanalyze/i });

    fireEvent.click(reanalyzeButton);
    expect(mockOnReanalyze).toHaveBeenCalled();
  });

  test('should call onManualEdit when manual edit clicked', () => {
    render(<AIReview {...defaultProps} />);
    const manualEditButton = screen.getByRole('button', { name: /manual edit/i });

    fireEvent.click(manualEditButton);
    expect(mockOnManualEdit).toHaveBeenCalled();
  });

  test('should prevent confirmation with invalid data', async () => {
    render(<AIReview {...defaultProps} />);
    const nameInputs = screen.getAllByRole('textbox', { name: /food name/i });

    fireEvent.change(nameInputs[0], { target: { value: '' } });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).not.toHaveBeenCalled();
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  // Multiple Items Tests
  test('should handle multiple food items in one photo', () => {
    render(<AIReview {...defaultProps} />);
    const foodRows = screen.getAllByTestId(/food-item-row/i);
    expect(foodRows).toHaveLength(2);
  });

  test('should allow removing incorrectly identified items', async () => {
    render(<AIReview {...defaultProps} />);
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });

    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      const foodRows = screen.getAllByTestId(/food-item-row/i);
      expect(foodRows).toHaveLength(1);
    });
  });

  test('should allow adding missed food items manually', async () => {
    render(<AIReview {...defaultProps} />);
    const addButton = screen.getByRole('button', { name: /add item/i });

    fireEvent.click(addButton);

    await waitFor(() => {
      const foodRows = screen.getAllByTestId(/food-item-row/i);
      expect(foodRows).toHaveLength(3);
    });
  });

  test('should merge similar food items when requested', async () => {
    const propsWithSimilar: AIReviewProps = {
      ...defaultProps,
      aiResult: {
        ...mockAIResult,
        foodItems: [
          ...mockAIResult.foodItems,
          {
            name: 'White Rice',
            quantity: '0.5 cup',
            confidence: 0.75,
            calories: 110,
            protein_g: 2,
            carbs_g: 23,
            fat_g: 1,
            fiber_g: 1,
          },
        ],
      },
    };

    render(<AIReview {...propsWithSimilar} />);
    const mergeButton = screen.getByRole('button', { name: /merge similar/i });

    fireEvent.click(mergeButton);

    await waitFor(() => {
      expect(screen.getByText(/rice.*combined/i)).toBeInTheDocument();
    });
  });

  test('should split combined items when needed', async () => {
    render(<AIReview {...defaultProps} />);
    const splitButtons = screen.getAllByRole('button', { name: /split/i });

    fireEvent.click(splitButtons[0]);

    await waitFor(() => {
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      expect(screen.getByText(/split into components/i)).toBeInTheDocument();
    });
  });

  // Data Validation Tests
  test('should validate nutrition values are non-negative', async () => {
    render(<AIReview {...defaultProps} />);
    const calorieInputs = screen.getAllByRole('spinbutton', { name: /calories/i });

    fireEvent.change(calorieInputs[0], { target: { value: '-100' } });
    fireEvent.blur(calorieInputs[0]);

    await waitFor(() => {
      expect(screen.getByText(/must be positive/i)).toBeInTheDocument();
    });
  });

  test('should ensure meal name is provided', async () => {
    render(<AIReview {...defaultProps} />);
    const mealNameInput = screen.getByRole('textbox', { name: /meal name/i });

    fireEvent.change(mealNameInput, { target: { value: '' } });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/meal name required/i)).toBeInTheDocument();
    });
  });

  test('should check required fields before confirmation', async () => {
    render(<AIReview {...defaultProps} />);
    const calorieInputs = screen.getAllByRole('spinbutton', { name: /calories/i });

    fireEvent.change(calorieInputs[0], { target: { value: '' } });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).not.toHaveBeenCalled();
      expect(screen.getByText(/calories required/i)).toBeInTheDocument();
    });
  });

  test('should sanitize user input to prevent XSS', async () => {
    render(<AIReview {...defaultProps} />);
    const nameInputs = screen.getAllByRole('textbox', { name: /food name/i });

    const maliciousInput = '<script>alert("XSS")</script>';
    fireEvent.change(nameInputs[0], { target: { value: maliciousInput } });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.not.stringContaining('<script>'),
        })
      );
    });
  });
});