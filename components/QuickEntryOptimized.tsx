'use client';

/**
 * Ultra-Optimized Quick Entry Component
 *
 * Handles ALL input modalities:
 * - Text input
 * - Camera/Photo capture
 * - File upload (images, PDFs)
 * - Voice recording (Web Speech API)
 *
 * Uses 100% FREE AI models on backend
 */

import React, { useState, useRef } from 'react';
import { Camera, Mic, Upload, FileText, Send, X, Check, Loader2, Image as ImageIcon, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import QuickEntryPreview from './quick-entry/QuickEntryPreview';
import { QuickEntryPreviewResponse } from './quick-entry/types';

export default function QuickEntryOptimized() {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [previewData, setPreviewData] = useState<QuickEntryPreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const supabase = createClient();

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  // Start voice recording
  const startVoiceRecording = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError('Voice recognition not supported in this browser');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(`Voice input error: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Voice recording error:', err);
      setError('Failed to start voice recording');
    }
  };

  // Stop voice recording
  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Submit entry for preview
  const handleSubmit = async () => {
    if (!text && !selectedFile) {
      setError('Please enter text or select a file');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setPreviewData(null);
    setSavedEntryId(null);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('You must be logged in');
        setIsProcessing(false);
        return;
      }

      // Build form data
      const formData = new FormData();
      if (text) formData.append('text', text);
      if (selectedFile) {
        // Determine field name based on file type
        if (selectedFile.type.startsWith('image/')) {
          formData.append('image', selectedFile);
        } else if (selectedFile.type === 'application/pdf') {
          formData.append('pdf', selectedFile);
        } else if (selectedFile.type.startsWith('audio/')) {
          formData.append('audio', selectedFile);
        }
      }

      // Call backend API
      const response = await fetch('http://localhost:8000/api/v1/quick-entry/multimodal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process entry');
      }

      const data: QuickEntryPreviewResponse = await response.json();
      setPreviewData(data);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process entry');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle save from preview
  const handleSave = async (editedData: any) => {
    // For now, just mark as saved since backend already saved it
    // TODO: Implement actual save endpoint if preview-only mode is added
    setSavedEntryId('saved');

    // Clear form
    setText('');
    setSelectedFile(null);
    setPreviewUrl(null);

    // Show success for 3 seconds then clear
    setTimeout(() => {
      setPreviewData(null);
      setSavedEntryId(null);
    }, 3000);
  };

  // Handle edit from preview
  const handleEdit = () => {
    // Return to edit mode - keep the text and preview data
    setPreviewData(null);
  };

  // Handle cancel from preview
  const handleCancel = () => {
    setPreviewData(null);
    setText('');
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <Zap className="w-8 h-8 text-orange-500" />
          Quick Entry
        </h2>
        <p className="text-gray-600">
          Type, speak, or upload anything - AI will understand and save it
        </p>
      </div>

      {/* Main Input Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        {/* Text Input */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Examples:
• 'Grilled chicken salad 450 calories'
• 'Ran 5 miles in 40 minutes'
• 'Bench press 4x8 at 185lbs'
• 'Feeling motivated today!'
• 'Weight 175.2 lbs'"
          className="w-full p-4 border-2 border-gray-200 rounded-lg mb-4 min-h-[140px] resize-none focus:border-orange-500 focus:outline-none transition-colors text-gray-800 placeholder-gray-400"
          disabled={isProcessing}
        />

        {/* Input Mode Buttons */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Camera */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            type="button"
          >
            <Camera className="w-5 h-5" />
            Camera
          </button>

          {/* Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            type="button"
          >
            <Upload className="w-5 h-5" />
            Upload
          </button>

          {/* Voice */}
          {!isRecording ? (
            <button
              onClick={startVoiceRecording}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              type="button"
            >
              <Mic className="w-5 h-5" />
              Voice
            </button>
          ) : (
            <button
              onClick={stopVoiceRecording}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors animate-pulse font-medium"
              type="button"
            >
              <Mic className="w-5 h-5" />
              Recording...
            </button>
          )}
        </div>

        {/* File Inputs (Hidden) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />

        {/* File Preview */}
        {selectedFile && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded" />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={(!text && !selectedFile) || isProcessing}
          className="w-full px-6 py-4 bg-orange-500 text-white rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
          type="button"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Processing with AI...
            </>
          ) : (
            <>
              <Send className="w-6 h-6" />
              Analyze & Save
            </>
          )}
        </button>
      </div>

      {/* Preview Display */}
      {previewData && (
        <QuickEntryPreview
          data={previewData}
          onSave={handleSave}
          onEdit={handleEdit}
          onCancel={handleCancel}
        />
      )}

      {/* Success Message */}
      {savedEntryId && (
        <div className="p-6 rounded-xl border-2 shadow-lg bg-green-50 border-green-200">
          <div className="flex items-center gap-4">
            <Check className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-xl font-bold text-green-900">Saved Successfully!</h3>
              <p className="text-sm text-green-700">Your entry has been recorded.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
