// Unit conversion utilities for fitness activities
export type UnitSystem = 'metric' | 'imperial';

// Distance conversions
export const convertDistance = (value: number | null, from: UnitSystem, to: UnitSystem): number | null => {
  if (value === null || value === undefined) return null;

  if (from === to) return value;

  // Value is stored in meters in database
  if (to === 'imperial') {
    // Convert meters to miles
    return value * 0.000621371;
  } else {
    // Convert miles to meters
    return value / 0.000621371;
  }
};

// Speed conversions (stored as m/s in database)
export const convertSpeed = (value: number | null, from: UnitSystem, to: UnitSystem): number | null => {
  if (value === null || value === undefined) return null;

  if (from === to) return value;

  if (to === 'imperial') {
    // Convert m/s to mph
    return value * 2.23694;
  } else {
    // Convert mph to m/s
    return value / 2.23694;
  }
};

// Pace conversions (minutes per distance unit)
export const convertPace = (speedMs: number | null, unitSystem: UnitSystem): string | null => {
  if (speedMs === null || speedMs === undefined || speedMs === 0) return null;

  if (unitSystem === 'imperial') {
    // Calculate minutes per mile
    const milesPerHour = speedMs * 2.23694;
    const minutesPerMile = 60 / milesPerHour;
    const minutes = Math.floor(minutesPerMile);
    const seconds = Math.round((minutesPerMile - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/mi`;
  } else {
    // Calculate minutes per km
    const kmPerHour = speedMs * 3.6;
    const minutesPerKm = 60 / kmPerHour;
    const minutes = Math.floor(minutesPerKm);
    const seconds = Math.round((minutesPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  }
};

// Elevation conversions (stored as meters in database)
export const convertElevation = (value: number | null, from: UnitSystem, to: UnitSystem): number | null => {
  if (value === null || value === undefined) return null;

  if (from === to) return value;

  if (to === 'imperial') {
    // Convert meters to feet
    return value * 3.28084;
  } else {
    // Convert feet to meters
    return value / 3.28084;
  }
};

// Temperature conversions (stored as Celsius in database)
export const convertTemperature = (value: number | null, from: UnitSystem, to: UnitSystem): number | null => {
  if (value === null || value === undefined) return null;

  if (from === to) return value;

  if (to === 'imperial') {
    // Convert Celsius to Fahrenheit
    return (value * 9/5) + 32;
  } else {
    // Convert Fahrenheit to Celsius
    return (value - 32) * 5/9;
  }
};

// Weight conversions (stored as kg in database)
export const convertWeight = (value: number | null, from: UnitSystem, to: UnitSystem): number | null => {
  if (value === null || value === undefined) return null;

  if (from === to) return value;

  if (to === 'imperial') {
    // Convert kg to lbs
    return value * 2.20462;
  } else {
    // Convert lbs to kg
    return value / 2.20462;
  }
};

// Format distance with appropriate units
export const formatDistance = (meters: number | null, unitSystem: UnitSystem, decimals: number = 2): string => {
  if (meters === null || meters === undefined) return '--';

  if (unitSystem === 'imperial') {
    const miles = meters * 0.000621371;
    if (miles < 0.1) {
      // Show in yards for very short distances
      const yards = meters * 1.09361;
      return `${yards.toFixed(0)} yd`;
    }
    return `${miles.toFixed(decimals)} mi`;
  } else {
    if (meters < 1000) {
      return `${meters.toFixed(0)} m`;
    }
    const km = meters / 1000;
    return `${km.toFixed(decimals)} km`;
  }
};

// Format speed with appropriate units
export const formatSpeed = (speedMs: number | null, unitSystem: UnitSystem, decimals: number = 1): string => {
  if (speedMs === null || speedMs === undefined) return '--';

  if (unitSystem === 'imperial') {
    const mph = speedMs * 2.23694;
    return `${mph.toFixed(decimals)} mph`;
  } else {
    const kmh = speedMs * 3.6;
    return `${kmh.toFixed(decimals)} km/h`;
  }
};

// Format elevation with appropriate units
export const formatElevation = (meters: number | null, unitSystem: UnitSystem): string => {
  if (meters === null || meters === undefined) return '--';

  if (unitSystem === 'imperial') {
    const feet = meters * 3.28084;
    return `${Math.round(feet)} ft`;
  } else {
    return `${Math.round(meters)} m`;
  }
};

// Format temperature with appropriate units
export const formatTemperature = (celsius: number | null, unitSystem: UnitSystem): string => {
  if (celsius === null || celsius === undefined) return '--';

  if (unitSystem === 'imperial') {
    const fahrenheit = (celsius * 9/5) + 32;
    return `${Math.round(fahrenheit)}°F`;
  } else {
    return `${Math.round(celsius)}°C`;
  }
};

// Format weight with appropriate units
export const formatWeight = (kg: number | null, unitSystem: UnitSystem, decimals: number = 1): string => {
  if (kg === null || kg === undefined) return '--';

  if (unitSystem === 'imperial') {
    const lbs = kg * 2.20462;
    return `${lbs.toFixed(decimals)} lbs`;
  } else {
    return `${kg.toFixed(decimals)} kg`;
  }
};

// Format duration from seconds to human readable
export const formatDuration = (seconds: number | null): string => {
  if (seconds === null || seconds === undefined) return '--';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

// Format heart rate zones
export const formatHeartRateZones = (zones: any, unitSystem: UnitSystem): string => {
  if (!zones) return '--';
  // Heart rate doesn't change with unit system
  return zones;
};

// Get unit labels
export const getUnitLabels = (unitSystem: UnitSystem) => ({
  distance: unitSystem === 'imperial' ? 'mi' : 'km',
  shortDistance: unitSystem === 'imperial' ? 'yd' : 'm',
  speed: unitSystem === 'imperial' ? 'mph' : 'km/h',
  pace: unitSystem === 'imperial' ? '/mi' : '/km',
  elevation: unitSystem === 'imperial' ? 'ft' : 'm',
  temperature: unitSystem === 'imperial' ? '°F' : '°C',
  weight: unitSystem === 'imperial' ? 'lbs' : 'kg'
});