"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

export function MetricCard({ label, value, unit, trend, className }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-wagner-black border-2 border-wagner-gray p-6",
        "hover:border-wagner-orange transition-colors duration-200",
        className
      )}
    >
      <p className="font-mono text-wagner-gray text-sm uppercase tracking-widest">
        {label}
      </p>
      <div className="flex items-baseline gap-2 mt-2">
        <p className="font-heading text-4xl text-white">
          {value}
        </p>
        {unit && (
          <span className="font-mono text-wagner-gray text-lg">
            {unit}
          </span>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <span className={cn(
            "text-sm font-mono",
            trend.isPositive ? "text-wagner-orange" : "text-wagner-red"
          )}>
            {trend.isPositive ? "+" : ""}{trend.value}%
          </span>
          <span className="text-wagner-gray text-xs">
            vs last week
          </span>
        </div>
      )}
    </motion.div>
  );
}