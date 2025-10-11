/**
 * CameraScanButton - Floating camera FAB for dashboard
 *
 * Provides quick access to meal photo scanning by navigating to coach chat.
 * Stores image in sessionStorage and redirects to coach page for processing.
 */

'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'

export function CameraScanButton() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('[CameraScanButton] Image captured, navigating to coach...')

    // Store image in sessionStorage for coach page to pick up
    const reader = new FileReader()
    reader.onload = () => {
      sessionStorage.setItem('pendingImageUpload', reader.result as string)
      sessionStorage.setItem('pendingImageName', file.name)

      // Navigate to dedicated photo meal logging page
      router.push('/en/nutrition/photo-log')
    }
    reader.readAsDataURL(file)

    // Reset file input so same image can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageCapture}
        className="hidden"
      />

      {/* Floating Camera FAB */}
      <button
        onClick={handleCameraClick}
        className="fixed bottom-24 right-6 z-50 w-16 h-16 bg-iron-orange hover:bg-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        aria-label="Scan meal with camera"
      >
        <Camera className="h-6 w-6" />
      </button>
    </>
  )
}
