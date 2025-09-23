'use client';

import React, { useState, useEffect } from 'react';
import { AIAnalysisProps, AIAnalysisResult } from '@/types/nutrition';
import { Loader2, AlertCircle, CheckCircle, RotateCw, Edit3 } from 'lucide-react';

export default function AIAnalysis({ imageData, onAnalysisComplete, onError }: AIAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Analyzing image...');
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const steps = [
    { id: 1, name: 'Analyzing image', duration: 2000 },
    { id: 2, name: 'Identifying foods', duration: 3000 },
    { id: 3, name: 'Calculating nutrition', duration: 2000 },
  ];

  useEffect(() => {
    analyzeImage();
  }, [imageData]);

  const analyzeImage = async (retry = 0) => {
    setIsAnalyzing(true);
    setError(null);
    setRetryCount(retry);

    try {
      // Simulate progress steps
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i].name);
        setProgress((i + 1) * 33);
        await new Promise(resolve => setTimeout(resolve, steps[i].duration / 3));
      }

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Analysis timeout')), 30000);
      });

      // Create fetch promise with retry logic
      const fetchPromise = fetchWithRetry('/api/nutrition/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData }),
      }, retry);

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setResult(data.data);
        onAnalysisComplete(data.data);
        setProgress(100);
      } else {
        throw new Error(data.error || 'No data received');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      onError(errorMessage);

      // Auto-retry with exponential backoff
      if (retry < 2 && !errorMessage.includes('timeout')) {
        const delay = Math.pow(2, retry) * 1000;
        setTimeout(() => analyzeImage(retry + 1), delay);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchWithRetry = async (url: string, options: RequestInit, retryCount: number): Promise<Response> => {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retryCount + 1);
      }
      throw err;
    }
  };

  const handleReanalyze = () => {
    setResult(null);
    setError(null);
    setProgress(0);
    analyzeImage();
  };

  const handleManualEntry = () => {
    onError('Manual entry requested');
  };

  return (
    <div className="ai-analysis-container">
      {isAnalyzing && !error && (
        <div className="text-center py-8">
          <div className="relative inline-flex">
            <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
            <span className="sr-only" data-testid="loading-animation">Analyzing...</span>
          </div>

          <div className="mt-6 space-y-3">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center justify-center space-x-3">
                {currentStep === step.name ? (
                  <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
                ) : progress >= step.id * 33 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                )}
                <span className={`text-sm ${
                  currentStep === step.name ? 'text-blue-600 font-medium' :
                  progress >= step.id * 33 ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Estimated time: {Math.max(0, 10 - Math.floor(progress / 10))} seconds
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Analysis Failed</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              {retryCount > 0 && (
                <p className="mt-1 text-xs text-red-600">Retry attempt {retryCount}/2</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={handleReanalyze}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              aria-label="Reanalyze"
            >
              <RotateCw className="inline mr-1" size={14} />
              Try Again
            </button>
            <button
              onClick={handleManualEntry}
              className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              aria-label="Manual Entry"
            >
              <Edit3 className="inline mr-1" size={14} />
              Manual Entry
            </button>
          </div>
        </div>
      )}

      {result && !error && (
        <div className="analysis-results">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="ml-2 text-sm font-medium text-green-800">Analysis Complete</h3>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="text-lg font-semibold mb-3">{result.suggestedMealName}</h4>

            <div className="space-y-3" data-testid="food-items-list">
              {result.foodItems.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 bg-gray-50 rounded ${
                    item.confidence < 0.5 ? 'low-confidence border-l-4 border-yellow-400' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.calories} cal</p>
                    <p className="text-xs text-gray-500">{Math.round(item.confidence * 100)}% confident</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <h5 className="font-medium mb-2">Total Nutrition</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Calories:</span>
                  <span className="font-medium">{result.totalNutrition.calories} calories</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Protein:</span>
                  <span className="font-medium">{result.totalNutrition.protein_g}g protein</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Carbs:</span>
                  <span className="font-medium">{result.totalNutrition.carbs_g}g carbs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fat:</span>
                  <span className="font-medium">{result.totalNutrition.fat_g}g fat</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleReanalyze}
              className="mt-4 w-full px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
              aria-label="Reanalyze"
            >
              <RotateCw className="inline mr-1" size={14} />
              Reanalyze
            </button>
          </div>
        </div>
      )}
    </div>
  );
}