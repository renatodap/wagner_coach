'use client'

interface CircularProgressProps {
  value: number
  max: number
  label: string
  size?: 'small' | 'medium' | 'large'
  color?: string
  showValue?: boolean
  unit?: string
}

export function CircularProgress({
  value,
  max,
  label,
  size = 'large',
  color = '#ff6b35', // iron-orange
  showValue = true,
  unit = ''
}: CircularProgressProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const radius = size === 'large' ? 70 : size === 'medium' ? 50 : 45
  const strokeWidth = size === 'large' ? 12 : size === 'medium' ? 10 : 8
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // Determine text size based on size prop
  const valueFontSize = size === 'large' ? 'text-4xl' : size === 'medium' ? 'text-3xl' : 'text-2xl'
  const labelFontSize = size === 'large' ? 'text-sm' : size === 'medium' ? 'text-xs' : 'text-xs'
  const unitFontSize = size === 'large' ? 'text-lg' : size === 'medium' ? 'text-base' : 'text-sm'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke="#374151" // gray-700
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.5s ease'
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        {/* Center text */}
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`font-bold text-white ${valueFontSize}`}>
              {Math.round(value)}
            </div>
            <div className={`text-iron-gray ${unitFontSize}`}>
              / {max}{unit}
            </div>
          </div>
        )}
      </div>

      {/* Label */}
      <div className={`text-iron-gray font-medium uppercase tracking-wide ${labelFontSize}`}>
        {label}
      </div>
    </div>
  )
}
