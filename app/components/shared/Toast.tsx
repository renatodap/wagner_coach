'use client'

/**
 * Simple Toast Notification Component
 *
 * Displays temporary notifications for success/error feedback
 */

import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const Icon = type === 'success' ? CheckCircle : XCircle
  const bgColor = type === 'success' ? 'bg-green-900/90' : 'bg-red-900/90'
  const borderColor = type === 'success' ? 'border-green-700' : 'border-red-700'
  const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500'

  return (
    <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top-2 duration-300">
      <div className={`${bgColor} ${borderColor} border backdrop-blur-xl px-4 py-3 pr-10 rounded shadow-lg max-w-md`}>
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
          <p className="text-sm text-iron-white">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4 text-iron-gray" />
        </button>
      </div>
    </div>
  )
}
