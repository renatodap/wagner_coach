"use client";

import { motion } from "framer-motion";
import { TrendingUp, Trophy, Award } from "lucide-react";

interface StatsGridProps {
  weeklyVolume: string;
  volumeChange: string;
  personalBest: {
    exercise: string;
    weight: string;
    isNew: boolean;
  };
  rank: number;
  percentile: string;
}

export function StatsGrid({
  weeklyVolume,
  volumeChange,
  personalBest,
  rank,
  percentile
}: StatsGridProps) {
  const stats = [
    {
      label: "THIS WEEK",
      value: weeklyVolume,
      subtitle: "LIFTED",
      change: volumeChange,
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      label: "PERSONAL BEST",
      value: personalBest.weight,
      subtitle: personalBest.exercise,
      badge: personalBest.isNew ? "New PR!" : null,
      icon: <Trophy className="w-4 h-4" />
    },
    {
      label: "RANK",
      value: `#${rank}`,
      subtitle: "ELITE",
      badge: percentile,
      icon: <Award className="w-4 h-4" />
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-2 mb-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
          className="bg-wagner-black border border-wagner-gray p-3"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-wagner-gray text-[10px] uppercase tracking-wider">
              {stat.label}
            </p>
            <div className="text-wagner-orange">
              {stat.icon}
            </div>
          </div>

          <p className="font-mono text-wagner-white text-lg font-bold">
            {stat.value}
          </p>

          <p className="text-wagner-gray text-[10px] uppercase">
            {stat.subtitle}
          </p>

          {stat.change && (
            <p className="text-wagner-orange text-xs mt-1">
              {stat.change} ↑
            </p>
          )}

          {stat.badge && (
            <p className="text-wagner-orange text-xs mt-1 font-bold">
              {stat.badge}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}