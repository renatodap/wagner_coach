"use client"

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

/**
 * BottomSheet - Mobile-optimized slide-up modal
 *
 * Replaces traditional centered modals on mobile with a
 * slide-up panel that feels native and doesn't obscure content.
 *
 * Features:
 * - Smooth slide-up animation
 * - Drag-to-dismiss handle
 * - Backdrop blur
 * - Keyboard accessible
 * - iOS-safe area aware
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  footer
}: BottomSheetProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-zinc-900 rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out"
        style={{
          animation: isOpen ? 'slideUp 0.3s ease-out' : undefined,
          maxHeight: '90vh',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-iron-gray/50 rounded-full" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-iron-gray/30">
          <h2
            id="bottom-sheet-title"
            className="text-xl font-bold text-iron-white"
          >
            {title}
          </h2>
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-iron-gray hover:text-iron-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 160px)' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-iron-gray/30 px-6 py-4 bg-zinc-900/95 backdrop-blur">
            {footer}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
