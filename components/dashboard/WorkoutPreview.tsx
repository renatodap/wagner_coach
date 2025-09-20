"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "../ui/Button";

interface WorkoutPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: string[];
  workoutName: string;
}

export function WorkoutPreview({
  isOpen,
  onClose,
  exercises,
  workoutName
}: WorkoutPreviewProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-wagner-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed bottom-0 left-0 right-0 bg-wagner-black border-t-2 border-wagner-orange z-50 max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-heading text-wagner-orange text-2xl uppercase tracking-wider">
                    {workoutName}
                  </h3>
                  <p className="text-wagner-gray text-sm mt-1">
                    This is a demo preview
                  </p>
                </div>
                <button onClick={onClose} className="text-wagner-gray">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                {exercises.map((exercise, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-l-2 border-wagner-orange pl-4 py-2"
                  >
                    <p className="text-wagner-white">
                      {index + 1}. {exercise}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="bg-wagner-orange/10 border border-wagner-orange p-4 mb-6">
                <p className="text-wagner-orange font-heading text-sm uppercase tracking-wider mb-2">
                  Demo Mode
                </p>
                <p className="text-wagner-white text-sm">
                  Join Iron Discipline to start this workout and track your progress.
                  Get personalized coaching from Wagner.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="brutal" className="flex-1">
                  JOIN NOW TO START
                </Button>
                <Button variant="outline" onClick={onClose}>
                  CLOSE
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}