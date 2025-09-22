export interface Exercise {
  id: number;
  name: string;
  category: string;
  muscle_group: string;
  equipment?: string | null;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
  instructions?: string[] | null;
  created_at: string;
  user_id?: string | null;
}
