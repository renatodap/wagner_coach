import React from 'react';
import { StepComponentProps } from '@/types/onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const EQUIPMENT_OPTIONS = [
  { id: 'bodyweight', label: 'Bodyweight Only', category: 'basic' },
  { id: 'dumbbells', label: 'Dumbbells', category: 'home' },
  { id: 'resistance_bands', label: 'Resistance Bands', category: 'home' },
  { id: 'yoga_mat', label: 'Yoga Mat', category: 'home' },
  { id: 'kettlebells', label: 'Kettlebells', category: 'home' },
  { id: 'barbell', label: 'Barbell', category: 'gym' },
  { id: 'weight_machines', label: 'Weight Machines', category: 'gym' },
  { id: 'cable_machine', label: 'Cable Machine', category: 'gym' },
  { id: 'cardio_machines', label: 'Cardio Machines', category: 'gym' }
];

export function EquipmentStep({
  data,
  onUpdate,
  onNext,
  onPrevious,
  isFirstStep,
  isLastStep,
  isLoading
}: StepComponentProps) {
  const handleEquipmentToggle = (equipmentId: string) => {
    const currentEquipment = data.available_equipment || [];
    const updatedEquipment = currentEquipment.includes(equipmentId)
      ? currentEquipment.filter((item: string) => item !== equipmentId)
      : [...currentEquipment, equipmentId];

    onUpdate({ available_equipment: updatedEquipment });
  };

  const getEquipmentsByCategory = (category: string) => {
    return EQUIPMENT_OPTIONS.filter(eq => eq.category === category);
  };

  const isSelected = (equipmentId: string) => {
    return (data.available_equipment || []).includes(equipmentId);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Available Equipment</CardTitle>
        <CardDescription>
          Select all equipment you have access to. This helps us create workouts that fit your setup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-3">Basic</h3>
            <div className="grid grid-cols-2 gap-2">
              {getEquipmentsByCategory('basic').map((equipment) => (
                <button
                  key={equipment.id}
                  type="button"
                  onClick={() => handleEquipmentToggle(equipment.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    isSelected(equipment.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-input hover:bg-accent'
                  }`}
                >
                  {equipment.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Home Equipment</h3>
            <div className="grid grid-cols-2 gap-2">
              {getEquipmentsByCategory('home').map((equipment) => (
                <button
                  key={equipment.id}
                  type="button"
                  onClick={() => handleEquipmentToggle(equipment.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    isSelected(equipment.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-input hover:bg-accent'
                  }`}
                >
                  {equipment.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Gym Equipment</h3>
            <div className="grid grid-cols-2 gap-2">
              {getEquipmentsByCategory('gym').map((equipment) => (
                <button
                  key={equipment.id}
                  type="button"
                  onClick={() => handleEquipmentToggle(equipment.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    isSelected(equipment.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-input hover:bg-accent'
                  }`}
                >
                  {equipment.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              disabled={isLoading}
            >
              Previous
            </Button>
          )}

          <Button
            type="button"
            onClick={onNext}
            disabled={isLoading}
            className={isFirstStep ? 'ml-auto' : ''}
          >
            {isLastStep ? 'Complete' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}