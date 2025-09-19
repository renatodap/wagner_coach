"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Timer } from "@/components/ui/Timer";
import { Button } from "@/components/ui/Button";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

// Mock workout data - would come from API/params
const mockWorkout = {
  name: "UPPER BODY DESTRUCTION",
  totalExercises: 6,
  exercises: [
    {
      id: 1,
      name: "BENCH PRESS",
      sets: 5,
      reps: "5",
      weight: 100,
      restTime: 180,
      notes: "Control the descent. Explode up. Keep core tight.",
      videoUrl: "/videos/bench-press.mp4"
    },
    {
      id: 2,
      name: "WEIGHTED PULL-UPS",
      sets: 4,
      reps: "8",
      weight: 20,
      restTime: 120,
      notes: "Full range of motion. No kipping.",
      videoUrl: "/videos/pullups.mp4"
    },
    {
      id: 3,
      name: "MILITARY PRESS",
      sets: 4,
      reps: "8",
      weight: 60,
      restTime: 120,
      notes: "Strict form. No leg drive.",
      videoUrl: "/videos/military-press.mp4"
    },
    {
      id: 4,
      name: "BARBELL ROWS",
      sets: 4,
      reps: "10",
      weight: 80,
      restTime: 90,
      notes: "Pull to lower chest. Squeeze at top.",
      videoUrl: "/videos/rows.mp4"
    },
    {
      id: 5,
      name: "DIPS",
      sets: 3,
      reps: "15",
      weight: 10,
      restTime: 90,
      notes: "Lean forward for chest focus.",
      videoUrl: "/videos/dips.mp4"
    },
    {
      id: 6,
      name: "CABLE CURLS",
      sets: 3,
      reps: "12",
      weight: 40,
      restTime: 60,
      notes: "Constant tension. No swinging.",
      videoUrl: "/videos/curls.mp4"
    }
  ]
};

export default function WorkoutPage() {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [workoutStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  const currentExercise = mockWorkout.exercises[currentExerciseIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - workoutStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [workoutStartTime]);

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetComplete = () => {
    const setKey = `${currentExerciseIndex}-${currentSet}`;
    setCompletedSets(prev => new Set(prev).add(setKey));

    if (currentSet < currentExercise.sets) {
      setCurrentSet(currentSet + 1);
      setIsResting(true);
    } else {
      // Move to next exercise
      if (currentExerciseIndex < mockWorkout.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
        setIsResting(true);
      } else {
        // Workout complete
        alert("WORKOUT COMPLETE! BEAST MODE ACTIVATED!");
      }
    }
  };

  const handleRestComplete = () => {
    setIsResting(false);
    if (soundEnabled) {
      // Play sound notification
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setCurrentSet(1);
      setIsResting(false);
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < mockWorkout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      setIsResting(false);
    }
  };

  const progress = ((currentExerciseIndex * currentExercise.sets + currentSet) /
    (mockWorkout.exercises.reduce((acc, ex) => acc + ex.sets, 0))) * 100;

  return (
    <div className="min-h-screen bg-wagner-black">
      {/* Header */}
      <header className="bg-wagner-black border-b-2 border-wagner-gray px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <h1 className="font-heading text-xl text-wagner-orange">
              {mockWorkout.name}
            </h1>
            <div className="flex items-center gap-4">
              <span className="font-mono text-wagner-gray text-sm">
                {formatElapsedTime(elapsedTime)}
              </span>
              <button onClick={() => setSoundEnabled(!soundEnabled)}>
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-wagner-gray" />
                ) : (
                  <VolumeX className="w-5 h-5 text-wagner-gray" />
                )}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-wagner-gray/20 h-2">
            <motion.div
              className="bg-wagner-orange h-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {isResting ? (
          // Rest Timer View
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <h2 className="font-heading text-4xl text-wagner-orange mb-8">
              REST PERIOD
            </h2>
            <Timer
              initialTime={currentExercise.restTime}
              mode="countdown"
              autoStart={true}
              onComplete={handleRestComplete}
            />
            <Button
              variant="ghost"
              size="lg"
              className="mt-8"
              onClick={() => setIsResting(false)}
            >
              SKIP REST
            </Button>
          </motion.div>
        ) : (
          // Exercise View
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Exercise Info */}
            <div className="text-center mb-8">
              <p className="font-mono text-wagner-gray text-sm mb-2">
                EXERCISE {currentExerciseIndex + 1} OF {mockWorkout.totalExercises}
              </p>
              <h2 className="font-heading text-5xl md:text-6xl text-wagner-white mb-4">
                {currentExercise.name}
              </h2>

              {/* Set and Rep Info */}
              <div className="flex justify-center gap-8 mb-4">
                <div>
                  <p className="font-mono text-wagner-gray text-sm">SET</p>
                  <p className="font-heading text-3xl text-wagner-orange">
                    {currentSet}/{currentExercise.sets}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-wagner-gray text-sm">REPS</p>
                  <p className="font-heading text-3xl text-wagner-white">
                    {currentExercise.reps}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-wagner-gray text-sm">WEIGHT</p>
                  <p className="font-heading text-3xl text-wagner-white">
                    {currentExercise.weight}kg
                  </p>
                </div>
              </div>

              {/* Notes */}
              {currentExercise.notes && (
                <div className="bg-wagner-black border-2 border-wagner-gray p-4 max-w-md mx-auto">
                  <p className="text-wagner-gray text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-wagner-orange flex-shrink-0 mt-0.5" />
                    {currentExercise.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Video Demo Area */}
            <div className="bg-wagner-gray/20 h-64 md:h-96 mb-8 flex items-center justify-center border-2 border-wagner-gray">
              <div className="text-center">
                <Play className="w-12 h-12 text-wagner-gray mx-auto mb-2" />
                <p className="text-wagner-gray">VIDEO DEMO</p>
              </div>
            </div>

            {/* Set Tracking */}
            <div className="mb-8">
              <p className="font-mono text-wagner-gray text-sm mb-3 text-center">
                SET HISTORY
              </p>
              <div className="flex justify-center gap-2">
                {Array.from({ length: currentExercise.sets }, (_, i) => {
                  const setNum = i + 1;
                  const isCompleted = completedSets.has(`${currentExerciseIndex}-${setNum}`);
                  const isCurrent = setNum === currentSet;

                  return (
                    <div
                      key={i}
                      className={cn(
                        "w-12 h-12 border-2 flex items-center justify-center font-mono",
                        isCompleted && "bg-wagner-steel border-wagner-steel",
                        isCurrent && !isCompleted && "border-wagner-orange text-wagner-orange",
                        !isCompleted && !isCurrent && "border-wagner-gray/30 text-wagner-gray"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-wagner-white" />
                      ) : (
                        setNum
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePreviousExercise}
                disabled={currentExerciseIndex === 0}
              >
                <ChevronLeft className="w-5 h-5" />
                PREVIOUS
              </Button>

              <Button
                variant="brutal"
                size="xl"
                onClick={handleSetComplete}
                className="px-12"
              >
                SET COMPLETE
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={handleNextExercise}
                disabled={currentExerciseIndex === mockWorkout.exercises.length - 1}
              >
                NEXT
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

// Helper function - should be imported from utils
function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}