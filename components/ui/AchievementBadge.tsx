"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AchievementBadgeProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked?: boolean;
  date?: string;
  className?: string;
}

export function AchievementBadge({
  title,
  description,
  icon,
  tier = 'bronze',
  unlocked = false,
  date,
  className
}: AchievementBadgeProps) {
  const tierColors = {
    bronze: 'border-orange-700 bg-orange-900/20',
    silver: 'border-gray-400 bg-gray-600/20',
    gold: 'border-wagner-gold bg-wagner-gold/20',
    platinum: 'border-purple-400 bg-purple-900/20',
  };

  const tierTextColors = {
    bronze: 'text-orange-600',
    silver: 'text-gray-300',
    gold: 'text-wagner-gold',
    platinum: 'text-purple-300',
  };

  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -180 }}
      animate={{ opacity: 1, rotateY: unlocked ? 0 : 0 }}
      transition={{ duration: 0.6 }}
      className={cn(
        "relative border-2 p-4",
        unlocked ? tierColors[tier] : "border-wagner-gray/30 bg-wagner-black/50",
        !unlocked && "grayscale opacity-50",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-12 h-12 flex items-center justify-center",
          "border-2",
          unlocked ? `border-current ${tierTextColors[tier]}` : "border-wagner-gray text-wagner-gray"
        )}>
          {icon || (
            <span className="font-heading text-2xl">
              {tier === 'platinum' ? '★' : tier === 'gold' ? '◆' : tier === 'silver' ? '●' : '■'}
            </span>
          )}
        </div>

        <div className="flex-1">
          <h4 className={cn(
            "font-heading text-lg uppercase tracking-wider",
            unlocked ? "text-wagner-white" : "text-wagner-gray"
          )}>
            {title}
          </h4>
          {description && (
            <p className="text-wagner-gray text-sm mt-1">
              {description}
            </p>
          )}
          {unlocked && date && (
            <p className="font-mono text-xs text-wagner-gray mt-2">
              UNLOCKED: {date}
            </p>
          )}
        </div>
      </div>

      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-heading text-4xl text-wagner-gray/20 rotate-12">
            LOCKED
          </span>
        </div>
      )}
    </motion.div>
  );
}