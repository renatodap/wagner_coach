"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'brutal' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'brutal', size = 'md', loading = false, children, ...props }, ref) => {
    const variants = {
      brutal: 'bg-wagner-orange text-wagner-white hover:bg-orange-600 border-2 border-wagner-orange',
      outline: 'bg-transparent text-wagner-white border-2 border-wagner-gray hover:border-wagner-orange',
      ghost: 'bg-transparent text-wagner-gray hover:text-wagner-white hover:bg-wagner-gray/20',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
      xl: 'px-12 py-6 text-2xl',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "font-heading uppercase tracking-widest transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-wagner-orange focus:ring-offset-2 focus:ring-offset-wagner-black",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "relative overflow-hidden",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 bg-wagner-black/50 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-wagner-orange border-t-transparent animate-spin" />
          </div>
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export { Button };