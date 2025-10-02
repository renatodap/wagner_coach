'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Activity,
  Apple,
  Dumbbell,
  Calendar,
  TrendingUp,
  Users,
  ArrowRight,
  Clock,
  Target,
  Trophy,
  Sparkles
} from 'lucide-react';
import { Profile } from '@/lib/types';
import BottomNavigation from '@/app/components/BottomNavigation';

interface DashboardClientProps {
  profile?: Profile | null;
  stats: {
    activitiesToday: number;
    mealsToday: number;
    activePrograms: number;
  };
  upcomingWorkouts: any[];
}

export default function DashboardClient({
  profile,
  stats,
  upcomingWorkouts
}: DashboardClientProps) {
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = profile?.full_name?.split(' ')[0] || 'Warrior';

    if (hour < 5) return `Rise and Grind, ${name}`;
    if (hour < 12) return `Morning, ${name}`;
    if (hour < 17) return `Afternoon, ${name}`;
    if (hour < 22) return `Evening, ${name}`;
    return `Night Owl Mode, ${name}`;
  };

  const mainCards = [
    {
      title: 'Workouts',
      description: 'Browse workouts and track your training',
      href: '/workouts',
      icon: Dumbbell,
      color: 'from-orange-500 to-red-600',
      stats: upcomingWorkouts.length > 0 ? `${upcomingWorkouts.length} scheduled` : 'Start training'
    },
    {
      title: 'Programs',
      description: 'Follow Wagner\'s structured training programs',
      href: '/programs',
      icon: Trophy,
      color: 'from-purple-500 to-indigo-600',
      stats: stats.activePrograms > 0 ? `${stats.activePrograms} active` : '172 available'
    },
    {
      title: 'Nutrition',
      description: 'Track meals and monitor your diet',
      href: '/nutrition',
      icon: Apple,
      color: 'from-green-500 to-emerald-600',
      stats: stats.mealsToday > 0 ? `${stats.mealsToday} meals today` : 'Log your meals'
    },
    {
      title: 'Activities',
      description: 'Log and analyze your fitness activities',
      href: '/activities',
      icon: Activity,
      color: 'from-blue-500 to-cyan-600',
      stats: stats.activitiesToday > 0 ? `${stats.activitiesToday} today` : 'Track activities'
    }
  ];

  const quickActions = [
    {
      label: 'Chat with Coach',
      icon: Users,
      action: () => router.push('/coach')
    },
    {
      label: 'Log Workout',
      icon: Dumbbell,
      action: () => router.push('/workouts/log')
    },
    {
      label: 'Log Meal',
      icon: Apple,
      action: () => router.push('/nutrition/log')
    },
    {
      label: 'Sync Activities',
      icon: Activity,
      action: () => router.push('/activities/sync-status')
    },
    {
      label: 'View Progress',
      icon: TrendingUp,
      action: () => router.push('/profile')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900">
      {/* Header */}
      <div className="bg-iron-black/50 backdrop-blur-sm border-b border-iron-gray/20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            {getGreeting()}
          </h1>
          <p className="text-iron-gray">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        {/* AI COACH - PRIMARY FEATURE */}
        <div className="mt-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-iron-orange" />
            AI Coach
          </h2>
          <button
            onClick={() => router.push('/coach')}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-iron-orange/20 to-orange-500/10 border-2 border-iron-orange/50 hover:border-iron-orange p-6 text-left transition-all duration-300 hover:scale-[1.02] w-full"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-iron-orange/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-iron-orange" />
              </div>
              <ArrowRight className="w-5 h-5 text-iron-orange group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Chat with AI Coach</h3>
            <p className="text-orange-200 text-sm mb-3">Get personalized fitness and nutrition guidance, workout advice, and meal planning support</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-iron-orange/20 rounded-full">
              <div className="w-2 h-2 rounded-full bg-iron-orange animate-pulse" />
              <span className="text-xs text-orange-300 font-semibold">Available Now</span>
            </div>
          </button>
        </div>

        {/* CREATE PROGRAM - PROMINENT CTA */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/programs/create')}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/10 border-2 border-purple-500/50 hover:border-purple-500 p-6 text-left transition-all duration-300 hover:scale-[1.02] w-full"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Create AI-Generated Program</h3>
            <p className="text-purple-200 text-sm mb-3">Generate a personalized {stats.activePrograms === 0 ? 'training and nutrition program' : 'new program'} tailored to your specific goals and preferences</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-purple-300 font-semibold">AI-Powered</span>
            </div>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => router.push('/workouts/log')}
              className="flex flex-col items-center gap-2 p-4 bg-iron-gray/20 border border-iron-gray/30 rounded-lg hover:bg-iron-gray/30 hover:border-iron-orange/50 transition-all"
            >
              <Dumbbell className="w-6 h-6 text-iron-orange" />
              <span className="text-xs text-white text-center">Log Workout</span>
            </button>
            <button
              onClick={() => router.push('/nutrition/log')}
              className="flex flex-col items-center gap-2 p-4 bg-iron-gray/20 border border-iron-gray/30 rounded-lg hover:bg-iron-gray/30 hover:border-iron-orange/50 transition-all"
            >
              <Apple className="w-6 h-6 text-iron-orange" />
              <span className="text-xs text-white text-center">Log Meal</span>
            </button>
            <button
              onClick={() => router.push('/activities/sync-status')}
              className="flex flex-col items-center gap-2 p-4 bg-iron-gray/20 border border-iron-gray/30 rounded-lg hover:bg-iron-gray/30 hover:border-iron-orange/50 transition-all"
            >
              <Activity className="w-6 h-6 text-iron-orange" />
              <span className="text-xs text-white text-center">Sync Activities</span>
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="flex flex-col items-center gap-2 p-4 bg-iron-gray/20 border border-iron-gray/30 rounded-lg hover:bg-iron-gray/30 hover:border-iron-orange/50 transition-all"
            >
              <TrendingUp className="w-6 h-6 text-iron-orange" />
              <span className="text-xs text-white text-center">View Progress</span>
            </button>
          </div>
        </div>

        {/* Main Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {mainCards.map((card, index) => (
            <Link
              key={index}
              href={card.href}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-iron-gray/20 to-iron-gray/10 border border-iron-gray/30 hover:border-iron-orange/50 transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity`} />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <card.icon className="w-8 h-8 text-iron-orange" />
                  <ArrowRight className="w-5 h-5 text-iron-gray group-hover:text-iron-orange transition-colors" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">
                  {card.title}
                </h3>

                <p className="text-iron-gray text-sm mb-3">
                  {card.description}
                </p>

                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-iron-orange animate-pulse" />
                  <span className="text-xs text-iron-orange font-semibold">
                    {card.stats}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Upcoming Workouts */}
        {upcomingWorkouts.length > 0 && (
          <div className="bg-iron-gray/20 border border-iron-gray/30 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Upcoming Workouts</h2>
              <Link href="/workouts" className="text-sm text-iron-orange hover:text-orange-400">
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingWorkouts.map((workout, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-iron-black/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-iron-gray" />
                    <div>
                      <p className="text-white font-medium">
                        {workout.workouts?.name || 'Workout'}
                      </p>
                      <p className="text-xs text-iron-gray">
                        {new Date(workout.scheduled_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/workout/${workout.workout_id}`}
                    className="text-sm text-iron-orange hover:text-orange-400"
                  >
                    Start
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-iron-gray/20 border border-iron-gray/30 rounded-lg p-4 text-center">
            <Clock className="w-6 h-6 text-iron-orange mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.activitiesToday}</p>
            <p className="text-xs text-iron-gray">Activities Today</p>
          </div>

          <div className="bg-iron-gray/20 border border-iron-gray/30 rounded-lg p-4 text-center">
            <Target className="w-6 h-6 text-iron-orange mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.mealsToday}</p>
            <p className="text-xs text-iron-gray">Meals Logged</p>
          </div>

          <div className="bg-iron-gray/20 border border-iron-gray/30 rounded-lg p-4 text-center">
            <Trophy className="w-6 h-6 text-iron-orange mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.activePrograms}</p>
            <p className="text-xs text-iron-gray">Active Programs</p>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}