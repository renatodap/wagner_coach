"use client";

import { motion } from "framer-motion";
import { Volume2, Play } from "lucide-react";
import Image from "next/image";

interface MessageData {
  text: string;
  duration: string;
  timestamp: string;
}

interface WagnerMessageProps {
  message: MessageData;
}

export function WagnerMessage({ message }: WagnerMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="bg-wagner-black border border-wagner-gray p-4 mb-20"
    >
      <div className="flex gap-3">
        <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden border border-wagner-orange">
          <div className="w-full h-full bg-wagner-gray/20 flex items-center justify-center">
            <span className="text-wagner-gray text-xs">W</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-heading text-wagner-orange text-sm uppercase tracking-wider">
                Wagner Says
              </p>
              <p className="text-wagner-gray text-xs">
                {message.timestamp}
              </p>
            </div>
          </div>

          <p className="text-wagner-white text-sm leading-relaxed mb-3">
            &quot;{message.text}&quot;
          </p>

          <button className="flex items-center gap-2 bg-wagner-gray/20 px-3 py-1 text-wagner-gray text-sm hover:bg-wagner-gray/30 transition-colors">
            <Play className="w-3 h-3" />
            <Volume2 className="w-4 h-4" />
            <span className="font-mono">{message.duration}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}