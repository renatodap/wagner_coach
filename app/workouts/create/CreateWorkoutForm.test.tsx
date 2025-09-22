import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWorkoutForm from './CreateWorkoutForm';
import { createClient } from '@/lib/supabase/client';

// Mock the router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the Supabase client
const mockInsert = jest.fn();
const mockSingle = jest.fn();
const mockSelect = jest.fn(() => ({
  single: mockSingle,
}));
const mockFrom = jest.fn(() => ({
  insert: mockInsert,
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

describe('CreateWorkoutForm', () => {
  const userId = 'test-user-id';

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockInsert.mockReturnValue({
        select: mockSelect,
        error: null,
    });
    mockSingle.mockReturnValue({
        data: { id: 123, name: 'New Workout' },
        error: null,
    });
  });

  it('renders all form fields correctly', () => {
    render(<CreateWorkoutForm userId={userId} />);
    expect(screen.getByLabelText(/Workout Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Workout Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Difficulty/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Make this workout a public template/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save and Add Exercises/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('shows an error message if required fields are missing', async () => {
    render(<CreateWorkoutForm userId={userId} />);
    const saveButton = screen.getByRole('button', { name: /Save and Add Exercises/i });

    await userEvent.click(saveButton);

    expect(await screen.findByText(/Please fill out all required fields/i)).toBeInTheDocument();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('submits the form with the correct data and redirects on success', async () => {
    render(<CreateWorkoutForm userId={userId} />);

    // Fill out the form
    await userEvent.type(screen.getByLabelText(/Workout Name/i), 'My Custom Workout');
    await userEvent.type(screen.getByLabelText(/Description/i), 'A great workout for Tuesdays.');

    // Select from Radix UI Select components
    fireEvent.mouseDown(screen.getByLabelText(/Workout Type/i));
    await waitFor(() => screen.getByText('Push'));
    fireEvent.click(screen.getByText('Push'));

    fireEvent.mouseDown(screen.getByLabelText(/Difficulty/i));
    await waitFor(() => screen.getByText('Intermediate'));
    fireEvent.click(screen.getByText('Intermediate'));

    // Click the checkbox
    await userEvent.click(screen.getByLabelText(/Make this workout a public template/i));

    // Submit the form
    const saveButton = screen.getByRole('button', { name: /Save and Add Exercises/i });
    await userEvent.click(saveButton);

    // Verify Supabase insert was called with the correct data
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('workouts');
      expect(mockInsert).toHaveBeenCalledWith({
        name: 'My Custom Workout',
        description: 'A great workout for Tuesdays.',
        type: 'push',
        difficulty: 'intermediate',
        is_public: true,
        user_id: userId,
      });
    });

    // Verify redirect was called
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/workouts/edit/123');
    });
  });

  it('displays an error message if the Supabase insert fails', async () => {
    const errorMessage = 'Database connection failed';
    mockInsert.mockReturnValueOnce({
        select: mockSelect,
        error: { message: errorMessage },
    });
    mockSingle.mockReturnValueOnce({
        data: null,
        error: { message: errorMessage },
    });

    render(<CreateWorkoutForm userId={userId} />);

    // Fill form with valid data
    await userEvent.type(screen.getByLabelText(/Workout Name/i), 'Test Workout');
    fireEvent.mouseDown(screen.getByLabelText(/Workout Type/i));
    await waitFor(() => screen.getByText('Pull'));
    fireEvent.click(screen.getByText('Pull'));
    fireEvent.mouseDown(screen.getByLabelText(/Difficulty/i));
    await waitFor(() => screen.getByText('Beginner'));
    fireEvent.click(screen.getByText('Beginner'));

    // Submit
    await userEvent.click(screen.getByRole('button', { name: /Save and Add Exercises/i }));

    // Check for error message
    expect(await screen.findByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
