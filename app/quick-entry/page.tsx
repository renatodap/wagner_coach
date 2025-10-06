import { QuickEntryFlow } from '@/components/quick-entry/QuickEntryFlow';
import BottomNavigation from '@/app/components/BottomNavigation';

export default function QuickEntryPage() {
  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="font-heading text-4xl text-iron-orange">QUICK ENTRY</h1>
          <p className="text-iron-gray mt-2">
            Log anything quickly - meals, workouts, or activities. AI will understand and categorize.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <QuickEntryFlow />

        {/* Examples Section */}
        <div className="mt-12 space-y-6">
          <h2 className="font-heading text-2xl text-iron-orange">Examples</h2>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Meal Example */}
            <div className="border border-iron-gray p-4 rounded-lg">
              <div className="text-2xl mb-2">🍽️</div>
              <h3 className="font-heading text-lg text-iron-white mb-2">Meals</h3>
              <ul className="text-sm text-iron-gray space-y-1">
                <li>"Chicken breast with rice, 450 calories"</li>
                <li>"Protein shake with banana, 30g protein"</li>
                <li>"Breakfast: oatmeal with berries"</li>
              </ul>
            </div>

            {/* Activity Example */}
            <div className="border border-iron-gray p-4 rounded-lg">
              <div className="text-2xl mb-2">🏃</div>
              <h3 className="font-heading text-lg text-iron-white mb-2">Activities</h3>
              <ul className="text-sm text-iron-gray space-y-1">
                <li>"Ran 5 miles in 45 minutes"</li>
                <li>"30 minute yoga session"</li>
                <li>"Walked 10,000 steps today"</li>
              </ul>
            </div>

            {/* Workout Example */}
            <div className="border border-iron-gray p-4 rounded-lg">
              <div className="text-2xl mb-2">💪</div>
              <h3 className="font-heading text-lg text-iron-white mb-2">Workouts</h3>
              <ul className="text-sm text-iron-gray space-y-1">
                <li>"Chest day: bench press, flies, push-ups"</li>
                <li>"Leg workout with squats and lunges"</li>
                <li>"Upper body strength training"</li>
              </ul>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-8 p-6 bg-iron-gray/10 border border-iron-gray rounded-lg">
            <h3 className="font-heading text-xl text-iron-orange mb-3">Pro Tips</h3>
            <ul className="space-y-2 text-iron-gray">
              <li className="flex items-start gap-2">
                <span className="text-iron-orange">•</span>
                <span>Include specific numbers for better tracking (calories, duration, distance)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-iron-orange">•</span>
                <span>Add meal type (breakfast, lunch, dinner) for automatic categorization</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-iron-orange">•</span>
                <span>Mention exercises by name for accurate workout logging</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-iron-orange">•</span>
                <span>The more detail you provide, the better the AI can understand</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}