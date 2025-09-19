import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatWeight(kg: number, unit: 'kg' | 'lbs' = 'kg'): string {
  if (unit === 'lbs') {
    return `${Math.round(kg * 2.20462)} lbs`;
  }
  return `${kg} kg`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 5) return "RISE AND GRIND";
  if (hour < 12) return "DESTROY YOUR LIMITS";
  if (hour < 17) return "CONQUER THE AFTERNOON";
  if (hour < 22) return "FINISH STRONG";
  return "MIDNIGHT WARRIOR";
}