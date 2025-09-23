'use client';

import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Button } from '@/components/ui/button';
import { Ruler, Activity } from 'lucide-react';

export default function UnitSystemToggle() {
  const { preferences, toggleUnitSystem, loading } = useUserPreferences();

  if (loading || !preferences) {
    return (
      <div className="border border-iron-gray p-4 rounded">
        <div className="animate-pulse bg-iron-gray h-8 w-32 rounded"></div>
      </div>
    );
  }

  return (
    <div className="border border-iron-gray p-4 rounded">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ruler className="w-5 h-5 text-iron-orange" />
          <div>
            <p className="text-iron-white font-medium">Unit System</p>
            <p className="text-xs text-iron-gray">
              Currently using {preferences.unit_system === 'metric' ? 'Metric' : 'Imperial'} units
            </p>
          </div>
        </div>
        <Button
          onClick={toggleUnitSystem}
          size="sm"
          variant="outline"
          className="border-iron-gray hover:bg-iron-gray/20"
        >
          Switch to {preferences.unit_system === 'metric' ? 'Imperial' : 'Metric'}
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-iron-gray">
        <div>
          <span className="text-iron-orange">Distance:</span>{' '}
          {preferences.unit_system === 'metric' ? 'kilometers' : 'miles'}
        </div>
        <div>
          <span className="text-iron-orange">Speed:</span>{' '}
          {preferences.unit_system === 'metric' ? 'km/h' : 'mph'}
        </div>
        <div>
          <span className="text-iron-orange">Elevation:</span>{' '}
          {preferences.unit_system === 'metric' ? 'meters' : 'feet'}
        </div>
        <div>
          <span className="text-iron-orange">Weight:</span>{' '}
          {preferences.unit_system === 'metric' ? 'kilograms' : 'pounds'}
        </div>
      </div>
    </div>
  );
}