import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MealScanClient } from '@/components/MealScan/MealScanClient'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata = {
  title: 'Meal Scan | Wagner Coach',
  description: 'Scan and analyze your meals with AI',
}

export default async function MealScanPage() {
  // Get authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <ErrorBoundary>
      <MealScanClient />
    </ErrorBoundary>
  )
}
