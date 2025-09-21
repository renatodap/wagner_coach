import { MealLogForm } from '@/components/nutrition/MealLogForm';

export default function AddMealPage() {
  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Add Meal</h1>
        <MealLogForm />
      </div>
    </div>
  );
}