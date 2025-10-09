"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SpecialistSelection } from '@/components/Consultation/SpecialistSelection';
import { ConsultationChat } from '@/components/Consultation/ConsultationChat';
import { StructuredDataPreview } from '@/components/Consultation/StructuredDataPreview';
import { startConsultation, checkActiveSession } from '@/lib/api/consultation';
import { useToast } from '@/hooks/use-toast';
import type { SpecialistType, ConsultationSession, ConsultationSummary } from '@/types/consultation';

type ConsultationStep = 'select' | 'chat' | 'review';

export default function ConsultationPage() {
  const [step, setStep] = useState<ConsultationStep>('select');
  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [specialist, setSpecialist] = useState<SpecialistType | null>(null);
  const [summary, setSummary] = useState<ConsultationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Check for existing active consultation session on mount
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const data = await checkActiveSession();
        if (data.has_active_session) {
          setHasActiveSession(true);
          toast({
            title: 'Active Consultation Found',
            description: 'You have an active consultation in progress. Please complete it before starting a new one.',
          });
        }
      } catch (error) {
        console.error('Failed to check for active session:', error);
      }
    }

    checkExistingSession();
  }, [toast]);

  async function handleSpecialistSelect(specialistType: SpecialistType) {
    // Prevent starting new consultation if one is active
    if (hasActiveSession) {
      toast({
        title: 'Cannot Start New Consultation',
        description: 'You have an active consultation in progress. Please complete or cancel it first.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const consultationSession = await startConsultation({ specialist_type: specialistType });
      setSession(consultationSession);
      setSpecialist(specialistType);
      setStep('chat');

      toast({
        title: 'Consultation Started',
        description: `Let's begin your consultation with the ${specialistType.replace('_', ' ')}`,
      });
    } catch (error) {
      console.error('Error starting consultation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start consultation. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleConsultationComplete(consultationSummary: ConsultationSummary, programId?: string) {
    setSummary(consultationSummary);

    if (programId) {
      // If program was generated, redirect to program page
      toast({
        title: 'Success!',
        description: 'Your personalized program has been created.',
      });
      router.push(`/programs/${programId}`);
    } else {
      // Show summary review
      setStep('review');
    }
  }

  function handleReviewConfirm() {
    toast({
      title: 'Consultation Complete!',
      description: 'Your profile has been updated with the information from your consultation.',
    });
    router.push('/dashboard');
  }

  function handleEditCategory(category: string, data: any) {
    // TODO: Implement category editing
    toast({
      title: 'Edit Feature',
      description: 'Category editing will be available soon.',
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 pb-24">
        {step === 'select' && (
          <SpecialistSelection
            onSelect={handleSpecialistSelect}
            isLoading={isLoading}
          />
        )}

        {step === 'chat' && session && specialist && (
          <ConsultationChat
            session={session}
            specialistType={specialist}
            onComplete={handleConsultationComplete}
          />
        )}

        {step === 'review' && summary && (
          <div className="max-w-4xl mx-auto">
            <StructuredDataPreview
              summary={summary}
              onEdit={handleEditCategory}
              onConfirm={handleReviewConfirm}
            />
          </div>
        )}
      </div>
    </div>
  );
}
