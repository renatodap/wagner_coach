"use client"

import { Camera, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface CameraButtonProps {
  onImageSelected: (file: File) => void
  disabled?: boolean
}

/**
 * CameraButton - Smart camera/file picker button
 *
 * Mobile: Opens native camera for instant photos
 * Desktop: Opens file picker for selecting images
 *
 * Automatically detects device type and shows appropriate input
 */
export function CameraButton({ onImageSelected, disabled = false }: CameraButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  function handleClick() {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPG, PNG, etc.)',
        variant: 'destructive'
      })
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 10MB',
        variant: 'destructive'
      })
      return
    }

    setIsProcessing(true)
    try {
      onImageSelected(file)
    } catch (error) {
      console.error('Failed to process image:', error)
      toast({
        title: 'Failed to process image',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
      // Reset input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        onTouchEnd={handleClick}
        disabled={disabled || isProcessing}
        className="text-iron-gray hover:text-iron-orange hover:bg-iron-orange/10 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Take or select photo"
        title="Take or select photo"
      >
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Camera className="h-5 w-5" />
        )}
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </>
  )
}
