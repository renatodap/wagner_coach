// Mock NextRequest for testing
class MockNextRequest {
  url: string;
  method: string;
  headers: Map<string, string>;
  body: string;

  constructor(url: string, options: { method: string; body: string; headers: Record<string, string> }) {
    this.url = url;
    this.method = options.method;
    this.body = options.body;
    this.headers = new Map(Object.entries(options.headers));
  }

  async json() {
    return JSON.parse(this.body);
  }
}
import { POST, GET } from './route';
import { createClient } from '@/lib/supabase/server';
import { MealInsert } from '@/types/nutrition';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}));

// Mock NextResponse
const mockJson = jest.fn();
jest.mock('next/server', () => ({
  NextResponse: {
    json: (...args: unknown[]) => mockJson(...args)
  }
}));

describe('POST /api/nutrition/meals', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    mockJson.mockImplementation((data, options) => ({
      ...data,
      status: options?.status || 200
    }));
  });

  describe('POST Request Handling', () => {
    test('should accept valid meal data', async () => {
      const validMealData: MealInsert = {
        meal_name: 'Chicken Salad',
        meal_category: 'lunch',
        logged_at: new Date().toISOString(),
        calories: 450,
        protein_g: 35
      };

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: { id: 'new-meal-id', ...validMealData, user_id: 'test-user-id' },
              error: null
            })
          })
        })
      });

      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify(validMealData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockSupabase.from).toHaveBeenCalledWith('meals');
    });

    test('should reject requests without authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify({
          meal_name: 'Test Meal',
          meal_category: 'lunch',
          logged_at: new Date().toISOString()
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(response.error).toBe('Unauthorized');
    });

    test('should reject requests with missing required fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      const invalidData = {
        meal_category: 'lunch',
        logged_at: new Date().toISOString()
        // Missing meal_name
      };

      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(response.error).toContain('meal_name is required');
    });

    test('should reject requests with invalid field types', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      const invalidData = {
        meal_name: 'Test Meal',
        meal_category: 'invalid-category', // Invalid enum value
        logged_at: new Date().toISOString()
      };

      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(response.error).toContain('Invalid meal category');
    });

    test('should sanitize user input', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      const dataWithHTML = {
        meal_name: '<script>alert("XSS")</script>Chicken',
        meal_category: 'lunch',
        logged_at: new Date().toISOString(),
        notes: '<img src="x" onerror="alert(1)">'
      };

      const mockInsert = jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          single: jest.fn().mockResolvedValueOnce({
            data: { id: 'new-meal-id', ...dataWithHTML, user_id: 'test-user-id' },
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert
      });

      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify(dataWithHTML),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await POST(request);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          meal_name: expect.not.stringContaining('<script>'),
          notes: expect.not.stringContaining('<img')
        })
      );
    });

    test('should return 201 status on successful creation', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      const validMealData = {
        meal_name: 'Test Meal',
        meal_category: 'dinner',
        logged_at: new Date().toISOString()
      };

      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: { id: 'new-meal-id', ...validMealData, user_id: 'test-user-id' },
              error: null
            })
          })
        })
      });

      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify(validMealData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    test('should return created meal object in response', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      const validMealData = {
        meal_name: 'Test Meal',
        meal_category: 'breakfast',
        logged_at: new Date().toISOString()
      };

      const createdMeal = {
        id: 'new-meal-id',
        ...validMealData,
        user_id: 'test-user-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: createdMeal,
              error: null
            })
          })
        })
      });

      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify(validMealData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.data).toEqual(createdMeal);
    });

    test('should return 400 for invalid data', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    test('should return 401 for unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify({
          meal_name: 'Test Meal',
          meal_category: 'lunch',
          logged_at: new Date().toISOString()
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Database Interaction (Mocked)', () => {
    test('should call Supabase insert with correct data', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      const mealData = {
        meal_name: 'Test Meal',
        meal_category: 'lunch',
        logged_at: new Date().toISOString()
      };

      const mockInsert = jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          single: jest.fn().mockResolvedValueOnce({
            data: { id: 'new-meal-id', ...mealData, user_id: 'test-user-id' },
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert
      });

      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify(mealData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await POST(request);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          meal_name: 'Test Meal',
          meal_category: 'lunch',
          logged_at: mealData.logged_at
        })
      );
    });

    test('should include user_id from authenticated session', async () => {
      const userId = 'authenticated-user-id';

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: userId } },
        error: null
      });

      const mealData = {
        meal_name: 'Test Meal',
        meal_category: 'dinner',
        logged_at: new Date().toISOString()
      };

      const mockInsert = jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          single: jest.fn().mockResolvedValueOnce({
            data: { id: 'new-meal-id', ...mealData, user_id: userId },
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert
      });

      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify(mealData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await POST(request);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId
        })
      );
    });

    test('should set logged_at timestamp correctly', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      const specificTime = '2024-01-24T19:00:00Z';
      const mealData = {
        meal_name: 'Test Meal',
        meal_category: 'snack',
        logged_at: specificTime
      };

      const mockInsert = jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          single: jest.fn().mockResolvedValueOnce({
            data: { id: 'new-meal-id', ...mealData, user_id: 'test-user-id' },
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert
      });

      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify(mealData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await POST(request);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          logged_at: specificTime
        })
      );
    });

    test('should handle database errors gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: null,
              error: new Error('Database connection failed')
            })
          })
        })
      });

      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify({
          meal_name: 'Test Meal',
          meal_category: 'lunch',
          logged_at: new Date().toISOString()
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      expect(response.error).toContain('Failed to create meal');
    });

    test('should not expose sensitive database errors to client', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: null,
              error: new Error('FATAL: password authentication failed for user "postgres"')
            })
          })
        })
      });

      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify({
          meal_name: 'Test Meal',
          meal_category: 'lunch',
          logged_at: new Date().toISOString()
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.error).not.toContain('password');
      expect(response.error).not.toContain('postgres');
      expect(response.error).toBe('Failed to create meal');
    });
  });

  describe('Data Validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'test-user-id' } },
        error: null
      });
    });

    test('should validate meal name is not empty', async () => {
      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify({
          meal_name: '',
          meal_category: 'lunch',
          logged_at: new Date().toISOString()
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(response.error).toContain('meal_name is required');
    });

    test('should validate meal name length (max 200 chars)', async () => {
      const longName = 'a'.repeat(201);

      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify({
          meal_name: longName,
          meal_category: 'lunch',
          logged_at: new Date().toISOString()
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(response.error).toContain('meal_name must be 200 characters or less');
    });

    test('should validate category is valid enum value', async () => {
      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify({
          meal_name: 'Test Meal',
          meal_category: 'brunch', // Invalid category
          logged_at: new Date().toISOString()
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(response.error).toContain('Invalid meal category');
    });

    test('should validate logged_at is valid timestamp', async () => {
      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify({
          meal_name: 'Test Meal',
          meal_category: 'lunch',
          logged_at: 'invalid-date'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(response.error).toContain('Invalid date format');
    });

    test('should validate macros are non-negative numbers', async () => {
      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify({
          meal_name: 'Test Meal',
          meal_category: 'lunch',
          logged_at: new Date().toISOString(),
          calories: -100,
          protein_g: -10
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(response.error).toContain('must be a positive number');
    });

    test('should allow optional fields to be null/undefined', async () => {
      const mealData = {
        meal_name: 'Test Meal',
        meal_category: 'lunch',
        logged_at: new Date().toISOString()
        // Optional fields not included
      };

      const mockInsert = jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          single: jest.fn().mockResolvedValueOnce({
            data: { id: 'new-meal-id', ...mealData, user_id: 'test-user-id' },
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert
      });

      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify(mealData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    test('should validate notes length (max 500 chars)', async () => {
      const longNotes = 'a'.repeat(501);

      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify({
          meal_name: 'Test Meal',
          meal_category: 'lunch',
          logged_at: new Date().toISOString(),
          notes: longNotes
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(response.error).toContain('notes must be 500 characters or less');
    });

    test('should validate logged_at is required', async () => {
      const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify({
          meal_name: 'Test Meal',
          meal_category: 'lunch'
          // Missing logged_at
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(response.error).toContain('logged_at is required');
    });
  });
});

describe('GET /api/nutrition/meals', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    mockJson.mockImplementation((data, options) => ({
      ...data,
      status: options?.status || 200
    }));
  });

  test('should fetch meals for authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' } },
      error: null
    });

    const mockMeals = [
      { id: '1', meal_name: 'Breakfast', meal_category: 'breakfast' },
      { id: '2', meal_name: 'Lunch', meal_category: 'lunch' }
    ];

    mockSupabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          order: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce({
              data: mockMeals,
              error: null
            })
          })
        })
      })
    });

    const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
      method: 'GET',
      body: '',
      headers: {}
    });

    const response = await GET(request);

    expect(response.data).toEqual(mockMeals);
  });

  test('should reject unauthenticated GET requests', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Not authenticated')
    });

    const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
      method: 'GET',
      body: '',
      headers: {}
    });

    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(response.error).toBe('Unauthorized');
  });

  test('should filter by date when provided', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' } },
      error: null
    });

    const mockQuery = {
      select: jest.fn().mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          order: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockReturnValueOnce({
              gte: jest.fn().mockReturnValueOnce({
                lte: jest.fn().mockResolvedValueOnce({
                  data: [],
                  error: null
                })
              })
            })
          })
        })
      })
    };

    mockSupabase.from.mockReturnValueOnce(mockQuery);

    const request = new MockNextRequest('http://localhost/api/nutrition/meals?date=2024-01-24', {
      method: 'GET',
      body: '',
      headers: {}
    });

    await GET(request);

    expect(mockSupabase.from).toHaveBeenCalledWith('meals');
  });

  test('should handle database errors in GET', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' } },
      error: null
    });

    mockSupabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          order: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce({
              data: null,
              error: new Error('Database error')
            })
          })
        })
      })
    });

    const request = new MockNextRequest('http://localhost/api/nutrition/meals', {
      method: 'GET',
      body: '',
      headers: {}
    });

    const response = await GET(request);

    expect(response.status).toBe(500);
    expect(response.error).toBe('Failed to fetch meals');
  });
});