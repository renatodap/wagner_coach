import { Suspense } from 'react'
import { MealPhotoConfirmClient } from '@/components/MealPhotoConfirm/MealPhotoConfirmClient'
import { Loader2 } from 'lucide-react'

/**
 * Meal Photo Confirmation Page
 *
 * Displays detected foods from photo analysis for user confirmation.
 * Users can review, edit quantities, and save or cancel the meal.
 */

export const metadata = {
  title: 'Confirm Meal | Wagner Coach',
  description: 'Review and confirm your photo-detected meal'
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-iron-black">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-iron-orange animate-spin mx-auto mb-4" />
        <p className="text-iron-gray">Loading meal preview...</p>
      </div>
    </div>
  )
}

export default function MealPhotoConfirmPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MealPhotoConfirmClient />
    </Suspense>
  )
}
