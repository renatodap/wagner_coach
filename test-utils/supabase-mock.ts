// Mock Supabase client for testing

import { createMockMeal } from './nutrition';

export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
      error: null,
    }),
    signIn: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  from: jest.fn((table: string) => ({
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: createMockMeal(),
      error: null,
    }),
    then: jest.fn((resolve) => resolve({
      data: [createMockMeal()],
      error: null,
    })),
  })),
  rpc: jest.fn(),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      remove: jest.fn(),
      list: jest.fn(),
      getPublicUrl: jest.fn(),
    })),
  },
};

// Helper to reset all mocks
export function resetSupabaseMocks() {
  Object.values(mockSupabaseClient.auth).forEach((mock) => {
    if (typeof mock === 'function' && mock.mockReset) {
      mock.mockReset();
    }
  });
  mockSupabaseClient.from.mockClear();
  mockSupabaseClient.rpc.mockClear();
}

// Helper to set up specific mock responses
export function setSupabaseMockResponse(
  method: 'insert' | 'select' | 'update' | 'delete',
  response: { data: any; error: any }
) {
  const chainMock = {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(response),
    then: jest.fn((resolve) => resolve(response)),
  };

  mockSupabaseClient.from.mockReturnValue(chainMock);
}

// Helper to simulate authentication states
export function setAuthState(isAuthenticated: boolean, userId?: string) {
  if (isAuthenticated) {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: userId || 'test-user-id',
          email: 'test@example.com',
        },
      },
      error: null,
    });
  } else {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
  }
}

// Export as default for easier mocking
export default mockSupabaseClient;