'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus } from 'lucide-react'

interface NumberStepperProps {
  value: number | undefined
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  placeholder?: string
  disabled?: boolean
  id?: string
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  unit,
  placeholder = '0',
  disabled = false,
  id,
}: NumberStepperProps) {
  const handleDecrement = () => {
    const currentValue = value ?? 0
    const newValue = Math.max(min, currentValue - step)
    onChange(newValue)
  }

  const handleIncrement = () => {
    const currentValue = value ?? 0
    const newValue = Math.min(max, currentValue + step)
    onChange(newValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value === '' ? undefined : parseFloat(e.target.value)
    if (newValue !== undefined && !isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)))
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleDecrement}
        disabled={disabled || (value !== undefined && value <= min)}
        aria-label="Decrease value"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <div className="relative flex-1">
        <Input
          id={id}
          type="number"
          value={value ?? ''}
          onChange={handleInputChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="text-center pr-12"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            {unit}
          </span>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleIncrement}
        disabled={disabled || (value !== undefined && value >= max)}
        aria-label="Increase value"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
