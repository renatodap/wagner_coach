'use client';

import React, { useState } from 'react';
import type { ActivityType, CreateActivityRequest } from '@/types/activity';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Heart, Zap, Dumbbell, Flame } from 'lucide-react';

interface DynamicActivityFormProps {
  activityType: ActivityType;
  onSubmit: (data: CreateActivityRequest) => void;
  onCancel?: () => void;
}

export default function DynamicActivityForm({
  activityType,
  onSubmit,
  onCancel
}: DynamicActivityFormProps) {
  const [formData, setFormData] = useState<Partial<CreateActivityRequest>>({
    activity_type: activityType,
    name: '',
    start_date: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM
    duration_minutes: undefined,
    source: 'manual'
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.start_date) {
      return;
    }

    onSubmit(formData as CreateActivityRequest);
  };

  // Render different fields based on activity type
  const renderActivitySpecificFields = () => {
    switch (activityType) {
      case 'running':
      case 'cycling':
      case 'swimming':
      case 'walking':
        return renderCardioFields();
      case 'strength_training':
      case 'crossfit':
      case 'workout':
        return renderStrengthFields();
      case 'tennis':
      case 'soccer':
      case 'basketball':
        return renderSportsFields();
      case 'yoga':
        return renderYogaFields();
      default:
        return renderBasicFields();
    }
  };

  const renderCardioFields = () => (
    <>
      {/* Distance */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          Distance (miles)
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.distance_meters ? (formData.distance_meters / 1609.34).toFixed(2) : ''}
          onChange={(e) => updateField('distance_meters', parseFloat(e.target.value) * 1609.34)}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
          placeholder="4.2"
        />
      </div>

      {/* Average Pace */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          Average Pace (min/mile)
        </label>
        <input
          type="text"
          value={formData.average_pace || ''}
          onChange={(e) => updateField('average_pace', e.target.value)}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
          placeholder="8:30"
        />
      </div>

      {/* Elevation Gain */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          Elevation Gain (ft)
        </label>
        <input
          type="number"
          value={formData.total_elevation_gain ? (formData.total_elevation_gain * 3.28084).toFixed(0) : ''}
          onChange={(e) => updateField('total_elevation_gain', parseFloat(e.target.value) / 3.28084)}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
          placeholder="250"
        />
      </div>

      {/* Average Heart Rate */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          <Heart className="inline w-4 h-4 mr-1" />
          Avg Heart Rate (bpm)
        </label>
        <input
          type="number"
          value={formData.average_heartrate || ''}
          onChange={(e) => updateField('average_heartrate', parseInt(e.target.value))}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
          placeholder="155"
        />
      </div>
    </>
  );

  const renderStrengthFields = () => (
    <>
      {/* Total Sets */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          <Dumbbell className="inline w-4 h-4 mr-1" />
          Total Sets
        </label>
        <input
          type="number"
          value={formData.total_sets || ''}
          onChange={(e) => updateField('total_sets', parseInt(e.target.value))}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
          placeholder="15"
        />
      </div>

      {/* Total Reps */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          Total Reps
        </label>
        <input
          type="number"
          value={formData.total_reps || ''}
          onChange={(e) => updateField('total_reps', parseInt(e.target.value))}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
          placeholder="120"
        />
      </div>

      {/* Total Weight Lifted */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          Total Weight Lifted (lbs)
        </label>
        <input
          type="number"
          value={formData.total_weight_lifted_kg ? (formData.total_weight_lifted_kg * 2.20462).toFixed(0) : ''}
          onChange={(e) => updateField('total_weight_lifted_kg', parseFloat(e.target.value) / 2.20462)}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
          placeholder="5000"
        />
      </div>

      {/* Exercise Count */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          Number of Exercises
        </label>
        <input
          type="number"
          value={formData.exercise_count || ''}
          onChange={(e) => updateField('exercise_count', parseInt(e.target.value))}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
          placeholder="6"
        />
      </div>
    </>
  );

  const renderSportsFields = () => (
    <>
      {/* Session Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          Session Type
        </label>
        <select
          value={formData.workout_type || ''}
          onChange={(e) => updateField('workout_type', e.target.value)}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
        >
          <option value="">Select...</option>
          <option value="practice">Practice</option>
          <option value="match">Match</option>
          <option value="game">Game</option>
          <option value="scrimmage">Scrimmage</option>
        </select>
      </div>

      {/* Sets/Games Played */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          Sets/Games Played
        </label>
        <input
          type="number"
          value={formData.sets_played || formData.games_played || ''}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            updateField('sets_played', value);
            updateField('games_played', value);
          }}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
          placeholder="3"
        />
      </div>
    </>
  );

  const renderYogaFields = () => (
    <>
      {/* Yoga Style */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          Yoga Style
        </label>
        <input
          type="text"
          value={formData.workout_type || ''}
          onChange={(e) => updateField('workout_type', e.target.value)}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
          placeholder="Vinyasa, Hatha, etc."
        />
      </div>

      {/* Poses Held */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          Poses Held
        </label>
        <input
          type="number"
          value={formData.poses_held || ''}
          onChange={(e) => updateField('poses_held', parseInt(e.target.value))}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
          placeholder="15"
        />
      </div>

      {/* Flexibility Score */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          Flexibility Score (1-10)
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={formData.flexibility_score || ''}
          onChange={(e) => updateField('flexibility_score', parseInt(e.target.value))}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
          placeholder="7"
        />
      </div>
    </>
  );

  const renderBasicFields = () => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-iron-gray uppercase">
        Workout Type
      </label>
      <input
        type="text"
        value={formData.workout_type || ''}
        onChange={(e) => updateField('workout_type', e.target.value)}
        className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
        placeholder="What kind of workout?"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Activity Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          Activity Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
          placeholder="Morning Run"
          required
        />
      </div>

      {/* Date & Time */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          <Calendar className="inline w-4 h-4 mr-1" />
          Date & Time *
        </label>
        <input
          type="datetime-local"
          value={formData.start_date?.slice(0, 16)}
          onChange={(e) => updateField('start_date', new Date(e.target.value).toISOString())}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
          required
        />
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          <Clock className="inline w-4 h-4 mr-1" />
          Duration (minutes) *
        </label>
        <input
          type="number"
          value={formData.duration_minutes || ''}
          onChange={(e) => updateField('duration_minutes', parseInt(e.target.value))}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
          placeholder="45"
          required
        />
      </div>

      {/* Activity-specific fields */}
      {renderActivitySpecificFields()}

      {/* Calories */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          <Flame className="inline w-4 h-4 mr-1" />
          Calories Burned
        </label>
        <input
          type="number"
          value={formData.calories || ''}
          onChange={(e) => updateField('calories', parseInt(e.target.value))}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
          placeholder="450"
        />
      </div>

      {/* RPE */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          <Zap className="inline w-4 h-4 mr-1" />
          Perceived Exertion (1-10)
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={formData.perceived_exertion || formData.rpe || ''}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            updateField('perceived_exertion', value);
            updateField('rpe', value);
          }}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
          placeholder="7"
        />
      </div>

      {/* Location */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          <MapPin className="inline w-4 h-4 mr-1" />
          Location
        </label>
        <input
          type="text"
          value={formData.location || ''}
          onChange={(e) => updateField('location', e.target.value)}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
          placeholder="Gym, Park, Trail..."
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-iron-gray uppercase">
          Notes
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={3}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg min-h-[80px]"
          placeholder="How did it feel?"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          className="flex-1 bg-iron-orange text-white font-heading py-3 uppercase tracking-wider hover:bg-orange-600 transition-colors"
        >
          Log Activity
        </Button>
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="flex-1 border-iron-gray text-iron-white font-heading py-3 uppercase tracking-wider hover:bg-iron-gray/20 transition-colors"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
