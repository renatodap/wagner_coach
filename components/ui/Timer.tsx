"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface TimerProps {
  initialTime?: number;
  mode?: 'countdown' | 'stopwatch';
  autoStart?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function Timer({
  initialTime = 60,
  mode = 'countdown',
  autoStart = false,
  onComplete,
  className
}: TimerProps) {
  const [time, setTime] = useState(mode === 'countdown' ? initialTime : 0);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (mode === 'countdown') {
            if (prevTime <= 1) {
              setIsRunning(false);
              onComplete?.();
              return 0;
            }
            return prevTime - 1;
          } else {
            return prevTime + 1;
          }
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, mode, onComplete]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleReset = () => {
    setIsRunning(false);
    setTime(mode === 'countdown' ? initialTime : 0);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div className={cn("text-center", className)}>
      <div className="relative">
        <div className="text-8xl md:text-9xl font-mono text-wagner-white font-bold tabular-nums">
          {formatTime(time)}
        </div>
        {mode === 'countdown' && time <= 10 && time > 0 && (
          <div className="absolute inset-0 animate-pulse-brutal pointer-events-none">
            <div className="text-8xl md:text-9xl font-mono text-wagner-red/30 font-bold tabular-nums">
              {formatTime(time)}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 justify-center mt-8">
        <Button
          variant={isRunning ? "outline" : "brutal"}
          size="lg"
          onClick={toggleTimer}
        >
          {isRunning ? "PAUSE" : "START"}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={handleReset}
        >
          RESET
        </Button>
      </div>
    </div>
  );
}