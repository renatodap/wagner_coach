<<<<<<< HEAD
import * as React from "react"
import { cn } from "@/lib/utils"
=======
import * as React from 'react';

import { cn } from '@/lib/utils';
>>>>>>> feature/profile-goals-tdd

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
<<<<<<< HEAD
      "rounded-lg border bg-card text-card-foreground shadow-sm",
=======
      'rounded-lg border bg-card text-card-foreground shadow-sm',
>>>>>>> feature/profile-goals-tdd
      className
    )}
    {...props}
  />
<<<<<<< HEAD
))
Card.displayName = "Card"
=======
));
Card.displayName = 'Card';
>>>>>>> feature/profile-goals-tdd

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
<<<<<<< HEAD
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"
=======
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';
>>>>>>> feature/profile-goals-tdd

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
<<<<<<< HEAD
      "text-2xl font-semibold leading-none tracking-tight",
=======
      'text-2xl font-semibold leading-none tracking-tight',
>>>>>>> feature/profile-goals-tdd
      className
    )}
    {...props}
  />
<<<<<<< HEAD
))
CardTitle.displayName = "CardTitle"
=======
));
CardTitle.displayName = 'CardTitle';
>>>>>>> feature/profile-goals-tdd

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
<<<<<<< HEAD
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"
=======
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';
>>>>>>> feature/profile-goals-tdd

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
<<<<<<< HEAD
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"
=======
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';
>>>>>>> feature/profile-goals-tdd

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
<<<<<<< HEAD
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
=======
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
>>>>>>> feature/profile-goals-tdd
