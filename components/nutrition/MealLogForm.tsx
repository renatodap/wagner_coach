'use client';

import React, { useState } from 'react';
import { MealFormData, MealInsert, MealLogFormProps, MEAL_CATEGORY_LABELS } from '@/types/nutrition';

const MealLogForm: React.FC<MealLogFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isSubmitting = false
}) => {
  // Initialize form state
  const [formData, setFormData] = useState<MealFormData>({
    meal_name: initialData?.meal_name || '',
    meal_category: initialData?.meal_category || '',
    logged_at: initialData?.logged_at || new Date(),
    notes: initialData?.notes || '',
    calories: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
    fiber_g: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Format date for datetime-local input
  const formatDateTimeLocal = (date: Date): string => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate meal name
    if (!formData.meal_name.trim()) {
      newErrors.meal_name = 'Meal name is required';
    } else if (formData.meal_name.length > 200) {
      newErrors.meal_name = 'Meal name must be 200 characters or less';
    }

    // Validate category
    if (!formData.meal_category) {
      newErrors.meal_category = 'Category is required';
    }

    // Validate date/time
    if (!formData.logged_at) {
      newErrors.logged_at = 'Date and time are required';
    }

    // Validate macro nutrients (if provided)
    const validateMacro = (value: string, fieldName: string) => {
      if (value) {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) {
          newErrors[fieldName] = `${fieldName.replace('_g', '')} must be a positive number`;
        }
      }
    };

    if (formData.calories) {
      const num = parseInt(formData.calories);
      if (isNaN(num) || num < 0) {
        newErrors.calories = 'Calories must be a positive number';
      }
    }

    validateMacro(formData.protein_g, 'protein_g');
    validateMacro(formData.carbs_g, 'carbs_g');
    validateMacro(formData.fat_g, 'fat_g');
    validateMacro(formData.fiber_g, 'fiber_g');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Sanitize input to prevent XSS
  const sanitizeInput = (input: string): string => {
    return input.replace(/<[^>]*>?/gm, '');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form and display errors
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Convert form data to MealInsert format
      const mealData: MealInsert = {
        meal_name: sanitizeInput(formData.meal_name.trim()),
        meal_category: formData.meal_category as MealInsert['meal_category'],
        logged_at: formData.logged_at.toISOString(),
        notes: formData.notes ? sanitizeInput(formData.notes) : undefined,
        calories: formData.calories ? parseInt(formData.calories) : undefined,
        protein_g: formData.protein_g ? parseFloat(formData.protein_g) : undefined,
        carbs_g: formData.carbs_g ? parseFloat(formData.carbs_g) : undefined,
        fat_g: formData.fat_g ? parseFloat(formData.fat_g) : undefined,
        fiber_g: formData.fiber_g ? parseFloat(formData.fiber_g) : undefined
      };

      // Remove undefined optional fields
      Object.keys(mealData).forEach(key => {
        if (mealData[key as keyof MealInsert] === undefined) {
          delete mealData[key as keyof MealInsert];
        }
      });

      await onSubmit(mealData);

      // Clear form on success
      setFormData({
        meal_name: '',
        meal_category: '',
        logged_at: new Date(),
        notes: '',
        calories: '',
        protein_g: '',
        carbs_g: '',
        fat_g: '',
        fiber_g: ''
      });

      setSuccessMessage('Meal saved successfully!');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save meal');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'logged_at') {
      setFormData(prev => ({
        ...prev,
        logged_at: new Date(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Meal Name */}
      <div>
        <label htmlFor="meal_name" className="block text-iron-gray text-xs uppercase mb-2">
          Meal Name <span className="text-iron-orange">*</span>
        </label>
        <input
          id="meal_name"
          name="meal_name"
          type="text"
          required
          value={formData.meal_name}
          onChange={handleChange}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
          placeholder="e.g., Grilled Chicken Salad"
        />
        {errors.meal_name && (
          <p className="text-red-500 text-sm mt-1">{errors.meal_name}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="meal_category" className="block text-iron-gray text-xs uppercase mb-2">
          Category <span className="text-iron-orange">*</span>
        </label>
        <select
          id="meal_category"
          name="meal_category"
          required
          value={formData.meal_category}
          onChange={handleChange}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
        >
          <option value="">Select a category</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
        {errors.meal_category && (
          <p className="text-red-500 text-sm mt-1">{errors.meal_category}</p>
        )}
      </div>

      {/* Date and Time */}
      <div>
        <label htmlFor="logged_at" className="block text-iron-gray text-xs uppercase mb-2">
          Date & Time <span className="text-iron-orange">*</span>
        </label>
        <input
          id="logged_at"
          name="logged_at"
          type="datetime-local"
          required
          value={formatDateTimeLocal(formData.logged_at)}
          onChange={handleChange}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
        />
        {errors.logged_at && (
          <p className="text-red-500 text-sm mt-1">{errors.logged_at}</p>
        )}
      </div>

      {/* Macro Nutrients (Optional) */}
      <div className="space-y-4">
        <h3 className="text-iron-white font-heading text-lg">Nutritional Information (Optional)</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Calories */}
          <div>
            <label htmlFor="calories" className="block text-iron-gray text-xs uppercase mb-2">
              Calories
            </label>
            <input
              id="calories"
              name="calories"
              type="number"
              min="0"
              value={formData.calories}
              onChange={handleChange}
              className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
              placeholder="0"
            />
            {errors.calories && (
              <p className="text-red-500 text-sm mt-1">{errors.calories}</p>
            )}
          </div>

          {/* Protein */}
          <div>
            <label htmlFor="protein_g" className="block text-iron-gray text-xs uppercase mb-2">
              Protein (g)
            </label>
            <input
              id="protein_g"
              name="protein_g"
              type="number"
              min="0"
              step="0.1"
              value={formData.protein_g}
              onChange={handleChange}
              className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
              placeholder="0"
            />
            {errors.protein_g && (
              <p className="text-red-500 text-sm mt-1">{errors.protein_g}</p>
            )}
          </div>

          {/* Carbs */}
          <div>
            <label htmlFor="carbs_g" className="block text-iron-gray text-xs uppercase mb-2">
              Carbs (g)
            </label>
            <input
              id="carbs_g"
              name="carbs_g"
              type="number"
              min="0"
              step="0.1"
              value={formData.carbs_g}
              onChange={handleChange}
              className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
              placeholder="0"
            />
            {errors.carbs_g && (
              <p className="text-red-500 text-sm mt-1">{errors.carbs_g}</p>
            )}
          </div>

          {/* Fat */}
          <div>
            <label htmlFor="fat_g" className="block text-iron-gray text-xs uppercase mb-2">
              Fat (g)
            </label>
            <input
              id="fat_g"
              name="fat_g"
              type="number"
              min="0"
              step="0.1"
              value={formData.fat_g}
              onChange={handleChange}
              className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
              placeholder="0"
            />
            {errors.fat_g && (
              <p className="text-red-500 text-sm mt-1">{errors.fat_g}</p>
            )}
          </div>

          {/* Fiber */}
          <div>
            <label htmlFor="fiber_g" className="block text-iron-gray text-xs uppercase mb-2">
              Fiber (g)
            </label>
            <input
              id="fiber_g"
              name="fiber_g"
              type="number"
              min="0"
              step="0.1"
              value={formData.fiber_g}
              onChange={handleChange}
              className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
              placeholder="0"
            />
            {errors.fiber_g && (
              <p className="text-red-500 text-sm mt-1">{errors.fiber_g}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-iron-gray text-xs uppercase mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
          placeholder="Any additional notes about this meal..."
        />
        {errors.notes && (
          <p className="text-red-500 text-sm mt-1">{errors.notes}</p>
        )}
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-500/20 border border-green-500 p-3 text-green-500">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-500/20 border border-red-500 p-3 text-red-500">
          {errorMessage}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading || isSubmitting}
          className="flex-1 bg-iron-orange text-iron-black font-heading py-3 uppercase tracking-wider hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {isLoading || isSubmitting ? 'Saving...' : 'Save Meal'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-iron-gray text-iron-white font-heading py-3 uppercase tracking-wider hover:bg-iron-gray/20 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default MealLogForm;