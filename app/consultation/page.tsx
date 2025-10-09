"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SpecialistSelection } from '@/components/Consultation/SpecialistSelection';
import { ConsultationChat } from '@/components/Consultation/ConsultationChat';
import { StructuredDataPreview } from '@/components/Consultation/StructuredDataPreview';
import { startConsultation, checkActiveSession } from '@/lib/api/consultation';
import { useToast } from '@/hooks/use-toast';
import { SPECIALISTS } from '@/types/consultation';
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
        if (data.has_active_session && data.session) {
          setHasActiveSession(true);
          setSession(data.session);
          setSpecialist(data.session.specialist_type);
          toast({
            title: 'Active Consultation Found',
            description: 'You can resume your consultation or start a new one.',
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
    <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900">
      <div className="max-w-6xl mx-auto p-4 pb-24">
        {/* Active Session Resume Card */}
        {step === 'select' && hasActiveSession && session && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-orange/30 p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">{specialist ? SPECIALISTS[specialist].icon : '🎯'}</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Resume Your Consultation
                  </h2>
                  <p className="text-iron-gray mb-4">
                    You have an active {specialist ? SPECIALISTS[specialist].name : 'consultation'} session in progress.
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-iron-gray">Progress</span>
                      <span className="font-medium text-white">{session.progress_percentage}%</span>
                    </div>
                    <div className="h-2 bg-iron-gray/20 overflow-hidden">
                      <div
                        className="h-full bg-iron-orange transition-all duration-300"
                        style={{ width: `${session.progress_percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-iron-gray capitalize">
                      Stage: {session.conversation_stage.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('chat')}
                      className="flex-1 bg-iron-orange hover:bg-iron-orange/90 text-white font-semibold py-3 px-6 transition-colors"
                    >
                      Resume Consultation
                    </button>
                    <button
                      onClick={() => {
                        setHasActiveSession(false);
                        setSession(null);
                        setSpecialist(null);
                      }}
                      className="px-4 py-3 text-iron-gray hover:text-white transition-colors"
                    >
                      Start New
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'select' && !hasActiveSession && (
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
