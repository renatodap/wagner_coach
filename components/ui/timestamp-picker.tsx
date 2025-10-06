'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from 'lucide-react'

interface TimestampPickerProps {
  value: string | undefined
  onChange: (value: string) => void
  label: string
  id: string
  disabled?: boolean
}

export function TimestampPicker({
  value,
  onChange,
  label,
  id,
  disabled = false,
}: TimestampPickerProps) {
  // Convert ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
  const formatForInput = (isoString: string | undefined): string => {
    if (!isoString) {
      // Default to current time
      const now = new Date()
      return now.toISOString().slice(0, 16)
    }
    return new Date(isoString).toISOString().slice(0, 16)
  }

  // Convert datetime-local format back to ISO string
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const localDateTime = e.target.value
    if (localDateTime) {
      const isoString = new Date(localDateTime).toISOString()
      onChange(isoString)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        {label}
      </Label>
      <Input
        id={id}
        type="datetime-local"
        value={formatForInput(value)}
        onChange={handleChange}
        disabled={disabled}
        className="w-full"
      />
    </div>
  )
}
