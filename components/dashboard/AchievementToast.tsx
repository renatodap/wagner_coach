"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

interface AchievementData {
  name: string;
  description: string;
  points: number;
}

interface AchievementToastProps {
  achievement: AchievementData;
}

export function AchievementToast({ achievement }: AchievementToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: 0.5
      }}
      className="bg-wagner-gold/20 border-2 border-wagner-gold p-4 mb-6"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-wagner-gold text-wagner-black">
          <Trophy className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <p className="text-wagner-gold text-xs uppercase tracking-wider mb-1">
            Achievement Unlocked
          </p>
          <h4 className="font-heading text-wagner-white text-lg uppercase tracking-wider">
            {achievement.name}
          </h4>
          <p className="text-wagner-gray text-sm">
            {achievement.description}
          </p>
          <p className="text-wagner-gold text-sm mt-1 font-bold">
            +{achievement.points} Points | Rank Up!
          </p>
        </div>
      </div>
    </motion.div>
  );
}