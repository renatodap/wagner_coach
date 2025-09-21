import {
  TrendingUp,
  Calendar,
  Target,
  Dumbbell,
  Activity,
  HelpCircle
} from 'lucide-react';

interface QuickActionsProps {
  onAction: (prompt: string) => void;
}

export default function QuickActions({ onAction }: QuickActionsProps) {
  const actions = [
    {
      icon: TrendingUp,
      label: 'Analyze Last Workout',
      prompt: 'Can you analyze my last workout and give me feedback on my performance?'
    },
    {
      icon: Calendar,
      label: 'Plan Next Session',
      prompt: 'What should I do for my next workout based on my recent training?'
    },
    {
      icon: Target,
      label: 'Check Progress',
      prompt: 'How am I progressing towards my fitness goals?'
    },
    {
      icon: Dumbbell,
      label: 'Exercise Form',
      prompt: 'Can you give me tips on proper form for compound exercises?'
    },
    {
      icon: Activity,
      label: 'Recovery Advice',
      prompt: 'How should I optimize my recovery between workouts?'
    },
    {
      icon: HelpCircle,
      label: 'Training Tips',
      prompt: 'What are some tips to maximize my muscle building progress?'
    }
  ];

  return (
    <div className="mb-6">
      <p className="text-iron-gray text-sm mb-3">Quick Actions:</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => onAction(action.prompt)}
              className="flex items-center gap-2 px-3 py-2 border border-iron-gray hover:border-iron-orange hover:bg-iron-orange/10 transition-colors text-left"
            >
              <Icon className="w-4 h-4 text-iron-orange flex-shrink-0" />
              <span className="text-sm text-iron-white">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}