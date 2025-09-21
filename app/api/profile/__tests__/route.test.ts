import { NextRequest } from 'next/server';
import { GET } from '../route';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
    rpc: jest.fn(),
  })),
}));

describe('GET /api/profile', () => {
  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockSupabase = createClient('', '');
    jest.clearAllMocks();
  });

  describe('Data Retrieval', () => {
    test('should fetch complete profile data', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockProfile = {
        id: 'user-123',
        full_name: 'Test User',
        about_me: 'Fitness enthusiast',
        experience_level: 'intermediate'
      };

      mockSupabase.from().single.mockResolvedValue({
        data: mockProfile,
        error: null
      });

      mockRequest = new NextRequest('http://localhost:3000/api/profile', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile).toEqual(mockProfile);
    });

    test('should include calculated stats', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      mockSupabase.rpc.mockResolvedValue({
        data: {
          total_workouts: 25,
          current_streak: 7,
          goals_completed: 3,
          total_minutes: 1200
        },
        error: null
      });

      mockRequest = new NextRequest('http://localhost:3000/api/profile');

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.stats).toBeDefined();
      expect(data.stats.totalWorkouts).toBe(25);
      expect(data.stats.currentStreak).toBe(7);
    });

    test('should include recent activity', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockActivity = [
        { id: '1', type: 'workout', created_at: '2024-01-20' },
        { id: '2', type: 'goal_update', created_at: '2024-01-19' }
      ];

      mockSupabase.from().mockResolvedValue({ data: mockActivity, error: null });

      mockRequest = new NextRequest('http://localhost:3000/api/profile');

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.recentActivity).toEqual(mockActivity);
    });

    test('should handle profile not found', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // Not found
      });

      mockRequest = new NextRequest('http://localhost:3000/api/profile');

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Profile not found');
    });
  });

  describe('Performance', () => {
    test('should complete request in reasonable time', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const start = Date.now();

      mockRequest = new NextRequest('http://localhost:3000/api/profile');
      await GET(mockRequest);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe('Authentication', () => {
    test('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      mockRequest = new NextRequest('http://localhost:3000/api/profile');

      const response = await GET(mockRequest);

      expect(response.status).toBe(401);
    });
  });
});