import Link from 'next/link'

export function CoachNav() {
  return (
    <div className="flex gap-4 mb-6 justify-center">
      <Link 
        href="/coach/trainer" 
        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <span>🏋️</span>
        <span>Trainer</span>
      </Link>
      <Link 
        href="/coach/nutritionist" 
        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <span>🥗</span>
        <span>Nutritionist</span>
      </Link>
    </div>
  )
}
