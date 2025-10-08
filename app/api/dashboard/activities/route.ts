import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    // Fetch today's activities
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, elapsed_time_seconds, calories, distance_meters')
      .eq('user_id', user.id)
      .gte('start_date', `${today}T00:00:00.000Z`)
      .lte('start_date', `${today}T23:59:59.999Z`)

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError)
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      )
    }

    // Calculate today's totals
    const totals = {
      count: activities?.length || 0,
      duration: activities?.reduce((sum, activity) => sum + (Number(activity.elapsed_time_seconds) || 0), 0) || 0,
      calories: activities?.reduce((sum, activity) => sum + (Number(activity.calories) || 0), 0) || 0,
      distance: activities?.reduce((sum, activity) => sum + (Number(activity.distance_meters) || 0), 0) || 0,
    }

    // Return data
    return NextResponse.json({
      count: totals.count,
      duration: totals.duration,
      calories: Math.round(totals.calories),
      distance: totals.distance,
    })
  } catch (error) {
    console.error('Dashboard activities API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
