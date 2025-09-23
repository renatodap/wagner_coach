'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  MessageSquare,
  User,
  Apple,
  Sparkles
} from 'lucide-react'

export default function BottomNavigation() {
  const pathname = usePathname()

  const navigation = [
    {
      name: 'Activities',
      href: '/activities',
      icon: Activity,
      current: pathname === '/activities'
    },
    {
      name: 'Nutrition',
      href: '/nutrition',
      icon: Apple,
      current: pathname === '/nutrition' || pathname.startsWith('/nutrition/')
    },
    {
      name: 'Quick',
      href: '/quick-entry',
      icon: Sparkles,
      current: pathname === '/quick-entry'
    },
    {
      name: 'Coach',
      href: '/coach',
      icon: MessageSquare,
      current: pathname === '/coach'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      current: pathname === '/profile' || pathname.startsWith('/profile/')
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-iron-black border-t border-iron-gray z-40">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-5 py-2">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2 transition-colors ${
                  item.current
                    ? 'text-iron-orange'
                    : 'text-iron-gray hover:text-iron-orange'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] uppercase">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}