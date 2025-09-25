// Client-side food service that works with Supabase
import { createClient } from '@/lib/supabase/client';
import { Food } from '@/types/nutrition-v2';

export class FoodService {
  private supabase = createClient();

  async searchFoods(query?: string, limit: number = 20): Promise<Food[]> {
    try {
      let dbQuery = this.supabase
        .from('foods')
        .select('*')
        .eq('is_public', true)
        .limit(limit);

      if (query) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      }

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Database query failed:', error);
        return [];
      }

      return (data as Food[]) || [];
    } catch (error) {
      console.error('Error searching foods:', error);
      return [];
    }
  }

  async createCustomFood(food: Partial<Food>): Promise<Food | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      if (!user) {
        console.error('User must be authenticated to create custom foods');
        return null;
      }

      const { data, error } = await this.supabase
        .from('foods')
        .insert([{
          ...food,
          created_by: user.id,
          is_public: false, // User's custom foods are private
          is_verified: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating custom food:', error);
        return null;
      }

      return data as Food;
    } catch (error) {
      console.error('Error creating custom food:', error);
      return null;
    }
  }

  async getUserFoods(): Promise<Food[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      if (!user) {
        return [];
      }

      const { data, error } = await this.supabase
        .from('foods')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user foods:', error);
        return [];
      }

      return (data as Food[]) || [];
    } catch (error) {
      console.error('Error fetching user foods:', error);
      return [];
    }
  }

  async getFoodById(id: string): Promise<Food | null> {
    try {
      const { data, error } = await this.supabase
        .from('foods')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching food by ID:', error);
        return null;
      }

      return data as Food;
    } catch (error) {
      console.error('Error fetching food by ID:', error);
      return null;
    }
  }

  async seedInitialFoods(): Promise<boolean> {
    try {
      // Check if foods already exist
      const { count } = await this.supabase
        .from('foods')
        .select('*', { count: 'exact', head: true });

      if (count && count > 0) {
        console.log('Foods already exist in database');
        return true;
      }

      // Seed initial foods
      const initialFoods = [
        {
          name: 'Chicken Breast, Grilled',
          description: 'Boneless, skinless chicken breast',
          calories: 165,
          protein_g: 31,
          carbs_g: 0,
          fat_g: 3.6,
          fiber_g: 0,
          serving_size: 100,
          serving_unit: 'g',
          is_public: true,
          is_verified: true
        },
        {
          name: 'Brown Rice, Cooked',
          description: 'Long-grain brown rice, cooked',
          calories: 112,
          protein_g: 2.6,
          carbs_g: 24,
          fat_g: 0.9,
          fiber_g: 1.8,
          serving_size: 100,
          serving_unit: 'g',
          is_public: true,
          is_verified: true
        },
        {
          name: 'Broccoli, Steamed',
          description: 'Fresh broccoli florets, steamed',
          calories: 35,
          protein_g: 2.4,
          carbs_g: 7.2,
          fat_g: 0.4,
          fiber_g: 3.3,
          serving_size: 100,
          serving_unit: 'g',
          is_public: true,
          is_verified: true
        }
      ];

      const { error } = await this.supabase
        .from('foods')
        .insert(initialFoods);

      if (error) {
        console.error('Error seeding foods:', error);
        return false;
      }

      console.log('Successfully seeded initial foods');
      return true;
    } catch (error) {
      console.error('Error in seedInitialFoods:', error);
      return false;
    }
  }
}