"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";

interface ChallengeData {
  name: string;
  currentDay: number;
  totalDays: number;
  progress: number;
  membersAhead: number;
}

interface ChallengeCardProps {
  challenge: ChallengeData;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-wagner-black border border-wagner-gray p-4 mb-6"
    >
      <h4 className="font-heading text-wagner-orange text-lg uppercase tracking-wider mb-2">
        {challenge.name} CHALLENGE
      </h4>

      <p className="text-wagner-white text-sm mb-3">
        Day {challenge.currentDay} of {challenge.totalDays} - Stay Strong
      </p>

      <div className="relative h-3 bg-wagner-gray/20 mb-3">
        <motion.div
          className="absolute top-0 left-0 h-full bg-wagner-orange"
          initial={{ width: 0 }}
          animate={{ width: `${challenge.progress}%` }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-wagner-white font-mono">
          {challenge.progress}% COMPLETE
        </span>
      </div>

      <div className="flex items-center gap-2 text-wagner-gray text-sm">
        <Users className="w-4 h-4" />
        <span>{challenge.membersAhead} members ahead of you</span>
      </div>
    </motion.div>
  );
}