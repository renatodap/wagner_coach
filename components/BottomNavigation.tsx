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
 * Bottom Navigation - Adaptive Dashboard Phase 2
 *
 * Simplified to 4 essential tabs:
 * - Dashboard: Personalized home with adaptive cards
 * - Plan: 14-day program view (placeholder for now)
 * - Coach: AI chat interface
 * - Profile: User settings + links to all other pages (meals, activities, analytics, etc.)
 *
 * Removed tabs:
 * - Meals → Accessible from Profile or Quick Actions on Dashboard
 * - Recovery → Accessible from Profile
 * - Quick Entry → Accessible from Quick Actions card on Dashboard
 */
export default function BottomNavigation() {
  const pathname = usePathname()

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: pathname === '/dashboard',
      ariaLabel: 'Go to Dashboard'
    },
    {
      name: 'Plan',
      href: '/plan',
      icon: Calendar,
      current: pathname === '/plan' || pathname.startsWith('/plan/'),
      ariaLabel: 'View your 14-day program plan'
    },
    {
      name: 'Coach',
      href: '/coach-v2',
      icon: MessageSquare,
      current: pathname === '/coach-v2' || pathname === '/coach' || pathname === '/quick-entry' || pathname === '/quick-entry-optimized',
      ariaLabel: 'Chat with your AI coach'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      current: pathname === '/profile' || pathname.startsWith('/profile/') || pathname === '/nutrition' || pathname.startsWith('/nutrition/') || pathname === '/activities' || pathname.startsWith('/activities/') || pathname === '/recovery' || pathname.startsWith('/recovery/') || pathname === '/analytics' || pathname.startsWith('/analytics/'),
      ariaLabel: 'View profile and settings'
    }
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-iron-black border-t border-iron-gray z-40"
      aria-label="Main navigation"
    >
      <div className="max-w-4xl mx-auto px-2">
        <div className="grid grid-cols-4 py-2">
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