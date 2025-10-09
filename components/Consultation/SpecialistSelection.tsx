"use client"

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronRight } from 'lucide-react';
import { SPECIALISTS, type SpecialistType } from '@/types/consultation';

interface SpecialistSelectionProps {
  onSelect: (specialistType: SpecialistType) => void;
  isLoading?: boolean;
}

export function SpecialistSelection({ onSelect, isLoading = false }: SpecialistSelectionProps) {
  const [selectedType, setSelectedType] = useState<SpecialistType | null>(null);

  const handleSelect = (type: SpecialistType) => {
    setSelectedType(type);
    onSelect(type);
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string; hover: string }> = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        hover: 'hover:bg-blue-100'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-900',
        hover: 'hover:bg-green-100'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-900',
        hover: 'hover:bg-orange-100'
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-900',
        hover: 'hover:bg-red-100'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-900',
        hover: 'hover:bg-purple-100'
      }
    };

    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Choose Your Specialist</h1>
        <p className="text-gray-600">
          Start a personalized consultation with an AI-powered specialist
        </p>
      </div>

      {/* Specialist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(SPECIALISTS).map((specialist) => {
          const colors = getColorClasses(specialist.color);
          const isSelected = selectedType === specialist.type;
          const isDisabled = isLoading && selectedType !== specialist.type;

          return (
            <Card
              key={specialist.type}
              className={`
                relative overflow-hidden transition-all duration-200
                ${colors.border} border-2
                ${isSelected ? `${colors.bg} ring-2 ring-offset-2 ring-${specialist.color}-500` : 'bg-white'}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : `cursor-pointer ${colors.hover}`}
              `}
              onClick={() => !isDisabled && handleSelect(specialist.type)}
            >
              <div className="p-6 space-y-4">
                {/* Icon and Name */}
                <div className="flex items-start gap-4">
                  <div className="text-5xl">{specialist.icon}</div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-semibold ${colors.text}`}>
                      {specialist.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {specialist.description}
                    </p>
                  </div>
                  {isLoading && isSelected ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {/* Expertise Areas */}
                <div className="flex flex-wrap gap-2">
                  {specialist.expertiseAreas.map((area) => (
                    <Badge
                      key={area}
                      variant="secondary"
                      className={`${colors.bg} ${colors.text} border ${colors.border}`}
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Hover/Selected Indicator */}
              {isSelected && (
                <div className={`absolute top-0 right-0 ${colors.bg} px-3 py-1 rounded-bl-lg`}>
                  <span className={`text-xs font-medium ${colors.text}`}>
                    {isLoading ? 'Starting...' : 'Selected'}
                  </span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Recommended Choice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">
              Not sure which specialist to choose?
            </h4>
            <p className="text-sm text-blue-800 mb-3">
              Start with the <strong>Unified Coach</strong> for a comprehensive consultation
              covering fitness, nutrition, and lifestyle. You can always consult other
              specialists later for specific needs.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelect('unified_coach')}
              disabled={isLoading}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {isLoading && selectedType === 'unified_coach' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Unified Coach...
                </>
              ) : (
                <>
                  Start with Unified Coach
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Consultations typically take 10-15 minutes and help us create your personalized
          fitness and nutrition program.
        </p>
      </div>
    </div>
  );
}
