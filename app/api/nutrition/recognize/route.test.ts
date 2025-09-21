// API Route Tests for /api/nutrition/recognize

import { POST } from './route';
import { NextRequest } from 'next/server';
import { mockSupabaseClient, setAuthState } from '@/test-utils/supabase-mock';

// Mock Supabase
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock LogMeal API responses
const mockLogMealSuccess = {
  recognition_results: {
    food_items: [
      {
        food_id: 'chicken_001',
        name: 'Grilled Chicken Breast',
        prob: 0.92,
        quantity: 150,
        unit: 'g'
      },
      {
        food_id: 'rice_001',
        name: 'Brown Rice',
        prob: 0.85,
        quantity: 100,
        unit: 'g'
      }
    ]
  },
  nutritional_info: {
    total_calories: 360,
    total_proteins: 47.5,
    total_carbs: 23,
    total_fats: 5.9
  }
};

// Mock fetch for LogMeal API
global.fetch = jest.fn();

describe('POST /api/nutrition/recognize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAuthState(true);
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Successful Recognition', () => {
    it('should accept valid image upload', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogMealSuccess,
      });

      const request = new NextRequest('http://localhost/api/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
          userId: 'test-user-id'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should transform API response correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogMealSuccess,
      });

      const request = new NextRequest('http://localhost/api/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
          userId: 'test-user-id'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.foods).toHaveLength(2);
      expect(data.data.foods[0]).toEqual(
        expect.objectContaining({
          name: 'Grilled Chicken Breast',
          quantity: 150,
          unit: 'g',
          confidence: 0.92
        })
      );
    });

    it('should calculate total nutrition', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogMealSuccess,
      });

      const request = new NextRequest('http://localhost/api/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
          userId: 'test-user-id'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.totalNutrition).toEqual({
        calories: 360,
        protein_g: 47.5,
        carbs_g: 23,
        fat_g: 5.9
      });
    });

    it('should generate unique image ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogMealSuccess,
      });

      const request = new NextRequest('http://localhost/api/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
          userId: 'test-user-id'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.imageId).toBeDefined();
      expect(data.data.imageId).toMatch(/^img_/);
    });
  });

  describe('Validation', () => {
    it('should reject non-image data', async () => {
      const request = new NextRequest('http://localhost/api/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'not-an-image',
          userId: 'test-user-id'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid image format');
    });

    it('should enforce file size limits', async () => {
      // Create a large base64 string (>10MB when decoded)
      const largeImage = 'data:image/jpeg;base64,' + 'A'.repeat(15_000_000);

      const request = new NextRequest('http://localhost/api/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: largeImage,
          userId: 'test-user-id'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Image too large');
    });

    it('should require authentication', async () => {
      setAuthState(false);

      const request = new NextRequest('http://localhost/api/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
          userId: 'test-user-id'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });
  });

  describe('LogMeal API Integration', () => {
    it('should send image to LogMeal API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogMealSuccess,
      });

      const request = new NextRequest('http://localhost/api/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
          userId: 'test-user-id'
        }),
      });

      await POST(request);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('logmeal'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const request = new NextRequest('http://localhost/api/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
          userId: 'test-user-id'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toContain('Recognition service unavailable');
    });

    it('should handle partial recognition results', async () => {
      const partialResult = {
        recognition_results: {
          food_items: [
            {
              food_id: 'unknown_001',
              name: 'Unknown Food',
              prob: 0.3,
              quantity: 100,
              unit: 'g'
            }
          ]
        },
        nutritional_info: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => partialResult,
      });

      const request = new NextRequest('http://localhost/api/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
          userId: 'test-user-id'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.foods).toHaveLength(1);
      expect(data.data.foods[0].confidence).toBe(0.3);
    });

    it('should handle API rate limits', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({
          'Retry-After': '60'
        }),
      });

      const request = new NextRequest('http://localhost/api/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
          userId: 'test-user-id'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Rate limit exceeded');
      expect(data.retryAfter).toBe(60);
    });
  });

  describe('Caching', () => {
    it('should cache successful recognitions', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogMealSuccess,
      });

      const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';

      // First request
      const request1 = new NextRequest('http://localhost/api/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: imageData,
          userId: 'test-user-id'
        }),
      });

      const response1 = await POST(request1);
      const data1 = await response1.json();

      // Second identical request
      const request2 = new NextRequest('http://localhost/api/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: imageData,
          userId: 'test-user-id'
        }),
      });

      const response2 = await POST(request2);
      const data2 = await response2.json();

      // Should only call API once
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(data2.cached).toBe(true);
    });

    it('should expire cache after 24 hours', async () => {
      jest.useFakeTimers();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockLogMealSuccess,
      });

      const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';

      // First request
      const request1 = new NextRequest('http://localhost/api/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: imageData,
          userId: 'test-user-id'
        }),
      });

      await POST(request1);

      // Advance time 25 hours
      jest.advanceTimersByTime(25 * 60 * 60 * 1000);

      // Second request after cache expiry
      const request2 = new NextRequest('http://localhost/api/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: imageData,
          userId: 'test-user-id'
        }),
      });

      await POST(request2);

      // Should call API twice
      expect(global.fetch).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });

  describe('Security', () => {
    it('should not expose API key in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogMealSuccess,
      });

      const request = new NextRequest('http://localhost/api/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
          userId: 'test-user-id'
        }),
      });

      const response = await POST(request);
      const responseText = await response.text();

      expect(responseText).not.toContain('LOGMEAL_API_KEY');
      expect(responseText).not.toContain(process.env.LOGMEAL_API_KEY);
    });

    it('should validate image file types server-side', async () => {
      const request = new NextRequest('http://localhost/api/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:application/pdf;base64,JVBERi0xLj...',
          userId: 'test-user-id'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid image format');
    });

    it('should sanitize recognition results', async () => {
      const maliciousResult = {
        recognition_results: {
          food_items: [
            {
              food_id: 'xss_001',
              name: '<script>alert("XSS")</script>Chicken',
              prob: 0.9,
              quantity: 100,
              unit: 'g'
            }
          ]
        },
        nutritional_info: {
          total_calories: 200,
          total_proteins: 30,
          total_carbs: 0,
          total_fats: 8
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => maliciousResult,
      });

      const request = new NextRequest('http://localhost/api/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
          userId: 'test-user-id'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.foods[0].name).toBe('Chicken');
      expect(data.data.foods[0].name).not.toContain('<script>');
    });
  });
});