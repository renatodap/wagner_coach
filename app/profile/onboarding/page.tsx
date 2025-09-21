'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { BasicInfoStep } from '@/components/profile/steps/BasicInfoStep';
import { GoalsStep } from '@/components/profile/steps/GoalsStep';
import { PreferencesStep } from '@/components/profile/steps/PreferencesStep';
import { EquipmentStep } from '@/components/profile/steps/EquipmentStep';
import { PersonalizationStep } from '@/components/profile/steps/PersonalizationStep';
import { ProfileUpdate, UserGoalInsert } from '@/types/profile';
import { useToast } from '@/components/ui/use-toast';

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<Partial<ProfileUpdate>>({});
  const [goals, setGoals] = useState<UserGoalInsert[]>([]);

  const handleComplete = async (data: ProfileUpdate & { goals: UserGoalInsert[] }) => {
    try {
      // Save profile data
      const profileResponse = await fetch('/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!profileResponse.ok) {
        const error = await profileResponse.json();
        throw new Error(error.error || 'Failed to save profile');
      }

      // Save goals if provided
      if (data.goals && data.goals.length > 0) {
        const goalsResponse = await fetch('/api/profile/goals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ goals: data.goals }),
        });

        if (!goalsResponse.ok) {
          const error = await goalsResponse.json();
          console.error('Failed to save goals:', error);
          // Don't fail the whole onboarding if goals fail
        }
      }

      // Mark onboarding as complete
      await fetch('/api/profile/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      toast({
        title: 'Welcome to Wagner Coach!',
        description: 'Your profile has been set up successfully.',
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete onboarding',
        variant: 'destructive',
      });
      throw error; // Re-throw to let ProfileForm handle it
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to Wagner Coach
          </h1>
          <p className="text-lg text-gray-600">
            Let's personalize your fitness journey (5-7 minutes)
          </p>
        </div>

        <ProfileForm
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          onComplete={handleComplete}
          initialData={profileData}
        >
          <BasicInfoStep
            data={profileData}
            onChange={(updates) => setProfileData({ ...profileData, ...updates })}
            onValidate={() => ({ isValid: true, errors: [] })}
            isActive={currentStep === 1}
          />

          <GoalsStep
            data={goals}
            onChange={setGoals}
            onValidate={() => ({ isValid: true, errors: [] })}
            isActive={currentStep === 2}
          />

          <PreferencesStep
            data={profileData}
            onChange={(updates) => setProfileData({ ...profileData, ...updates })}
            onValidate={() => ({ isValid: true, errors: [] })}
            isActive={currentStep === 3}
          />

          <EquipmentStep
            data={profileData}
            onChange={(updates) => setProfileData({ ...profileData, ...updates })}
            onValidate={() => ({ isValid: true, errors: [] })}
            isActive={currentStep === 4}
          />

          <PersonalizationStep
            data={profileData}
            onChange={(updates) => setProfileData({ ...profileData, ...updates })}
            onValidate={() => ({ isValid: true, errors: [] })}
            isActive={currentStep === 5}
          />
        </ProfileForm>
      </div>
    </div>
  );
}