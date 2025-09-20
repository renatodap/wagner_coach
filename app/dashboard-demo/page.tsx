"use client";

import { useState } from "react";
import { demoUser } from "@/lib/demo-data";
import { DemoHeader } from "@/components/dashboard/DemoHeader";
import { UserGreeting } from "@/components/dashboard/UserGreeting";
import { DemoWorkoutCard } from "@/components/dashboard/DemoWorkoutCard";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { ChallengeCard } from "@/components/dashboard/ChallengeCard";
import { AchievementToast } from "@/components/dashboard/AchievementToast";
import { WagnerMessage } from "@/components/dashboard/WagnerMessage";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { WorkoutPreview } from "@/components/dashboard/WorkoutPreview";

export default function DashboardDemo() {
  const [showWorkoutPreview, setShowWorkoutPreview] = useState(false);

  return (
    <div className="min-h-screen bg-wagner-black pt-10">
      <DemoHeader />

      <main className="px-4 pt-8 pb-20 max-w-md mx-auto">
        <UserGreeting
          name={demoUser.name}
          streak={demoUser.streak}
        />

        <DemoWorkoutCard
          workout={demoUser.todaysWorkout}
          nextWorkout={demoUser.nextWorkout}
          onStart={() => setShowWorkoutPreview(true)}
        />

        <StatsGrid
          weeklyVolume={demoUser.weeklyVolume}
          volumeChange={demoUser.volumeChange}
          personalBest={demoUser.personalBest}
          rank={demoUser.rank}
          percentile={demoUser.percentile}
        />

        <ChallengeCard challenge={demoUser.challenge} />

        <AchievementToast achievement={demoUser.recentAchievement} />

        <WagnerMessage message={demoUser.wagnerMessage} />
      </main>

      <BottomNav />

      <WorkoutPreview
        isOpen={showWorkoutPreview}
        onClose={() => setShowWorkoutPreview(false)}
        exercises={demoUser.todaysWorkout.exercises}
        workoutName={demoUser.todaysWorkout.name}
      />
    </div>
  );
}