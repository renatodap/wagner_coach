'use client';

/**
 * REVOLUTIONARY MULTIMODAL QUICK ENTRY
 *
 * Allows users to log fitness data via:
 * - 📝 Text (type anything)
 * - 📸 Images (meal photos, workout screenshots)
 * - 🎤 Voice (speak your log)
 * - 📄 PDFs (nutrition labels, meal plans)
 *
 * All data is automatically:
 * 1. Classified by AI (meal, workout, activity, note)
 * 2. Vectorized for semantic search
 * 3. Stored in multimodal embeddings database
 * 4. Searchable by AI coach for ultra-personalized responses
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Camera,
  Mic,
  FileText,
  Send,
  X,
  CheckCircle,
  Loader2,
  ChevronLeft,
  Image as ImageIcon
} from 'lucide-react';
import BottomNavigation from '@/app/components/BottomNavigation';

interface QuickEntryResponse {
  success: boolean;
  entry_type: string;
  confidence: number;
  data: any;
  entry_id?: string;
  suggestions?: string[];
  extracted_text?: string;
  error?: string;
}

export default function MultimodalQuickEntry() {
  const router = useRouter();
  const supabase = createClient();

  // State
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<QuickEntryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Image Upload
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const removeAudio = () => {
    setAudioBlob(null);
  };

  // Submit
  const handleSubmit = async () => {
    if (!text && !selectedImage && !audioBlob) {
      setError('Please add text, image, or voice note');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Create FormData for multimodal upload
      const formData = new FormData();

      if (text) {
        formData.append('text', text);
      }

      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      if (audioBlob) {
        formData.append('audio', audioBlob, 'voice_note.webm');
      }

      // Send to backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/quick-entry/multimodal`, {
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

      const data: QuickEntryResponse = await response.json();
      setResult(data);

      // Clear form on success
      if (data.success) {
        setText('');
        removeImage();
        removeAudio();
      }

    } catch (err: any) {
      console.error('Error submitting entry:', err);
      setError(err.message || 'Failed to process entry');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-24">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Quick Entry
              </h1>
              <p className="text-sm text-gray-500">
                Text • Image • Voice
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Text Input */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            📝 What did you do?
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g., 'Just had grilled chicken with rice and broccoli' or 'Ran 5 miles this morning'"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
          />
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            📸 Add Photo (optional)
          </label>

          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-xl"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Take or Upload Photo
              </button>
            </div>
          )}
        </div>

        {/* Voice Recording */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            🎤 Voice Note (optional)
          </label>

          {audioBlob ? (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Voice note recorded
                </span>
              </div>
              <button
                onClick={removeAudio}
                className="p-2 hover:bg-red-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          ) : (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-full py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              }`}
            >
              <Mic className="w-5 h-5" />
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Result Display */}
        {result && result.success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-bold text-green-800">
                Logged Successfully!
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Type:</span>
                <span className="px-3 py-1 bg-white rounded-lg text-sm font-medium capitalize">
                  {result.entry_type}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Confidence:</span>
                <span className="text-sm text-gray-600">
                  {(result.confidence * 100).toFixed(0)}%
                </span>
              </div>

              {result.suggestions && result.suggestions.length > 0 && (
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 mb-2">💡 Tips:</p>
                  <ul className="space-y-1">
                    {result.suggestions.map((tip, idx) => (
                      <li key={idx} className="text-sm text-gray-600">• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isProcessing || (!text && !selectedImage && !audioBlob)}
          className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing with AI...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Log Entry
            </>
          )}
        </button>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong>✨ Revolutionary AI:</strong> Your entry will be analyzed, classified, and vectorized for semantic search. The AI coach can find and reference this data in future conversations!
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
