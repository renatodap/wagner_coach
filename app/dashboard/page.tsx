import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Redirect dashboard to workouts since they're the same thing now
  redirect('/workouts');
}