'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Info, Sparkles } from 'lucide-react'

interface ConfidenceBadgeProps {
  confidence?: number
  estimatedFrom?: string
  sampleSize?: number
}

export function ConfidenceBadge({
  confidence,
  estimatedFrom,
  sampleSize,
}: ConfidenceBadgeProps) {
  if (!estimatedFrom) return null

  const isPattern = estimatedFrom.includes('pattern')
  const isBaseline = estimatedFrom.includes('baseline')

  let variant: 'default' | 'secondary' | 'outline' = 'outline'
  let icon = <Info className="h-3 w-3" />
  let text = estimatedFrom

  if (isPattern && confidence !== undefined) {
    icon = <Sparkles className="h-3 w-3" />
    if (confidence >= 0.8) {
      variant = 'default'
      text = `High confidence estimate (${sampleSize || 'multiple'} similar logs)`
    } else if (confidence >= 0.6) {
      variant = 'secondary'
      text = `Medium confidence estimate (${sampleSize || 'few'} similar logs)`
    } else {
      variant = 'outline'
      text = `Low confidence estimate (limited history)`
    }
  } else if (isBaseline) {
    text = 'Generic estimate (no history yet)'
  }

  return (
    <Badge variant={variant} className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs">{text}</span>
    </Badge>
  )
}
