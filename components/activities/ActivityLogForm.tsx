'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ActivityType, CreateActivityRequest } from '@/types/activity';
import ActivityTypeSelector from './ActivityTypeSelector';
import DynamicActivityForm from './DynamicActivityForm';
import { createActivity } from '@/lib/api/activities';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

interface ActivityLogFormProps {
  onSubmit?: (activity: any) => void;
  onCancel?: () => void;
  initialData?: Partial<CreateActivityRequest>;
  preSelectedType?: ActivityType;
}

export default function ActivityLogForm({ onSubmit, onCancel, initialData, preSelectedType }: ActivityLogFormProps) {
  const [selectedType, setSelectedType] = useState<ActivityType | undefined>(preSelectedType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleTypeSelect = (type: ActivityType) => {
    setSelectedType(type);
  };

  const handleBackToTypeSelection = () => {
    setSelectedType(undefined);
  };

  const handleFormSubmit = async (activityData: CreateActivityRequest) => {
    setIsSubmitting(true);

    try {
      const activity = await createActivity(activityData);

      toast({
        title: 'Activity Logged!',
        description: `${activity.name} has been logged successfully.`,
        variant: 'default'
      });

      if (onSubmit) {
        onSubmit(activity);
      } else {
        // Navigate to activities page
        router.push('/activities');
      }
    } catch (error) {
      console.error('Failed to create activity:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to log activity. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (selectedType) {
      // If form is shown, go back to type selection
      handleBackToTypeSelection();
    } else if (onCancel) {
      // If on type selection, call onCancel
      onCancel();
    } else {
      // Navigate back
      router.back();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            {selectedType && (
              <button
                onClick={handleBackToTypeSelection}
                className="text-iron-orange hover:text-orange-400 transition-colors"
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <h2 className="font-heading text-2xl text-iron-orange">
              {selectedType ? 'LOG ACTIVITY' : 'SELECT ACTIVITY TYPE'}
            </h2>
          </div>
          <p className="text-iron-gray text-sm">
            {selectedType
              ? 'Fill in the details of your activity'
              : 'Choose the type of activity you want to log'
            }
          </p>
        </div>

        {/* Content */}
        {!selectedType ? (
          // Step 1: Activity Type Selection
          <ActivityTypeSelector
            selectedType={selectedType}
            onSelectType={handleTypeSelect}
          />
        ) : (
          // Step 2: Activity Form
          <DynamicActivityForm
            activityType={selectedType}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
            initialData={initialData}
          />
        )}

        {/* Cancel button for type selection */}
        {!selectedType && onCancel && (
          <div className="mt-6">
            <button
              onClick={onCancel}
              className="w-full border border-iron-gray text-iron-white font-heading py-3 uppercase tracking-wider hover:bg-iron-gray/20 transition-colors rounded-lg"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
