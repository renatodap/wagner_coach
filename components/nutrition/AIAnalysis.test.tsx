import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIAnalysis from './AIAnalysis';
import { AIAnalysisProps } from '@/types/nutrition';

// Mock fetch
global.fetch = jest.fn();

describe('AIAnalysis Component', () => {
  const mockOnAnalysisComplete = jest.fn();
  const mockOnError = jest.fn();

  const defaultProps: AIAnalysisProps = {
    imageData: 'data:image/jpeg;base64,test',
    onAnalysisComplete: mockOnAnalysisComplete,
    onError: mockOnError,
  };

  const mockSuccessResponse = {
    success: true,
    data: {
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
    },
    analysisId: 'test-analysis-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockSuccessResponse,
    });
  });

  // Rendering Tests
  test('should render loading animation during analysis', () => {
    render(<AIAnalysis {...defaultProps} />);
    expect(screen.getByTestId('loading-animation')).toBeInTheDocument();
  });

  test('should show progress steps indicator', () => {
    render(<AIAnalysis {...defaultProps} />);
    expect(screen.getByText(/analyzing image/i)).toBeInTheDocument();
    expect(screen.getByText(/identifying foods/i)).toBeInTheDocument();
    expect(screen.getByText(/calculating nutrition/i)).toBeInTheDocument();
  });

  test('should display estimated time remaining', () => {
    render(<AIAnalysis {...defaultProps} />);
    expect(screen.getByText(/estimated time/i)).toBeInTheDocument();
  });

  test('should render analysis results when complete', async () => {
    render(<AIAnalysis {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Grilled Chicken')).toBeInTheDocument();
      expect(screen.getByText('Brown Rice')).toBeInTheDocument();
    });
  });

  test('should show error state when analysis fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Analysis failed' }),
    });

    render(<AIAnalysis {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/analysis failed/i)).toBeInTheDocument();
    });
  });

  // Analysis Process Tests
  test('should call AI analysis API with image data', async () => {
    render(<AIAnalysis {...defaultProps} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/nutrition/analyze-photo',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: 'data:image/jpeg;base64,test',
          }),
        })
      );
    });
  });

  test('should handle successful analysis response', async () => {
    render(<AIAnalysis {...defaultProps} />);

    await waitFor(() => {
      expect(mockOnAnalysisComplete).toHaveBeenCalledWith(
        mockSuccessResponse.data
      );
    });
  });

  test('should handle API error responses gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<AIAnalysis {...defaultProps} />);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Network error');
    });
  });

  test('should retry failed requests with exponential backoff', async () => {
    let callCount = 0;
    (fetch as jest.Mock).mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.reject(new Error('Temporary failure'));
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockSuccessResponse,
      });
    });

    render(<AIAnalysis {...defaultProps} />);

    await waitFor(
      () => {
        expect(fetch).toHaveBeenCalledTimes(3);
        expect(mockOnAnalysisComplete).toHaveBeenCalled();
      },
      { timeout: 10000 }
    );
  });

  test('should timeout long-running requests (30s)', async () => {
    jest.useFakeTimers();

    (fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<AIAnalysis {...defaultProps} />);

    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('timeout')
      );
    });

    jest.useRealTimers();
  });

  // Results Display Tests
  test('should display identified food items list', async () => {
    render(<AIAnalysis {...defaultProps} />);

    await waitFor(() => {
      const foodList = screen.getByTestId('food-items-list');
      expect(foodList.children).toHaveLength(2);
    });
  });

  test('should show confidence scores for each item', async () => {
    render(<AIAnalysis {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('95%')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument();
    });
  });

  test('should display total nutrition summary', async () => {
    render(<AIAnalysis {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/470.*calories/i)).toBeInTheDocument();
      expect(screen.getByText(/45g.*protein/i)).toBeInTheDocument();
      expect(screen.getByText(/45g.*carbs/i)).toBeInTheDocument();
      expect(screen.getByText(/12g.*fat/i)).toBeInTheDocument();
    });
  });

  test('should render suggested meal name', async () => {
    render(<AIAnalysis {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText('Grilled Chicken with Brown Rice')
      ).toBeInTheDocument();
    });
  });

  test('should highlight low-confidence items', async () => {
    const lowConfidenceResponse = {
      ...mockSuccessResponse,
      data: {
        ...mockSuccessResponse.data,
        foodItems: [
          {
            name: 'Unknown Food',
            quantity: '100g',
            confidence: 0.45,
            calories: 100,
            protein_g: 10,
            carbs_g: 10,
            fat_g: 5,
            fiber_g: 2,
          },
        ],
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => lowConfidenceResponse,
    });

    render(<AIAnalysis {...defaultProps} />);

    await waitFor(() => {
      const lowConfidenceItem = screen.getByText('Unknown Food').parentElement;
      expect(lowConfidenceItem).toHaveClass('low-confidence');
    });
  });

  // Interaction Tests
  test('should allow reanalysis with different settings', async () => {
    render(<AIAnalysis {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reanalyze/i })).toBeInTheDocument();
    });
  });

  test('should call onAnalysisComplete with results', async () => {
    render(<AIAnalysis {...defaultProps} />);

    await waitFor(() => {
      expect(mockOnAnalysisComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          foodItems: expect.arrayContaining([
            expect.objectContaining({ name: 'Grilled Chicken' }),
          ]),
        })
      );
    });
  });

  test('should call onError when analysis fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid image format' }),
    });

    render(<AIAnalysis {...defaultProps} />);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Invalid image format');
    });
  });

  test('should provide manual entry fallback option', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Analysis failed'));

    render(<AIAnalysis {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /manual entry/i })
      ).toBeInTheDocument();
    });
  });
});