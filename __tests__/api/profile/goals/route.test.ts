import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { createClient } from '@supabase/supabase-js';
import { UserGoalInsert } from '@/types/profile';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  })),
}));

describe('Profile Goals API', () => {
  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockSupabase = createClient('', '');
    jest.clearAllMocks();
  });

  describe('GET /api/profile/goals', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    });

    test('should list all user goals', async () => {
      const mockGoals = [
        {
          id: 'goal-1',
          user_id: 'user-123',
          goal_type: 'weight_loss',
          description: 'Lose 10 pounds',
          target_value: 10,
          is_active: true
        },
        {
          id: 'goal-2',
          user_id: 'user-123',
          goal_type: 'strength',
          description: 'Bench press 200 lbs',
          target_value: 200,
          is_active: true
        }
      ];

      mockSupabase.from().mockResolvedValue({ data: mockGoals, error: null });

      mockRequest = new NextRequest('http://localhost:3000/api/profile/goals', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.goals).toEqual(mockGoals);
      expect(data.total).toBe(2);
    });

    test('should filter by status', async () => {
      const activeGoals = [
        { id: 'goal-1', goal_type: 'weight_loss', is_active: true }
      ];

      mockSupabase.from().mockResolvedValue({ data: activeGoals, error: null });

      mockRequest = new NextRequest('http://localhost:3000/api/profile/goals?status=active', {
        method: 'GET'
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(mockSupabase.from().eq).toHaveBeenCalledWith('is_active', true);
      expect(data.goals).toEqual(activeGoals);
    });

    test('should support pagination', async () => {
      mockSupabase.from().mockResolvedValue({ data: [], error: null });

      mockRequest = new NextRequest('http://localhost:3000/api/profile/goals?limit=10&offset=20', {
        method: 'GET'
      });

      await GET(mockRequest);

      expect(mockSupabase.from().limit).toHaveBeenCalledWith(10);
      expect(mockSupabase.from().offset).toHaveBeenCalledWith(20);
    });

    test('should sort by priority', async () => {
      mockSupabase.from().mockResolvedValue({ data: [], error: null });

      mockRequest = new NextRequest('http://localhost:3000/api/profile/goals', {
        method: 'GET'
      });

      await GET(mockRequest);

      expect(mockSupabase.from().order).toHaveBeenCalledWith('priority', { ascending: true });
    });
  });

  describe('POST /api/profile/goals', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    });

    test('should create new goal', async () => {
      const newGoal: UserGoalInsert = {
        goal_type: 'muscle_gain',
        description: 'Gain 10 pounds of muscle',
        target_value: 10,
        target_unit: 'lbs',
        priority: 1
      };

      const createdGoal = {
        id: 'goal-new',
        user_id: 'user-123',
        ...newGoal,
        created_at: new Date().toISOString()
      };

      mockSupabase.from().single.mockResolvedValue({
        data: createdGoal,
        error: null
      });

      mockRequest = new NextRequest('http://localhost:3000/api/profile/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(newGoal)
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.goal).toEqual(createdGoal);
    });

    test('should validate goal data', async () => {
      const invalidGoal = {
        // Missing required fields
        goal_type: 'invalid_type',
      };

      mockRequest = new NextRequest('http://localhost:3000/api/profile/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(invalidGoal)
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('validation');
    });

    test('should auto-assign priority', async () => {
      const newGoal = {
        goal_type: 'endurance',
        description: 'Run 5k in under 25 minutes'
      };

      // Mock existing goals count
      mockSupabase.from().mockResolvedValueOnce({ count: 3, error: null });
      mockSupabase.from().single.mockResolvedValue({
        data: { ...newGoal, priority: 4 },
        error: null
      });

      mockRequest = new NextRequest('http://localhost:3000/api/profile/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal)
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.goal.priority).toBe(4);
    });

    test('should trigger embedding generation', async () => {
      const newGoal = {
        goal_type: 'flexibility',
        description: 'Improve flexibility for better mobility'
      };

      mockSupabase.from().single.mockResolvedValue({
        data: { id: 'goal-embed', ...newGoal },
        error: null
      });

      // Mock fetch for embedding generation
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      mockRequest = new NextRequest('http://localhost:3000/api/profile/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal)
      });

      await POST(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile/embeddings'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    test('should enforce maximum goal limit', async () => {
      // Mock user already has 5 goals
      mockSupabase.from().mockResolvedValue({ count: 5, error: null });

      const newGoal = {
        goal_type: 'general_fitness',
        description: 'Sixth goal attempt'
      };

      mockRequest = new NextRequest('http://localhost:3000/api/profile/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal)
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('maximum');
    });
  });

  describe('Authentication & Authorization', () => {
    test('should require authentication for GET', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      mockRequest = new NextRequest('http://localhost:3000/api/profile/goals');

      const response = await GET(mockRequest);

      expect(response.status).toBe(401);
    });

    test('should require authentication for POST', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      mockRequest = new NextRequest('http://localhost:3000/api/profile/goals', {
        method: 'POST',
        body: JSON.stringify({ goal_type: 'test' })
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(401);
    });
  });
});