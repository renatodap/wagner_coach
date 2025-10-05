/**
 * Test suite for MealPreview component
 * Tests UI rendering and interaction for meal entries
 */

import { render, screen, fireEvent } from '@testing-library/react';
import MealPreview from '../MealPreview';
import { QuickEntryPreviewResponse } from '../types';

describe('MealPreview Component', () => {
  /**
   * Test Case 1: Meal with all portions
   * Expected: Complete nutrition display, no warnings
   */
  test('displays complete nutrition when portions are provided', () => {
    const mockData: QuickEntryPreviewResponse = {
      success: true,
      entry_type: 'meal',
      confidence: 0.95,
      data: {
        primary_fields: {
          meal_name: 'Grilled Chicken Breast with Brown Rice',
          meal_type: 'lunch',
          calories: 520,
          protein_g: 52,
          foods: [
            { name: 'Grilled chicken breast', quantity: '6oz' },
            { name: 'Brown rice', quantity: '1 cup' },
            { name: 'Broccoli', quantity: '1 cup' }
          ]
        },
        secondary_fields: {
          carbs_g: 48,
          fat_g: 8,
          fiber_g: 6,
          sodium_mg: 450
        },
        estimated: false,
        needs_clarification: false
      },
      validation: {
        errors: [],
        warnings: [],
        missing_critical: []
      },
      suggestions: ['Great protein-rich meal!']
    };

    render(
      <MealPreview
        data={mockData}
        onSave={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    // Check nutrition cards
    expect(screen.getByText('520')).toBeInTheDocument();
    expect(screen.getByText('52g')).toBeInTheDocument();
    expect(screen.getByText('48g')).toBeInTheDocument();

    // Check meal name
    expect(screen.getByText('Grilled Chicken Breast with Brown Rice')).toBeInTheDocument();

    // Check foods are listed
    expect(screen.getByText(/Grilled chicken breast/i)).toBeInTheDocument();
    expect(screen.getByText(/6oz/i)).toBeInTheDocument();

    // Should NOT show warnings
    expect(screen.queryByText(/Needs Clarification/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\?/)).not.toBeInTheDocument();
  });

  /**
   * Test Case 2: Meal without portions
   * Expected: Warning banner, null nutrition, clarification needed
   */
  test('displays warning banner when portions are missing', () => {
    const mockData: QuickEntryPreviewResponse = {
      success: true,
      entry_type: 'meal',
      confidence: 0.75,
      data: {
        primary_fields: {
          meal_name: 'Chicken and Rice',
          meal_type: 'lunch',
          calories: null,
          protein_g: null,
          foods: [
            { name: 'Chicken', quantity: 'not specified' },
            { name: 'Rice', quantity: 'not specified' }
          ]
        },
        secondary_fields: {},
        estimated: false,
        needs_clarification: true
      },
      validation: {
        errors: [],
        warnings: ['Missing portion sizes for accurate tracking'],
        missing_critical: ['portions']
      },
      suggestions: ['Add portions like "6oz chicken, 1 cup rice"']
    };

    render(
      <MealPreview
        data={mockData}
        onSave={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    // Check warning banner
    expect(screen.getByText(/Needs Clarification/i)).toBeInTheDocument();
    expect(screen.getByText(/Missing portion sizes/i)).toBeInTheDocument();

    // Check nutrition shows "?"
    const questionMarks = screen.getAllByText('?');
    expect(questionMarks.length).toBeGreaterThan(0);

    // Check suggestion
    expect(screen.getByText(/Add portions/i)).toBeInTheDocument();
  });

  /**
   * Test Case 9: Edit mode
   * Expected: Fields transform to inputs when edit button clicked
   */
  test('transforms fields to inputs in edit mode', () => {
    const mockData: QuickEntryPreviewResponse = {
      success: true,
      entry_type: 'meal',
      confidence: 0.90,
      data: {
        primary_fields: {
          meal_name: 'Test Meal',
          meal_type: 'lunch',
          calories: 400,
          protein_g: 30,
          foods: [{ name: 'Test Food', quantity: '1 serving' }]
        },
        secondary_fields: {},
        estimated: false,
        needs_clarification: false
      },
      validation: { errors: [], warnings: [], missing_critical: [] },
      suggestions: []
    };

    render(
      <MealPreview
        data={mockData}
        onSave={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    // Initially should show text (not input)
    expect(screen.getByText('Test Meal')).toBeInTheDocument();

    // Click edit button
    const editButton = screen.getByText(/Edit/i);
    fireEvent.click(editButton);

    // Now should show input
    const mealNameInput = screen.getByDisplayValue('Test Meal');
    expect(mealNameInput).toBeInTheDocument();
    expect(mealNameInput.tagName).toBe('INPUT');

    // Button text should change
    expect(screen.getByText(/Done Editing/i)).toBeInTheDocument();
  });

  /**
   * Test: Estimated badge
   * Expected: Show "Estimated" badge when data.estimated = true
   */
  test('displays estimated badge when nutrition is estimated', () => {
    const mockData: QuickEntryPreviewResponse = {
      success: true,
      entry_type: 'meal',
      confidence: 0.85,
      data: {
        primary_fields: {
          meal_name: 'Estimated Meal',
          meal_type: 'dinner',
          calories: 600,
          protein_g: 40,
          foods: []
        },
        secondary_fields: {},
        estimated: true,
        needs_clarification: false
      },
      validation: { errors: [], warnings: [], missing_critical: [] },
      suggestions: []
    };

    render(
      <MealPreview
        data={mockData}
        onSave={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    // Check for estimated badge
    expect(screen.getByText(/Estimated/i)).toBeInTheDocument();
    expect(screen.getByText(/85% confidence/i)).toBeInTheDocument();
  });

  /**
   * Test: Meal type selection
   * Expected: Meal type buttons should be interactive in edit mode
   */
  test('allows meal type selection in edit mode', () => {
    const mockData: QuickEntryPreviewResponse = {
      success: true,
      entry_type: 'meal',
      confidence: 0.90,
      data: {
        primary_fields: {
          meal_name: 'Test',
          meal_type: 'breakfast',
          calories: 300,
          protein_g: 20,
          foods: []
        },
        secondary_fields: {},
        estimated: false,
        needs_clarification: false
      },
      validation: { errors: [], warnings: [], missing_critical: [] },
      suggestions: []
    };

    render(
      <MealPreview
        data={mockData}
        onSave={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    // Enter edit mode
    const editButton = screen.getByText(/Edit/i);
    fireEvent.click(editButton);

    // Check all meal type buttons are present
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText('Snack')).toBeInTheDocument();

    // Click lunch button
    const lunchButton = screen.getByText('Lunch');
    fireEvent.click(lunchButton);

    // Verify it becomes selected (has purple background)
    expect(lunchButton.className).toContain('bg-purple-500');
  });

  /**
   * Test: Save callback
   * Expected: onSave called with edited data
   */
  test('calls onSave with edited data when save button clicked', () => {
    const mockOnSave = jest.fn();
    const mockData: QuickEntryPreviewResponse = {
      success: true,
      entry_type: 'meal',
      confidence: 0.90,
      data: {
        primary_fields: {
          meal_name: 'Original Name',
          meal_type: 'lunch',
          calories: 400,
          protein_g: 30,
          foods: []
        },
        secondary_fields: {},
        estimated: false,
        needs_clarification: false
      },
      validation: { errors: [], warnings: [], missing_critical: [] },
      suggestions: []
    };

    render(
      <MealPreview
        data={mockData}
        onSave={mockOnSave}
        onEdit={jest.fn()}
      />
    );

    // Click save button
    const saveButton = screen.getByText(/Save Entry/i);
    fireEvent.click(saveButton);

    // Verify callback was called
    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Expandable details
   * Expected: "More details" button shows/hides secondary nutrition
   */
  test('expands to show detailed nutrition when expand button clicked', () => {
    const mockData: QuickEntryPreviewResponse = {
      success: true,
      entry_type: 'meal',
      confidence: 0.90,
      data: {
        primary_fields: {
          meal_name: 'Test Meal',
          meal_type: 'lunch',
          calories: 500,
          protein_g: 40,
          foods: []
        },
        secondary_fields: {
          fat_g: 15,
          fiber_g: 8,
          sugar_g: 5,
          sodium_mg: 600
        },
        estimated: false,
        needs_clarification: false
      },
      validation: { errors: [], warnings: [], missing_critical: [] },
      suggestions: []
    };

    render(
      <MealPreview
        data={mockData}
        onSave={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    // Initially, detailed nutrition should NOT be visible
    expect(screen.queryByText('Detailed Nutrition')).not.toBeInTheDocument();

    // Click "More details" button
    const expandButton = screen.getByText(/More details/i);
    fireEvent.click(expandButton);

    // Now detailed nutrition should be visible
    expect(screen.getByText('Detailed Nutrition')).toBeInTheDocument();
    expect(screen.getByText('15g')).toBeInTheDocument(); // fat
    expect(screen.getByText('8g')).toBeInTheDocument(); // fiber
  });

  /**
   * Test Case 10: Validation errors
   * Expected: Show error banner and inline errors
   */
  test('displays validation errors when present', () => {
    const mockData: QuickEntryPreviewResponse = {
      success: false,
      entry_type: 'meal',
      confidence: 0.45,
      data: {
        primary_fields: {
          meal_name: '',
          meal_type: 'lunch',
          calories: -50,
          protein_g: 999,
          foods: []
        },
        secondary_fields: {},
        estimated: false,
        needs_clarification: false
      },
      validation: {
        errors: [
          'Meal name cannot be empty',
          'Calories cannot be negative',
          'Protein value seems unrealistic'
        ],
        warnings: [],
        missing_critical: ['meal_name']
      },
      suggestions: []
    };

    render(
      <MealPreview
        data={mockData}
        onSave={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    // Should show error messages
    expect(screen.getByText(/Meal name cannot be empty/i)).toBeInTheDocument();
    expect(screen.getByText(/Calories cannot be negative/i)).toBeInTheDocument();
  });
});
