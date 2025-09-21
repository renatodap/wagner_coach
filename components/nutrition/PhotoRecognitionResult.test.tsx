// PhotoRecognitionResult Component Tests

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PhotoRecognitionResult } from './PhotoRecognitionResult';
import { FoodRecognitionResult, RecognizedFood } from '@/types/nutrition';

// Mock data
const mockRecognitionResult: FoodRecognitionResult = {
  imageId: 'img_123',
  foods: [
    {
      id: 'food_1',
      name: 'Grilled Chicken Breast',
      quantity: 150,
      unit: 'g',
      nutrition: {
        calories: 250,
        protein_g: 45,
        carbs_g: 0,
        fat_g: 5
      },
      confidence: 0.92,
      category: 'protein'
    },
    {
      id: 'food_2',
      name: 'Brown Rice',
      quantity: 100,
      unit: 'g',
      nutrition: {
        calories: 110,
        protein_g: 2.5,
        carbs_g: 23,
        fat_g: 0.9
      },
      confidence: 0.85,
      category: 'grain'
    },
    {
      id: 'food_3',
      name: 'Steamed Broccoli',
      quantity: 80,
      unit: 'g',
      nutrition: {
        calories: 30,
        protein_g: 2,
        carbs_g: 6,
        fat_g: 0.3
      },
      confidence: 0.45,
      category: 'vegetable'
    }
  ],
  totalNutrition: {
    calories: 390,
    protein_g: 49.5,
    carbs_g: 29,
    fat_g: 6.2
  },
  confidence: 0.74,
  timestamp: new Date().toISOString()
};

