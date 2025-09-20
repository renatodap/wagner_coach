"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

interface WorkoutData {
  name: string;
  duration: number;
  exerciseCount: number;
  intensity: string;
  exercises: string[];
}

interface DemoWorkoutCardProps {
  workout: WorkoutData;
  nextWorkout: string;
  onStart: () => void;
}

export function DemoWorkoutCard({ workout, nextWorkout, onStart }: DemoWorkoutCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-wagner-black border-2 border-wagner-orange p-6 relative mb-6"
    >
      <div className="absolute top-2 right-2 text-wagner-gray text-xs uppercase tracking-wider">
        Demo
      </div>

      <h3 className="font-heading text-white text-2xl uppercase tracking-wider mb-2">
        {workout.name}
      </h3>

      <div className="w-full h-[2px] bg-wagner-orange mb-4" />

      <div className="flex justify-between text-wagner-gray mb-6 text-sm">
        <span>{workout.duration} mins</span>
        <span>{workout.exerciseCount} exercises</span>
        <span className="text-wagner-orange font-bold">{workout.intensity}</span>
      </div>

      <motion.button
        className="w-full bg-wagner-orange text-wagner-black font-heading text-xl py-4
                 uppercase tracking-widest transition-all"
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        animate={{ scale: isPressed ? 0.98 : 1 }}
        onClick={onStart}
      >
        START DESTRUCTION
        <ChevronRight className="inline-block w-6 h-6 ml-2" />
      </motion.button>

      <p className="text-wagner-gray text-sm mt-4">
        Next: {nextWorkout}
      </p>
    </motion.div>
  );
}