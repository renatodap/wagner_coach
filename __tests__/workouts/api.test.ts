import { POST as createWorkout } from '@/app/api/workouts/create/route';
import { POST as createUserExercise, GET as getUserExercises } from '@/app/api/user-exercises/route';
import { GET as getSingleUserExercise, PUT as updateUserExercise, DELETE as deleteUserExercise } from '@/app/api/user-exercises/[id]/route';
import { PUT as updateWorkout } from '@/app/api/workouts/[id]/route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase/server');

describe('Workouts API', () => {
  const mockedCreateClient = createClient as jest.Mock;

  beforeEach(() => {
    mockedCreateClient.mockReturnValue({
        auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
        },
        from: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/workouts/create', () => {
    it('should create a new workout', async () => {
      const fromMock = mockedCreateClient().from;
      fromMock.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 1, name: 'Test Workout' }, error: null }),
      });

      const request = { json: async () => ({ name: 'Test Workout' }) } as NextRequest;
      const response = await createWorkout(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({ id: 1, name: 'Test Workout' });
    });
  });

  describe('PUT /api/workouts/:id', () => {
    it('should update a workout', async () => {
        const fromMock = mockedCreateClient().from;
        // Mock for workouts update
        fromMock.mockReturnValueOnce({
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 1, name: 'Updated Workout' }, error: null }),
        });
        // Mock for workout_exercises delete
        fromMock.mockReturnValueOnce({
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: null }),
        });
        // Mock for workout_exercises insert
        fromMock.mockReturnValueOnce({
            insert: jest.fn().mockResolvedValue({ error: null }),
        });

        const request = { json: async () => ({ name: 'Updated Workout', exercises: [] }) } as NextRequest;
        const response = await updateWorkout(request, { params: { id: '1' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({ id: 1, name: 'Updated Workout' });
    });
  });

  describe('User Exercises API', () => {
    it('should create a new user exercise', async () => {
        const fromMock = mockedCreateClient().from;
        fromMock.mockReturnValue({
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 1, name: 'Test Exercise' }, error: null }),
        });

      const request = { json: async () => ({ name: 'Test Exercise' }) } as NextRequest;
      const response = await createUserExercise(request);
      const data = await response.json();
      expect(response.status).toBe(201);
      expect(data).toEqual({ id: 1, name: 'Test Exercise' });
    });

    it('should get all user exercises', async () => {
        const fromMock = mockedCreateClient().from;
        fromMock.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [{ id: 1, name: 'Test Exercise' }], error: null }),
        });

        const request = {} as NextRequest;
        const response = await getUserExercises(request);
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data).toEqual([{ id: 1, name: 'Test Exercise' }]);
    });

    it('should get a single user exercise', async () => {
        const fromMock = mockedCreateClient().from;
        fromMock.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 1, name: 'Test Exercise' }, error: null }),
        });

        const request = {} as NextRequest;
        const response = await getSingleUserExercise(request, { params: { id: '1' } });
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data).toEqual({ id: 1, name: 'Test Exercise' });
    });

    it('should update a user exercise', async () => {
        const fromMock = mockedCreateClient().from;
        fromMock.mockReturnValue({
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 1, name: 'Updated Exercise' }, error: null }),
        });
        const request = { json: async () => ({ name: 'Updated Exercise' }) } as NextRequest;
        const response = await updateUserExercise(request, { params: { id: '1' } });
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data).toEqual({ id: 1, name: 'Updated Exercise' });
    });

    it('should delete a user exercise', async () => {
        const fromMock = mockedCreateClient().from;
        fromMock.mockReturnValue({
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: null }),
        });
        const request = {} as NextRequest;
        const response = await deleteUserExercise(request, { params: { id: '1' } });
        expect(response.status).toBe(204);
    });
  });
});
