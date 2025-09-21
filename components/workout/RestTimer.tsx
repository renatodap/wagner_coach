'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, SkipForward, Plus, Minus } from 'lucide-react';

interface RestTimerProps {
  defaultSeconds?: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

export default function RestTimer({
  defaultSeconds = 90,
  onComplete,
  autoStart = false
}: RestTimerProps) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [currentSeconds, setCurrentSeconds] = useState(defaultSeconds);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for timer complete sound
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZURE');
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && currentSeconds > 0) {
      interval = setInterval(() => {
        setCurrentSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // Play sound
            audioRef.current?.play().catch(() => {
              // Handle autoplay policy
              console.log('Sound blocked by browser');
            });
            onComplete?.();
            return defaultSeconds;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, currentSeconds, defaultSeconds, onComplete]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const adjustTime = (adjustment: number) => {
    const newTime = Math.max(10, Math.min(300, seconds + adjustment));
    setSeconds(newTime);
    if (!isRunning) {
      setCurrentSeconds(newTime);
    }
  };

  const skipTimer = () => {
    setIsRunning(false);
    setCurrentSeconds(seconds);
    onComplete?.();
  };

  const toggleTimer = () => {
    if (!isRunning && currentSeconds === 0) {
      setCurrentSeconds(seconds);
    }
    setIsRunning(!isRunning);
  };

  const progressPercentage = ((seconds - currentSeconds) / seconds) * 100;

  return (
    <div className="bg-iron-black border-2 border-iron-orange p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-iron-orange" />
          <span className="text-iron-gray text-sm uppercase">Rest Timer</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustTime(-15)}
            className="p-1 text-iron-gray hover:text-iron-orange"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-iron-gray text-xs">
            {formatTime(seconds)}
          </span>
          <button
            onClick={() => adjustTime(15)}
            className="p-1 text-iron-gray hover:text-iron-orange"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <div className="text-center">
          <div className="font-mono text-5xl text-iron-white font-bold">
            {formatTime(currentSeconds)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-iron-gray/30">
          <div
            className="h-full bg-iron-orange transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={toggleTimer}
          className="flex items-center justify-center gap-2 py-3 bg-iron-orange text-iron-black font-heading uppercase tracking-wider hover:bg-orange-600 transition-colors"
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              {currentSeconds === seconds ? 'Start' : 'Resume'}
            </>
          )}
        </button>

        <button
          onClick={skipTimer}
          className="flex items-center justify-center gap-2 py-3 border-2 border-iron-gray text-iron-gray hover:border-iron-orange hover:text-iron-orange transition-colors font-heading uppercase tracking-wider"
        >
          <SkipForward className="w-5 h-5" />
          Skip
        </button>
      </div>

      {isRunning && currentSeconds <= 10 && (
        <div className="mt-4 text-center">
          <p className="text-iron-orange font-heading text-xl animate-pulse">
            GET READY!
          </p>
        </div>
      )}
    </div>
  );
}