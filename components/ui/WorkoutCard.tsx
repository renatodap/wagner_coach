"use client";

import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { motion } from "framer-motion";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight?: number;
}

interface WorkoutCardProps {
  title: string;
  duration: string;
  exercises: Exercise[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'BRUTAL';
  onStart: () => void;
  className?: string;
}

export function WorkoutCard({
  title,
  duration,
  exercises,
  difficulty,
  onStart,
  className
}: WorkoutCardProps) {
  const difficultyColors = {
    EASY: 'text-wagner-steel',
    MEDIUM: 'text-wagner-gray',
    HARD: 'text-wagner-orange',
    BRUTAL: 'text-wagner-red',
  };

  const difficultyBorders = {
    EASY: 'border-wagner-steel',
    MEDIUM: 'border-wagner-gray',
    HARD: 'border-wagner-orange',
    BRUTAL: 'border-wagner-red',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-wagner-black border-2 p-6",
        difficultyBorders[difficulty],
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-heading text-2xl text-white uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center gap-4 mt-2">
            <span className="font-mono text-wagner-gray text-sm">
              {duration}
            </span>
            <span className={cn(
              "font-mono text-sm uppercase tracking-widest",
              difficultyColors[difficulty]
            )}>
              {difficulty}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {exercises.slice(0, 3).map((exercise, index) => (
          <div key={index} className="flex justify-between items-center py-2 border-b border-wagner-gray/30">
            <span className="text-wagner-white text-sm">
              {exercise.name}
            </span>
            <span className="font-mono text-wagner-gray text-sm">
              {exercise.sets}x{exercise.reps}
              {exercise.weight && ` @ ${exercise.weight}kg`}
            </span>
          </div>
        ))}
        {exercises.length > 3 && (
          <p className="text-wagner-gray text-sm">
            +{exercises.length - 3} more exercises
          </p>
        )}
      </div>

      <Button
        variant="brutal"
        size="lg"
        className="w-full"
        onClick={onStart}
      >
        START WORKOUT
      </Button>
    </motion.div>
  );
}