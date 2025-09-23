import { NextRequest } from 'next/server';
import { POST } from './route';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// Mock OpenAI
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  })),
}));

describe('/api/nutrition/analyze-photo', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://test-url.com/image.jpg' },
        }),
      })),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  // Authentication Tests
  test('should reject unauthenticated requests', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/nutrition/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({ imageData: 'test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toContain('Unauthorized');
  });

  test('should accept requests with valid user session', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/nutrition/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({ imageData: 'data:image/jpeg;base64,test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  test('should return 401 for expired sessions', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Session expired' },
    });

    const request = new NextRequest('http://localhost:3000/api/nutrition/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({ imageData: 'test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  // Request Validation Tests
  test('should reject requests without image data', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/nutrition/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('Image data is required');
  });

  test('should validate image data is base64 encoded', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/nutrition/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({ imageData: 'not-base64' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('Invalid image format');
  });

  test('should reject oversized images (>10MB)', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    // Create a large base64 string (>10MB)
    const largeImage = 'data:image/jpeg;base64,' + 'A'.repeat(15 * 1024 * 1024);

    const request = new NextRequest('http://localhost:3000/api/nutrition/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({ imageData: largeImage }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('Image size exceeds 10MB');
  });

  test('should accept valid JPEG/PNG images', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    const validJpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAA';
    const request = new NextRequest('http://localhost:3000/api/nutrition/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({ imageData: validJpeg }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  test('should validate optional meal category parameter', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/nutrition/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({
        imageData: 'data:image/jpeg;base64,test',
        mealCategory: 'invalid-category',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('Invalid meal category');
  });

  // AI Service Integration Tests (mocked responses)
  test('should handle successful AI analysis', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    const mockOpenAI = require('openai').default;
    const mockCreate = jest.fn().mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            foodItems: [
              {
                name: 'Chicken',
                quantity: '150g',
                confidence: 0.95,
                calories: 250,
                protein_g: 40,
                carbs_g: 0,
                fat_g: 10,
                fiber_g: 0,
              },
            ],
            totalNutrition: {
              calories: 250,
              protein_g: 40,
              carbs_g: 0,
              fat_g: 10,
              fiber_g: 0,
            },
            suggestedMealName: 'Grilled Chicken',
            confidence: 0.95,
          }),
        },
      }],
    });

    mockOpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }));

    const request = new NextRequest('http://localhost:3000/api/nutrition/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({ imageData: 'data:image/jpeg;base64,test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.foodItems).toHaveLength(1);
    expect(data.data.foodItems[0].name).toBe('Chicken');
  });

  test('should handle AI service errors', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    const mockOpenAI = require('openai').default;
    const mockCreate = jest.fn().mockRejectedValueOnce(new Error('AI service error'));

    mockOpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }));

    const request = new NextRequest('http://localhost:3000/api/nutrition/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({ imageData: 'data:image/jpeg;base64,test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toContain('Failed to analyze image');
  });

  // Response Processing Tests
  test('should generate analysis ID for tracking', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/nutrition/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({ imageData: 'data:image/jpeg;base64,test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.analysisId).toBeDefined();
    expect(data.analysisId).toMatch(/^[a-zA-Z0-9-]+$/);
  });

  test('should store analysis for feedback collection', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/nutrition/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({ imageData: 'data:image/jpeg;base64,test' }),
    });

    await POST(request);

    expect(mockSupabase.from).toHaveBeenCalledWith('meal_photo_analyses');
    expect(mockSupabase.from().insert).toHaveBeenCalled();
  });

  // Error Handling Tests
  test('should handle no food detected responses', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    const mockOpenAI = require('openai').default;
    const mockCreate = jest.fn().mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            foodItems: [],
            error: 'No food detected in image',
          }),
        },
      }],
    });

    mockOpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }));

    const request = new NextRequest('http://localhost:3000/api/nutrition/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({ imageData: 'data:image/jpeg;base64,test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(422);

    const data = await response.json();
    expect(data.error).toContain('No food detected');
  });

  test('should not expose sensitive API errors', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    const mockOpenAI = require('openai').default;
    const mockCreate = jest.fn().mockRejectedValueOnce({
      message: 'API_KEY_INVALID: sk-test123',
      code: 'auth_error',
    });

    mockOpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }));

    const request = new NextRequest('http://localhost:3000/api/nutrition/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({ imageData: 'data:image/jpeg;base64,test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.error).not.toContain('sk-test123');
    expect(data.error).toContain('Failed to analyze image');
  });
});