describe('PhotoRecognitionResult', () => {
  const mockOnAccept = jest.fn();
  const mockOnReject = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Results Display', () => {
    it('should display all recognized food items', () => {
      render(
        <PhotoRecognitionResult
          result={mockRecognitionResult}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByText('Grilled Chicken Breast')).toBeInTheDocument();
      expect(screen.getByText('Brown Rice')).toBeInTheDocument();
      expect(screen.getByText('Steamed Broccoli')).toBeInTheDocument();
    });

    it('should show nutritional values for each item', () => {
      render(
        <PhotoRecognitionResult
          result={mockRecognitionResult}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      // Check chicken nutrition
      const chickenCard = screen.getByText('Grilled Chicken Breast').closest('[data-testid="food-card"]');
      expect(within(chickenCard!).getByText('250 cal')).toBeInTheDocument();
      expect(within(chickenCard!).getByText('45g protein')).toBeInTheDocument();

      // Check rice nutrition
      const riceCard = screen.getByText('Brown Rice').closest('[data-testid="food-card"]');
      expect(within(riceCard!).getByText('110 cal')).toBeInTheDocument();
      expect(within(riceCard!).getByText('23g carbs')).toBeInTheDocument();
    });

    it('should display confidence scores', () => {
      render(
        <PhotoRecognitionResult
          result={mockRecognitionResult}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByText('92%')).toBeInTheDocument(); // Chicken confidence
      expect(screen.getByText('85%')).toBeInTheDocument(); // Rice confidence
      expect(screen.getByText('45%')).toBeInTheDocument(); // Broccoli confidence
    });

    it('should show total nutrition summary', () => {
      render(
        <PhotoRecognitionResult
          result={mockRecognitionResult}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      const summary = screen.getByTestId('nutrition-summary');
      expect(within(summary).getByText('390')).toBeInTheDocument(); // Total calories
      expect(within(summary).getByText('49.5g')).toBeInTheDocument(); // Total protein
      expect(within(summary).getByText('29g')).toBeInTheDocument(); // Total carbs
      expect(within(summary).getByText('6.2g')).toBeInTheDocument(); // Total fat
    });
  });

  describe('User Interactions', () => {
    it('should allow editing food names', async () => {
      render(
        <PhotoRecognitionResult
          result={mockRecognitionResult}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      const chickenNameField = screen.getByDisplayValue('Grilled Chicken Breast');
      await userEvent.clear(chickenNameField);
      await userEvent.type(chickenNameField, 'Baked Chicken');

      const acceptButton = screen.getByText(/accept/i);
      await userEvent.click(acceptButton);

      expect(mockOnAccept).toHaveBeenCalledWith(
        expect.objectContaining({
          foods: expect.arrayContaining([
            expect.objectContaining({
              name: 'Baked Chicken'
            })
          ])
        })
      );
    });

    it('should allow adjusting quantities', async () => {
      render(
        <PhotoRecognitionResult
          result={mockRecognitionResult}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      const riceQuantityField = screen.getByDisplayValue('100');
      await userEvent.clear(riceQuantityField);
      await userEvent.type(riceQuantityField, '150');

      const acceptButton = screen.getByText(/accept/i);
      await userEvent.click(acceptButton);

      expect(mockOnAccept).toHaveBeenCalledWith(
        expect.objectContaining({
          foods: expect.arrayContaining([
            expect.objectContaining({
              name: 'Brown Rice',
              quantity: 150
            })
          ])
        })
      );
    });

    it('should allow removing items', async () => {
      render(
        <PhotoRecognitionResult
          result={mockRecognitionResult}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      const broccoliCard = screen.getByText('Steamed Broccoli').closest('[data-testid="food-card"]');
      const removeButton = within(broccoliCard!).getByTestId('remove-food');

      await userEvent.click(removeButton);

      // Verify broccoli is removed
      expect(screen.queryByText('Steamed Broccoli')).not.toBeInTheDocument();

      const acceptButton = screen.getByText(/accept/i);
      await userEvent.click(acceptButton);

      expect(mockOnAccept).toHaveBeenCalledWith(
        expect.objectContaining({
          foods: expect.not.arrayContaining([
            expect.objectContaining({
              name: 'Steamed Broccoli'
            })
          ])
        })
      );
    });

    it('should recalculate totals on changes', async () => {
      render(
        <PhotoRecognitionResult
          result={mockRecognitionResult}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      // Remove an item
      const broccoliCard = screen.getByText('Steamed Broccoli').closest('[data-testid="food-card"]');
      const removeButton = within(broccoliCard!).getByTestId('remove-food');
      await userEvent.click(removeButton);

      // Check updated totals
      const summary = screen.getByTestId('nutrition-summary');
      expect(within(summary).getByText('360')).toBeInTheDocument(); // 390 - 30
    });
  });

  describe('Confidence Indicators', () => {
    it('should highlight high confidence (>80%) in green', () => {
      render(
        <PhotoRecognitionResult
          result={mockRecognitionResult}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      const chickenConfidence = screen.getByText('92%').closest('[data-testid="confidence-badge"]');
      expect(chickenConfidence).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should show medium confidence (50-80%) in yellow', () => {
      render(
        <PhotoRecognitionResult
          result={mockRecognitionResult}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      // Rice has 85% confidence - still high
      // Let's check for a custom result with medium confidence
      const mediumConfidenceResult = {
        ...mockRecognitionResult,
        foods: [{
          ...mockRecognitionResult.foods[0],
          confidence: 0.65
        }]
      };

      const { rerender } = render(
        <PhotoRecognitionResult
          result={mediumConfidenceResult}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      const confidence = screen.getByText('65%').closest('[data-testid="confidence-badge"]');
      expect(confidence).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should show low confidence (<50%) in red', () => {
      render(
        <PhotoRecognitionResult
          result={mockRecognitionResult}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      const broccoliConfidence = screen.getByText('45%').closest('[data-testid="confidence-badge"]');
      expect(broccoliConfidence).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should sort items by confidence', () => {
      render(
        <PhotoRecognitionResult
          result={mockRecognitionResult}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      const foodCards = screen.getAllByTestId('food-card');
      const foodNames = foodCards.map(card => within(card).getByTestId('food-name').textContent);

      expect(foodNames).toEqual([
        'Grilled Chicken Breast', // 92%
        'Brown Rice',             // 85%
        'Steamed Broccoli'       // 45%
      ]);
    });
  });

  describe('Loading States', () => {
    it('should show skeleton loader during analysis', () => {
      render(
        <PhotoRecognitionResult
          result={null}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
      expect(screen.getByText(/analyzing your meal/i)).toBeInTheDocument();
    });

    it('should show progress indicator', () => {
      render(
        <PhotoRecognitionResult
          result={null}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle timeout gracefully', async () => {
      jest.useFakeTimers();

      render(
        <PhotoRecognitionResult
          result={null}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          isLoading={true}
        />
      );

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(screen.getByText(/taking longer than expected/i)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Action Buttons', () => {
    it('should call onAccept when accept button clicked', async () => {
      render(
        <PhotoRecognitionResult
          result={mockRecognitionResult}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      const acceptButton = screen.getByText(/accept/i);
      await userEvent.click(acceptButton);

      expect(mockOnAccept).toHaveBeenCalledWith(mockRecognitionResult);
    });

    it('should call onReject when reject button clicked', async () => {
      render(
        <PhotoRecognitionResult
          result={mockRecognitionResult}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      const rejectButton = screen.getByText(/try again/i);
      await userEvent.click(rejectButton);

      expect(mockOnReject).toHaveBeenCalled();
    });

    it('should disable buttons during processing', () => {
      render(
        <PhotoRecognitionResult
          result={mockRecognitionResult}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
          isLoading={true}
        />
      );

      const acceptButton = screen.queryByText(/accept/i);
      const rejectButton = screen.queryByText(/try again/i);

      expect(acceptButton).not.toBeInTheDocument();
      expect(rejectButton).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should handle no foods detected', () => {
      const emptyResult: FoodRecognitionResult = {
        ...mockRecognitionResult,
        foods: [],
        totalNutrition: {
          calories: 0,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0
        }
      };

      render(
        <PhotoRecognitionResult
          result={emptyResult}
          onAccept={mockOnAccept}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByText(/no foods detected/i)).toBeInTheDocument();
      expect(screen.getByText(/try a clearer photo/i)).toBeInTheDocument();
    });
  });
});