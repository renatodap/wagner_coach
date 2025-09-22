export interface Workout {
  id: number;
  name: string;
  type: string;
  goal?: string | null;
  duration_minutes?: number | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
  user_id: string | null;
  description?: string | null;
  is_public: boolean;
}
