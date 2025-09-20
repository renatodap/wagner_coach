"use client";

import { Home, Activity, TrendingUp, User } from "lucide-react";

export function BottomNav() {
  const navItems = [
    { icon: <Home className="w-5 h-5" />, label: "Home", active: true },
    { icon: <Activity className="w-5 h-5" />, label: "Workout", active: false },
    { icon: <TrendingUp className="w-5 h-5" />, label: "Progress", active: false },
    { icon: <User className="w-5 h-5" />, label: "Profile", active: false }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-wagner-black border-t-2 border-wagner-gray z-40">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              item.active ? "text-wagner-orange" : "text-wagner-gray"
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-mono uppercase">{item.label}</span>
            {item.active && (
              <div className="absolute bottom-0 w-12 h-0.5 bg-wagner-orange" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}