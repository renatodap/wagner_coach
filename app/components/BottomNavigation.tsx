'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  User
} from 'lucide-react'

/**
 * Bottom Navigation - MVP Version
 *
 * Minimal viable product with 2 essential tabs:
 * - Coach: AI chat interface (can log meals/workouts, provide advice)
 * - Profile: User settings and program preferences
 *
 * Coming soon features (accessible via Coach for now):
 * - Dashboard with adaptive cards
 * - Meal history UI
 * - Workout log UI
 * - Consultation booking
 * - Program builder UI
 */
export default function BottomNavigation() {
  const pathname = usePathname()

  const navigation = [
    {
      name: 'Coach',
      href: '/coach-v3',
      icon: MessageSquare,
      current: pathname === '/coach-v3' || pathname === '/coach-v2' || pathname === '/coach' || pathname === '/quick-entry' || pathname === '/quick-entry-optimized',
      ariaLabel: 'Chat with your AI coach'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      current: pathname === '/profile' || pathname.startsWith('/profile/'),
      ariaLabel: 'View profile and settings'
    }
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-iron-black border-t border-iron-gray z-40"
      aria-label="Main navigation"
    >
      <div className="max-w-4xl mx-auto px-2">
        <div className="grid grid-cols-2 py-2">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2 transition-colors min-h-[44px] ${
                  item.current
                    ? 'text-iron-orange'
                    : 'text-iron-gray hover:text-iron-orange'
                }`}
                aria-label={item.ariaLabel}
                aria-current={item.current ? 'page' : undefined}
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
                <span className="text-[10px] uppercase font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}