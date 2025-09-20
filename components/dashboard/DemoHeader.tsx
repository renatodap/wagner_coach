"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export function DemoHeader() {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-wagner-black/90 backdrop-blur-sm border-b border-wagner-gray/30"
    >
      <div className="flex justify-between items-center px-4 py-2">
        <span className="text-wagner-gray text-xs uppercase tracking-wider">
          Demo Mode - Preview
        </span>
        <a
          href="#pricing"
          className="flex items-center gap-1 text-wagner-orange text-sm font-heading uppercase tracking-wider"
        >
          Join Now
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );
}