export const demoUser = {
  name: "MARCUS",
  streak: 17,
  weeklyVolume: "1,247 KG",
  volumeChange: "+15%",
  personalBest: {
    exercise: "DEADLIFT",
    weight: "425 LBS",
    isNew: true
  },
  rank: 12,
  percentile: "Top 10%",
  todaysWorkout: {
    name: "CHEST & TRICEPS ANNIHILATION",
    duration: 45,
    exerciseCount: 8,
    intensity: "BRUTAL" as const,
    exercises: [
      "Barbell Bench Press - 4×8",
      "Incline Dumbbell Press - 3×12",
      "Cable Flyes - 3×15",
      "Weighted Dips - 3×10",
      "Close-Grip Bench - 3×12",
      "Overhead Tricep Extension - 3×15",
      "Diamond Pushups - 3×FAILURE",
      "Tricep Finisher - 100 reps"
    ]
  },
  nextWorkout: "Back & Biceps in 2 days",
  challenge: {
    name: "7-DAY DESTROYER",
    currentDay: 4,
    totalDays: 7,
    progress: 57,
    membersAhead: 3
  },
  recentAchievement: {
    name: "IRON WILL",
    description: "7 Day Streak",
    points: 50
  },
  wagnerMessage: {
    text: "Marcus, your deadlift form yesterday was solid but you're leaving 20lbs on the table. Next session, we attack your weak point - the lockout. I'm sending you a specific drill. No excuses.",
    duration: "0:47",
    timestamp: "2 hours ago"
  }
};