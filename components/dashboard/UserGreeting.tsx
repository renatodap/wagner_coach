"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { getGreeting } from "@/lib/utils";

interface UserGreetingProps {
  name: string;
  streak: number;
}

export function UserGreeting({ name, streak }: UserGreetingProps) {
  const greeting = getGreeting();
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6"
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-wagner-gray text-sm font-mono">
          {currentTime}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-wagner-white font-mono">
            STREAK: {streak}
          </span>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Flame className="w-5 h-5 text-wagner-orange" />
          </motion.div>
        </div>
      </div>

      <h1 className="font-heading text-3xl text-wagner-white uppercase tracking-wider">
        {greeting}, {name}
      </h1>

      <p className="text-wagner-orange font-heading text-xl mt-2">
        TODAY&apos;S MISSION
      </p>
    </motion.div>
  );
}