"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { SPECIALISTS, type SpecialistType } from '@/types/consultation';

interface SpecialistSelectionProps {
  onSelect: (specialistType: SpecialistType) => void;
  isLoading?: boolean;
}

export function SpecialistSelection({ onSelect, isLoading = false }: SpecialistSelectionProps) {
  const [selectedType, setSelectedType] = useState<SpecialistType | null>(null);
  const router = useRouter();

  const handleSelect = (type: SpecialistType) => {
    // Only allow unified_coach to be selected
    if (type !== 'unified_coach') {
      return;
    }
    setSelectedType(type);
    onSelect(type);
  };

  const isComingSoon = (type: SpecialistType) => {
    return type !== 'unified_coach';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-iron-gray hover:text-iron-orange transition-colors"
          aria-label="Back to dashboard"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">Choose Your Specialist</h1>
          <p className="text-iron-gray">
            Start a personalized consultation with an AI-powered specialist
          </p>
        </div>

        {/* Specialist Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(SPECIALISTS).map((specialist) => {
            const isSelected = selectedType === specialist.type;
            const comingSoon = isComingSoon(specialist.type);
            const isDisabled = (isLoading && selectedType !== specialist.type) || comingSoon;

            return (
              <Card
                key={specialist.type}
                className={`
                  relative overflow-hidden transition-all duration-200
                  bg-iron-black/50 backdrop-blur-sm border-2
                  ${isSelected
                    ? 'border-iron-orange ring-2 ring-offset-2 ring-iron-orange'
                    : 'border-iron-gray/20'
                  }
                  ${isDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:border-iron-orange/50 hover:bg-iron-black/70'
                  }
                `}
                onClick={() => !isDisabled && handleSelect(specialist.type)}
              >
                <div className="p-6 space-y-4">
                  {/* Icon and Name */}
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">{specialist.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white">
                        {specialist.name}
                      </h3>
                      <p className="text-sm text-iron-gray mt-1">
                        {specialist.description}
                      </p>
                    </div>
                    {isLoading && isSelected ? (
                      <Loader2 className="h-5 w-5 animate-spin text-iron-orange" />
                    ) : (
                      <ChevronRight className={`h-5 w-5 ${comingSoon ? 'text-iron-gray/50' : 'text-iron-gray'}`} />
                    )}
                  </div>

                  {/* Expertise Areas */}
                  <div className="flex flex-wrap gap-2">
                    {specialist.expertiseAreas.map((area) => (
                      <Badge
                        key={area}
                        variant="secondary"
                        className="bg-iron-gray/20 text-iron-gray border border-iron-gray/30"
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Coming Soon or Selected Indicator */}
                {comingSoon ? (
                  <div className="absolute top-0 right-0 bg-iron-orange/50 px-3 py-1">
                    <span className="text-xs font-medium text-white">
                      Coming Soon
                    </span>
                  </div>
                ) : isSelected ? (
                  <div className="absolute top-0 right-0 bg-iron-orange px-3 py-1">
                    <span className="text-xs font-medium text-white">
                      {isLoading ? 'Starting...' : 'Selected'}
                    </span>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>

        {/* Recommended Choice */}
        <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-orange/30 p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">
                Not sure which specialist to choose?
              </h4>
              <p className="text-sm text-iron-gray mb-3">
                Start with the <strong className="text-iron-orange">Unified Coach</strong> for a comprehensive consultation
                covering fitness, nutrition, and lifestyle. You can always consult other
                specialists later for specific needs.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelect('unified_coach')}
                disabled={isLoading}
                className="border-iron-orange/50 text-iron-orange hover:bg-iron-orange hover:text-white"
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
        <div className="text-center text-sm text-iron-gray">
          <p>
            Consultations typically take 10-15 minutes and help us create your personalized
            fitness and nutrition program.
          </p>
        </div>
      </div>
    </div>
  );
}
