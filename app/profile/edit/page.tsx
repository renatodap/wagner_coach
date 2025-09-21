'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { Profile, ExperienceLevel } from '@/types/profile';

const focusAreaOptions = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'strength', label: 'Strength Training' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'mental_health', label: 'Mental Health' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'sports_performance', label: 'Sports Performance' },
  { value: 'rehabilitation', label: 'Rehabilitation' },
  { value: 'general_fitness', label: 'General Fitness' },
];

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Partial<Profile>>({
    full_name: '',
    age: undefined,
    location: '',
    about_me: '',
    fitness_goals: '',
    experience_level: 'beginner' as ExperienceLevel,
    weekly_hours: 3,
    primary_goal: '',
    focus_areas: [],
    health_conditions: '',
    dietary_preferences: '',
    equipment_access: '',
    preferred_workout_time: '',
    strengths: '',
    areas_for_improvement: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/profile');

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Profile load error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      toast({
        title: 'Success',
        description: 'Your profile has been updated',
      });

      router.push('/profile');
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFocusAreaChange = (area: string, checked: boolean) => {
    setProfile(prev => ({
      ...prev,
      focus_areas: checked
        ? [...(prev.focus_areas || []), area]
        : (prev.focus_areas || []).filter(a => a !== area)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/profile')}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>
        <h1 className="text-3xl font-bold">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="13"
                  max="120"
                  value={profile.age || ''}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || undefined })}
                  placeholder="Enter your age"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profile.location || ''}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="City, Country"
                />
              </div>

              <div>
                <Label htmlFor="preferred_workout_time">Preferred Workout Time</Label>
                <Select
                  value={profile.preferred_workout_time || ''}
                  onValueChange={(value) => setProfile({ ...profile, preferred_workout_time: value })}
                >
                  <SelectTrigger id="preferred_workout_time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="early_morning">Early Morning (5-7 AM)</SelectItem>
                    <SelectItem value="morning">Morning (7-10 AM)</SelectItem>
                    <SelectItem value="midday">Midday (10 AM-2 PM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (2-5 PM)</SelectItem>
                    <SelectItem value="evening">Evening (5-8 PM)</SelectItem>
                    <SelectItem value="night">Night (8-11 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="about_me">About Me</Label>
              <Textarea
                id="about_me"
                value={profile.about_me || ''}
                onChange={(e) => setProfile({ ...profile, about_me: e.target.value })}
                placeholder="Tell us a bit about yourself..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Fitness Goals & Experience */}
        <Card>
          <CardHeader>
            <CardTitle>Fitness Goals & Experience</CardTitle>
            <CardDescription>Help us personalize your coaching experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience_level">Experience Level</Label>
                <Select
                  value={profile.experience_level || 'beginner'}
                  onValueChange={(value) => setProfile({ ...profile, experience_level: value as ExperienceLevel })}
                >
                  <SelectTrigger id="experience_level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="weekly_hours">Weekly Training Hours</Label>
                <Input
                  id="weekly_hours"
                  type="number"
                  min="0"
                  max="40"
                  step="0.5"
                  value={profile.weekly_hours || ''}
                  onChange={(e) => setProfile({ ...profile, weekly_hours: parseFloat(e.target.value) || 0 })}
                  placeholder="Hours per week"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="primary_goal">Primary Goal</Label>
              <Textarea
                id="primary_goal"
                value={profile.primary_goal || ''}
                onChange={(e) => setProfile({ ...profile, primary_goal: e.target.value })}
                placeholder="What's your main fitness goal? Be specific..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="fitness_goals">Additional Fitness Goals</Label>
              <Textarea
                id="fitness_goals"
                value={profile.fitness_goals || ''}
                onChange={(e) => setProfile({ ...profile, fitness_goals: e.target.value })}
                placeholder="List any other fitness goals you have..."
                rows={3}
              />
            </div>

            <div>
              <Label>Focus Areas</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {focusAreaOptions.map((area) => (
                  <div key={area.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={area.value}
                      checked={(profile.focus_areas || []).includes(area.value)}
                      onCheckedChange={(checked) => handleFocusAreaChange(area.value, checked as boolean)}
                    />
                    <Label
                      htmlFor={area.value}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {area.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Preferences</CardTitle>
            <CardDescription>Additional information to optimize your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="equipment_access">Equipment Access</Label>
              <Textarea
                id="equipment_access"
                value={profile.equipment_access || ''}
                onChange={(e) => setProfile({ ...profile, equipment_access: e.target.value })}
                placeholder="What equipment do you have access to? (gym, home equipment, etc.)"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="dietary_preferences">Dietary Preferences</Label>
              <Textarea
                id="dietary_preferences"
                value={profile.dietary_preferences || ''}
                onChange={(e) => setProfile({ ...profile, dietary_preferences: e.target.value })}
                placeholder="Any dietary restrictions or preferences? (vegan, keto, allergies, etc.)"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="health_conditions">Health Conditions</Label>
              <Textarea
                id="health_conditions"
                value={profile.health_conditions || ''}
                onChange={(e) => setProfile({ ...profile, health_conditions: e.target.value })}
                placeholder="Any injuries or health conditions we should know about?"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Strengths & Improvements */}
        <Card>
          <CardHeader>
            <CardTitle>Self Assessment</CardTitle>
            <CardDescription>Help the AI coach understand you better</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="strengths">Your Strengths</Label>
              <Textarea
                id="strengths"
                value={profile.strengths || ''}
                onChange={(e) => setProfile({ ...profile, strengths: e.target.value })}
                placeholder="What are you good at? What comes naturally to you?"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="areas_for_improvement">Areas for Improvement</Label>
              <Textarea
                id="areas_for_improvement"
                value={profile.areas_for_improvement || ''}
                onChange={(e) => setProfile({ ...profile, areas_for_improvement: e.target.value })}
                placeholder="What would you like to work on or improve?"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/profile')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </main>
  );
}