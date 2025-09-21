'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MealLogFormProps, MealFormData, MealInsert, MEAL_CATEGORY_LABELS, FoodRecognitionResult } from '@/types/nutrition';
import { PhotoUpload } from './PhotoUpload';
import { PhotoRecognitionResult } from './PhotoRecognitionResult';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Camera, Edit } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function MealLogForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting: externalIsSubmitting = false,
}: MealLogFormProps) {
  const [isSubmittingInternal, setIsSubmittingInternal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<FoodRecognitionResult | null>(null);
  const [recognitionError, setRecognitionError] = useState<string>('');

  const isSubmitting = externalIsSubmitting || isSubmittingInternal;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<MealFormData>({
    defaultValues: {
      meal_name: initialData?.meal_name || '',
      meal_category: initialData?.meal_category || '',
      logged_at: initialData?.logged_at || new Date(),
      notes: initialData?.notes || '',
    },
  });

  const mealCategory = watch('meal_category');

  const handleImageSelect = async (file: File) => {
    setSelectedImage(file);
    setRecognitionError('');
    setIsProcessingImage(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;

        // Call recognition API
        const response = await fetch('/api/nutrition/recognize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64,
            userId: 'current-user', // This will be handled by the API
          }),
        });

        const result = await response.json();

        if (result.success) {
          setRecognitionResult(result.data);
        } else {
          setRecognitionError(result.error || 'Failed to recognize food');
        }

        setIsProcessingImage(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      setRecognitionError('Failed to process image');
      setIsProcessingImage(false);
    }
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setRecognitionResult(null);
    setRecognitionError('');
  };

  const handleAcceptRecognition = (result: FoodRecognitionResult) => {
    // Populate form with recognition results
    const mealName = result.foods.map(f => f.name).join(', ');
    setValue('meal_name', mealName);

    // Auto-detect meal category based on time
    const hour = new Date().getHours();
    let category: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'snack';
    if (hour >= 5 && hour < 11) category = 'breakfast';
    else if (hour >= 11 && hour < 15) category = 'lunch';
    else if (hour >= 17 && hour < 21) category = 'dinner';

    setValue('meal_category', category);

    // Add nutrition info to notes
    const nutritionSummary = `Calories: ${result.totalNutrition.calories}, Protein: ${result.totalNutrition.protein_g}g, Carbs: ${result.totalNutrition.carbs_g}g, Fat: ${result.totalNutrition.fat_g}g`;
    setValue('notes', nutritionSummary);
  };

  const handleRejectRecognition = () => {
    setRecognitionResult(null);
    setSelectedImage(null);
  };

  const handleFormSubmit = async (data: MealFormData) => {
    if (!data.meal_category) {
      return;
    }

    setIsSubmittingInternal(true);

    try {
      const mealInsert: MealInsert = {
        meal_name: data.meal_name.trim(),
        meal_category: data.meal_category,
        logged_at: data.logged_at.toISOString(),
        notes: data.notes?.trim() || undefined,
        // If we have recognition results, include nutrition data
        ...(recognitionResult && {
          calories: Math.round(recognitionResult.totalNutrition.calories),
          protein_g: recognitionResult.totalNutrition.protein_g,
          carbs_g: recognitionResult.totalNutrition.carbs_g,
          fat_g: recognitionResult.totalNutrition.fat_g,
        }),
      };

      await onSubmit(mealInsert);
      reset();
      handleImageRemove();
    } catch (error) {
      console.error('Error submitting meal:', error);
    } finally {
      setIsSubmittingInternal(false);
    }
  };

  const formatDateForInput = (date: Date): string => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Log Meal</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="photo">
              <Camera className="w-4 h-4 mr-2" />
              Photo
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Edit className="w-4 h-4 mr-2" />
              Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photo" className="space-y-4">
            {/* Photo Upload Section */}
            <PhotoUpload
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              isProcessing={isProcessingImage}
              error={recognitionError}
            />

            {/* Recognition Results */}
            {(recognitionResult || isProcessingImage) && (
              <PhotoRecognitionResult
                result={recognitionResult}
                onAccept={handleAcceptRecognition}
                onReject={handleRejectRecognition}
                isLoading={isProcessingImage}
              />
            )}

            {recognitionResult && (
              <Button
                onClick={() => {
                  const tab = document.querySelector('[value="manual"]') as HTMLButtonElement;
                  tab?.click();
                }}
                className="w-full"
              >
                Continue to Edit Details
              </Button>
            )}
          </TabsContent>

          <TabsContent value="manual">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              {/* Meal Name */}
              <div className="space-y-2">
                <Label htmlFor="meal_name">
                  Meal Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="meal_name"
                  type="text"
                  placeholder="e.g., Grilled chicken with vegetables"
                  aria-label="Meal name"
                  required
                  {...register('meal_name', {
                    required: 'Meal name is required',
                    validate: (value) => value.trim().length > 0 || 'Meal name cannot be empty',
                    maxLength: {
                      value: 255,
                      message: 'Meal name too long (max 255 characters)',
                    },
                  })}
                />
                {errors.meal_name && (
                  <span className="text-sm text-red-500">{errors.meal_name.message}</span>
                )}
              </div>

              {/* Meal Category */}
              <div className="space-y-2">
                <Label htmlFor="meal_category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={mealCategory}
                  onValueChange={(value) => setValue('meal_category', value as any)}
                >
                  <SelectTrigger id="meal_category" aria-label="Category" required>
                    <SelectValue placeholder="Select meal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MEAL_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.meal_category && (
                  <span className="text-sm text-red-500">Category is required</span>
                )}
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label htmlFor="logged_at">Time</Label>
                <Input
                  id="logged_at"
                  type="datetime-local"
                  aria-label="Time"
                  defaultValue={formatDateForInput(initialData?.logged_at || new Date())}
                  {...register('logged_at', {
                    setValueAs: (value) => new Date(value),
                  })}
                />
                {errors.logged_at && (
                  <span className="text-sm text-red-500">Invalid date format</span>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes about this meal"
                  aria-label="Notes"
                  rows={3}
                  {...register('notes', {
                    maxLength: {
                      value: 500,
                      message: 'Notes too long (max 500 characters)',
                    },
                  })}
                />
                {errors.notes && (
                  <span className="text-sm text-red-500">{errors.notes.message}</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}