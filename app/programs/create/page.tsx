'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Sparkles, ArrowRight } from 'lucide-react';

interface Question {
  question: string;
  options: string[];
}

interface Answer {
  question: string;
  answer: string;
}

export default function CreateProgramPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startProgramGeneration();
  }, []);

  async function startProgramGeneration() {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/programs/generate/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to start program generation');
      }

      const data = await response.json();
      setSessionId(data.session_id);
      setQuestions(data.questions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to start program generation');
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswerSelect(answer: string) {
    const currentQuestion = questions[currentQuestionIndex];

    // Add answer to list
    const newAnswers = [
      ...answers,
      {
        question: currentQuestion.question,
        answer: answer,
      },
    ];
    setAnswers(newAnswers);

    // If this is the last question, submit all answers
    if (currentQuestionIndex === questions.length - 1) {
      await submitAnswers(newAnswers);
    } else {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }

  async function submitAnswers(finalAnswers: Answer[]) {
    try {
      setGenerating(true);
      setError(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || !sessionId) {
        throw new Error('Session expired');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/programs/generate/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          answers: finalAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate program');
      }

      const data = await response.json();

      // Redirect to programs page to see the new program
      router.push('/programs');
    } catch (err: any) {
      setError(err.message || 'Failed to generate program');
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-iron-black flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-iron-orange animate-spin mb-4" />
        <p className="text-iron-white">Analyzing your profile...</p>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="min-h-screen bg-iron-black flex flex-col items-center justify-center p-4">
        <Sparkles className="w-16 h-16 text-iron-orange mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-iron-white mb-2">Creating Your Program</h2>
        <p className="text-iron-gray text-center max-w-md">
          Our AI is generating a personalized 12-week fitness and nutrition program based on your profile and answers. This may take a minute...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-iron-black flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-iron-black border-2 border-red-600 p-6">
          <h2 className="text-xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-iron-white mb-6">{error}</p>
          <button
            onClick={() => router.push('/programs')}
            className="w-full bg-iron-gray hover:bg-iron-orange text-white font-bold py-3 px-6 transition-colors"
          >
            GO BACK
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-iron-black flex items-center justify-center p-4">
        <div className="text-iron-white">No questions available</div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-iron-black p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-iron-gray">Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span className="text-sm text-iron-gray">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-iron-gray/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-iron-orange transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <div className="flex items-start gap-3 mb-6">
            <Sparkles className="w-8 h-8 text-iron-orange flex-shrink-0 mt-1" />
            <h2 className="text-2xl font-bold text-iron-white">
              {currentQuestion.question}
            </h2>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              className="w-full text-left p-6 bg-iron-black border-2 border-iron-gray hover:border-iron-orange text-iron-white transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{option}</span>
                <ArrowRight className="w-5 h-5 text-iron-gray group-hover:text-iron-orange transition-colors" />
              </div>
            </button>
          ))}
        </div>

        {/* Previous Answers Summary */}
        {answers.length > 0 && (
          <div className="mt-12 pt-8 border-t border-iron-gray">
            <h3 className="text-sm font-bold text-iron-gray mb-4">YOUR ANSWERS</h3>
            <div className="space-y-3">
              {answers.map((answer, index) => (
                <div key={index} className="text-sm">
                  <p className="text-iron-gray">{answer.question}</p>
                  <p className="text-iron-white font-bold">{answer.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
