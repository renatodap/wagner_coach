import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ProfileUpdate, ProfileValidation, isValidExperienceLevel } from '@/types/profile';
import { ValidationError } from '@/types/onboarding';
import DOMPurify from 'isomorphic-dompurify';

// Validation helper
function validateProfileData(data: any): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Validate experience level
  if (data.experience_level && !isValidExperienceLevel(data.experience_level)) {
    errors.push({
      field: 'experience_level',
      message: 'Invalid experience level. Must be beginner, intermediate, or advanced.'
    });
  }

  // Validate age
  if (data.age !== undefined) {
    if (data.age < 13 || data.age > 120) {
      errors.push({
        field: 'age',
        message: 'Age must be between 13 and 120'
      });
    }
  }

  // Validate height
  if (data.height !== undefined) {
    if (data.height < ProfileValidation.height.min || data.height > ProfileValidation.height.max) {
      errors.push({
        field: 'height',
        message: `Height must be between ${ProfileValidation.height.min} and ${ProfileValidation.height.max} cm`
      });
    }
  }

  // Validate weight
  if (data.weight !== undefined) {
    if (data.weight < ProfileValidation.weight.min || data.weight > ProfileValidation.weight.max) {
      errors.push({
        field: 'weight',
        message: `Weight must be between ${ProfileValidation.weight.min} and ${ProfileValidation.weight.max} kg`
      });
    }
  }

  // Validate arrays
  const arrayFields = ['fitness_goals', 'motivation_factors', 'preferred_activities', 'physical_limitations', 'available_equipment', 'dietary_preferences'];

  for (const field of arrayFields) {
    if (data[field] && Array.isArray(data[field])) {
      if (data[field].length > ProfileValidation.maxArrayLength) {
        errors.push({
          field,
          message: `Too many items in ${field}. Maximum is ${ProfileValidation.maxArrayLength}`
        });
      }
    }
  }

  // Validate text lengths
  if (data.about_me && data.about_me.length > ProfileValidation.maxTextLength) {
    errors.push({
      field: 'about_me',
      message: `About me text is too long. Maximum is ${ProfileValidation.maxTextLength} characters`
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sanitize string inputs
function sanitizeInput(data: any): any {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Remove HTML and scripts
      sanitized[key] = DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
    } else if (Array.isArray(value)) {
      // Sanitize array of strings
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? DOMPurify.sanitize(item, { ALLOWED_TAGS: [] }) : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if trying to update a different user's profile
    if (body.id && body.id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Sanitize input
    const sanitizedData = sanitizeInput(body);

    // Validate data
    const validation = validateProfileData(sanitizedData);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    let profileData;

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('profiles')
        .update(sanitizedData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        return NextResponse.json(
          { error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }

      profileData = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          ...sanitizedData
        })
        .select()
        .single();

      if (error) {
        console.error('Profile create error:', error);
        return NextResponse.json(
          { error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }

      profileData = data;
    }

    // Trigger embedding generation if about_me was updated
    if (sanitizedData.about_me) {
      try {
        // Fire and forget - don't wait for embedding generation
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/profile/embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || ''
          },
          body: JSON.stringify({ userId: user.id })
        }).catch(err => {
          console.error('Failed to trigger embedding generation:', err);
        });
      } catch (err) {
        // Log but don't fail the request
        console.error('Embedding generation trigger error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Profile save error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}