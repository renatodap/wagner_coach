"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MetricCard } from "@/components/ui/MetricCard";
import { WorkoutCard } from "@/components/ui/WorkoutCard";
import { AchievementBadge } from "@/components/ui/AchievementBadge";
import { Button } from "@/components/ui/Button";
import {
  User,
  Activity,
  Trophy,
  Calendar,
  TrendingUp,
  Dumbbell,
  Flame,
  Target
} from "lucide-react";
import { getGreeting } from "@/lib/utils";

export default function Dashboard() {
  const [userName] = useState("WARRIOR");
  const greeting = getGreeting();

  // Mock data - would come from API/database
  const todaysWorkout = {
    title: "UPPER BODY DESTRUCTION",
    duration: "45 MIN",
    difficulty: "BRUTAL" as const,
    exercises: [
      { name: "Bench Press", sets: 5, reps: "5", weight: 100 },
      { name: "Weighted Pull-ups", sets: 4, reps: "8", weight: 20 },
      { name: "Military Press", sets: 4, reps: "8", weight: 60 },
      { name: "Barbell Rows", sets: 4, reps: "10", weight: 80 },
      { name: "Dips", sets: 3, reps: "15", weight: 10 },
      { name: "Cable Curls", sets: 3, reps: "12", weight: 40 }
    ]
  };

  const metrics = [
    {
      label: "CURRENT STREAK",
      value: 12,
      unit: "DAYS",
      trend: { value: 20, isPositive: true }
    },
    {
      label: "WEIGHT LIFTED",
      value: "1,847",
      unit: "KG",
      trend: { value: 12, isPositive: true }
    },
    {
      label: "SESSIONS",
      value: 28,
      unit: "THIS MONTH",
      trend: { value: 8, isPositive: true }
    }
  ];

  const achievements = [
    {
      title: "IRON WILL",
      description: "30 day streak",
      tier: "gold" as const,
      unlocked: true,
      date: "2024-01-15"
    },
    {
      title: "POWERHOUSE",
      description: "Lift 1000kg in a week",
      tier: "silver" as const,
      unlocked: true,
      date: "2024-01-10"
    },
    {
      title: "UNSTOPPABLE",
      description: "100 workouts completed",
      tier: "platinum" as const,
      unlocked: false
    }
  ];

  const weeklyProgress = [
    { day: "MON", completed: true },
    { day: "TUE", completed: true },
    { day: "WED", completed: false },
    { day: "THU", completed: true },
    { day: "FRI", completed: true },
    { day: "SAT", completed: false },
    { day: "SUN", completed: false }
  ];

  return (
    <div className="min-h-screen bg-wagner-black">
      {/* Header */}
      <header className="bg-wagner-black border-b-2 border-wagner-gray px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-heading text-2xl text-wagner-orange">
              IRON DISCIPLINE
            </h1>
            <p className="text-wagner-gray text-sm mt-1">
              {greeting}, {userName}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's Focus */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h2 className="font-heading text-3xl text-wagner-white mb-6">
            TODAY'S MISSION
          </h2>
          <WorkoutCard
            {...todaysWorkout}
            onStart={() => console.log("Start workout")}
            className="max-w-2xl"
          />
        </motion.section>

        {/* Metrics Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="font-heading text-2xl text-wagner-white mb-4">
            YOUR STATS
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {metrics.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>
        </motion.section>

        {/* Weekly Progress */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="font-heading text-2xl text-wagner-white mb-4">
            WEEKLY PROGRESS
          </h2>
          <div className="bg-wagner-black border-2 border-wagner-gray p-6">
            <div className="grid grid-cols-7 gap-2">
              {weeklyProgress.map((day) => (
                <div key={day.day} className="text-center">
                  <p className="font-mono text-xs text-wagner-gray mb-2">
                    {day.day}
                  </p>
                  <div className={`
                    h-12 w-full border-2 flex items-center justify-center
                    ${day.completed
                      ? 'bg-wagner-orange border-wagner-orange'
                      : 'bg-transparent border-wagner-gray/30'
                    }
                  `}>
                    {day.completed && (
                      <Flame className="w-6 h-6 text-wagner-black" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between items-center">
              <p className="text-wagner-gray text-sm">
                5 of 7 days completed
              </p>
              <p className="font-mono text-wagner-orange">
                71% COMPLETE
              </p>
            </div>
          </div>
        </motion.section>

        {/* Achievements */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="font-heading text-2xl text-wagner-white mb-4">
            ACHIEVEMENTS
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <AchievementBadge key={index} {...achievement} />
            ))}
          </div>
        </motion.section>

        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <h2 className="font-heading text-2xl text-wagner-white mb-4">
            QUICK ACTIONS
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" size="lg" className="flex flex-col gap-2 h-auto py-6">
              <Activity className="w-6 h-6" />
              <span>LOG WORKOUT</span>
            </Button>
            <Button variant="outline" size="lg" className="flex flex-col gap-2 h-auto py-6">
              <TrendingUp className="w-6 h-6" />
              <span>CHECK PROGRESS</span>
            </Button>
            <Button variant="outline" size="lg" className="flex flex-col gap-2 h-auto py-6">
              <Target className="w-6 h-6" />
              <span>SET GOALS</span>
            </Button>
            <Button variant="outline" size="lg" className="flex flex-col gap-2 h-auto py-6">
              <Trophy className="w-6 h-6" />
              <span>LEADERBOARD</span>
            </Button>
          </div>
        </motion.section>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-wagner-black border-t-2 border-wagner-gray">
        <div className="grid grid-cols-4 h-16">
          <button className="flex flex-col items-center justify-center gap-1 text-wagner-orange">
            <Dumbbell className="w-5 h-5" />
            <span className="text-[10px] font-mono">HOME</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 text-wagner-gray">
            <Activity className="w-5 h-5" />
            <span className="text-[10px] font-mono">WORKOUT</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 text-wagner-gray">
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-mono">STATS</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 text-wagner-gray">
            <User className="w-5 h-5" />
            <span className="text-[10px] font-mono">PROFILE</span>
          </button>
        </div>
      </nav>
    </div>
  );
}