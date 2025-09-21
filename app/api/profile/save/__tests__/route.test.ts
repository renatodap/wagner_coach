import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createClient } from '@supabase/supabase-js';
import { ProfileUpdate } from '@/types/profile';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  })),
}));

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('POST /api/profile/save', () => {
  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockSupabase = createClient('', '');
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    test('should reject unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      mockRequest = new NextRequest('http://localhost:3000/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ full_name: 'Test User' }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('should accept authenticated requests', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const profileData: ProfileUpdate = {
        full_name: 'Test User',
        age: 30,
        experience_level: 'intermediate',
      };

      mockRequest = new NextRequest('http://localhost:3000/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(profileData),
      });

      mockSupabase.from().single.mockResolvedValue({
        data: { id: mockUser.id, ...profileData },
        error: null,
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.full_name).toBe('Test User');
    });

    test('should validate user owns the profile', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      // Try to update a different user's profile
      const profileData = {
        id: 'different-user-456', // Different user ID
        full_name: 'Hacker',
      };

      mockRequest = new NextRequest('http://localhost:3000/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(profileData),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });
  });

  describe('Data Validation', () => {
    beforeEach(() => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    });

    test('should validate required fields', async () => {
      const invalidData = {
        // Missing required fields
        experience_level: 'invalid-level', // Invalid enum
      };

      mockRequest = new NextRequest('http://localhost:3000/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('validation');
    });

    test('should reject invalid enum values', async () => {
      const invalidData: any = {
        full_name: 'Test User',
        experience_level: 'expert', // Not a valid enum value
      };

      mockRequest = new NextRequest('http://localhost:3000/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('experience_level');
    });

    test('should sanitize string inputs', async () => {
      const unsafeData = {
        full_name: '<script>alert("XSS")</script>',
        about_me: 'Normal text <img src=x onerror=alert(1)>',
      };

      mockRequest = new NextRequest('http://localhost:3000/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(unsafeData),
      });

      mockSupabase.from().single.mockResolvedValue({
        data: {
          id: 'user-123',
          full_name: 'alert("XSS")', // Sanitized
          about_me: 'Normal text ', // Sanitized
        },
        error: null,
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.full_name).not.toContain('<script>');
      expect(data.data.about_me).not.toContain('<img');
    });

    test('should validate array lengths', async () => {
      const tooManyGoals = new Array(25).fill('goal'); // Exceeds max

      const invalidData = {
        full_name: 'Test User',
        fitness_goals: tooManyGoals,
      };

      mockRequest = new NextRequest('http://localhost:3000/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('too many');
    });

    test('should validate numeric ranges', async () => {
      const invalidData = {
        full_name: 'Test User',
        age: 150, // Exceeds max
        height: 400, // Exceeds max cm
        weight: -10, // Negative not allowed
      };

      mockRequest = new NextRequest('http://localhost:3000/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.errors).toContainEqual(
        expect.objectContaining({ field: 'age' })
      );
      expect(data.errors).toContainEqual(
        expect.objectContaining({ field: 'height' })
      );
      expect(data.errors).toContainEqual(
        expect.objectContaining({ field: 'weight' })
      );
    });
  });

  describe('Database Operations', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    });

    test('should create new profile if not exists', async () => {
      // Profile doesn't exist
      mockSupabase.from().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // Not found
      });

      // Insert succeeds
      mockSupabase.from().single.mockResolvedValueOnce({
        data: {
          id: mockUser.id,
          full_name: 'New User',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const profileData = {
        full_name: 'New User',
        age: 25,
      };

      mockRequest = new NextRequest('http://localhost:3000/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(profileData),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabase.from().insert).toHaveBeenCalled();
    });

    test('should update existing profile', async () => {
      // Profile exists
      mockSupabase.from().single.mockResolvedValueOnce({
        data: {
          id: mockUser.id,
          full_name: 'Existing User',
          age: 30,
        },
        error: null,
      });

      // Update succeeds
      mockSupabase.from().single.mockResolvedValueOnce({
        data: {
          id: mockUser.id,
          full_name: 'Updated User',
          age: 31,
        },
        error: null,
      });

      const profileData = {
        full_name: 'Updated User',
        age: 31,
      };

      mockRequest = new NextRequest('http://localhost:3000/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(profileData),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabase.from().update).toHaveBeenCalled();
    });

    test('should handle partial updates', async () => {
      // Only updating specific fields
      const partialUpdate = {
        about_me: 'Updated bio',
        // Other fields not included
      };

      mockSupabase.from().single.mockResolvedValue({
        data: {
          id: mockUser.id,
          full_name: 'Existing Name', // Unchanged
          about_me: 'Updated bio', // Updated
          age: 30, // Unchanged
        },
        error: null,
      });

      mockRequest = new NextRequest('http://localhost:3000/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(partialUpdate),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.about_me).toBe('Updated bio');
      expect(data.data.full_name).toBe('Existing Name');
    });

    test('should return updated profile data', async () => {
      const profileData = {
        full_name: 'Test User',
        age: 30,
        experience_level: 'intermediate',
        fitness_goals: ['weight_loss', 'muscle_gain'],
      };

      mockSupabase.from().single.mockResolvedValue({
        data: {
          id: mockUser.id,
          ...profileData,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-22T00:00:00Z',
        },
        error: null,
      });

      mockRequest = new NextRequest('http://localhost:3000/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(profileData),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject(profileData);
    });

    test('should trigger embedding generation', async () => {
      const profileData = {
        full_name: 'Test User',
        about_me: 'I love fitness and want to get stronger',
      };

      mockSupabase.from().single.mockResolvedValue({
        data: { id: mockUser.id, ...profileData },
        error: null,
      });

      // Mock fetch for embedding generation
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      mockRequest = new NextRequest('http://localhost:3000/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(profileData),
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile/embeddings'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should return 400 for invalid data', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: 'invalid json',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid');
    });

    test('should return 401 for unauthenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      mockRequest = new NextRequest('http://localhost:3000/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ full_name: 'Test' }),
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(401);
    });

    test('should return 500 for database errors', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      mockRequest = new NextRequest('http://localhost:3000/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify({ full_name: 'Test' }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Database');
    });

    test('should log errors appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockSupabase.auth.getUser.mockRejectedValue(new Error('Auth service down'));

      mockRequest = new NextRequest('http://localhost:3000/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ full_name: 'Test' }),
      });

      await POST(mockRequest);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Profile save error'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});