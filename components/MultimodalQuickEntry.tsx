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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/quick-entry/multimodal`, {
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
    <div className="min-h-screen bg-iron-black pb-24">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-10 bg-iron-black/80 backdrop-blur-lg border-b border-iron-gray">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-iron-gray/20 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-iron-gray" />
            </button>
            <div>
              <h1 className="text-2xl font-heading font-bold text-iron-orange">
                QUICK ENTRY
              </h1>
              <p className="text-sm text-iron-gray">
                Text • Image • Voice
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Text Input */}
        <div className="bg-iron-black rounded-2xl shadow-lg p-6 border border-iron-gray">
          <label className="block text-sm font-semibold text-iron-orange mb-3">
            📝 What did you do?
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g., 'Just had grilled chicken with rice and broccoli' or 'Ran 5 miles this morning'"
            className="w-full px-4 py-3 bg-iron-black border border-iron-gray text-iron-white rounded-xl focus:ring-2 focus:ring-iron-orange focus:border-iron-orange resize-none placeholder:text-iron-gray"
            rows={4}
          />
        </div>

        {/* Image Upload */}
        <div className="bg-iron-black rounded-2xl shadow-lg p-6 border border-iron-gray">
          <label className="block text-sm font-semibold text-iron-orange mb-3">
            📸 Add Photo (optional)
          </label>

          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-xl border border-iron-gray"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors"
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
                className="w-full py-4 px-6 bg-iron-orange text-iron-black rounded-xl font-heading font-semibold shadow-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <Camera className="w-5 h-5" />
                Take or Upload Photo
              </button>
            </div>
          )}
        </div>

        {/* Voice Recording */}
        <div className="bg-iron-black rounded-2xl shadow-lg p-6 border border-iron-gray">
          <label className="block text-sm font-semibold text-iron-orange mb-3">
            🎤 Voice Note (optional)
          </label>

          {audioBlob ? (
            <div className="flex items-center justify-between p-4 bg-green-900/20 rounded-xl border border-green-600">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-400">
                  Voice note recorded
                </span>
              </div>
              <button
                onClick={removeAudio}
                className="p-2 hover:bg-red-900/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ) : (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-full py-4 px-6 rounded-xl font-heading font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                  : 'bg-iron-orange text-iron-black hover:bg-orange-600'
              }`}
            >
              <Mic className="w-5 h-5" />
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-xl p-4">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Result Display */}
        {result && result.success && (
          <div className="bg-green-900/20 border border-green-600 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <h3 className="text-lg font-heading font-bold text-green-400 uppercase">
                Logged Successfully!
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-iron-orange">Type:</span>
                <span className="px-3 py-1 bg-iron-gray/20 rounded-lg text-sm font-medium capitalize text-iron-white">
                  {result.entry_type}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-iron-orange">Confidence:</span>
                <span className="text-sm text-iron-gray">
                  {(result.confidence * 100).toFixed(0)}%
                </span>
              </div>

              {result.suggestions && result.suggestions.length > 0 && (
                <div className="mt-4 p-4 bg-iron-gray/10 rounded-lg border border-iron-gray">
                  <p className="text-sm font-semibold text-iron-orange mb-2">💡 Tips:</p>
                  <ul className="space-y-1">
                    {result.suggestions.map((tip, idx) => (
                      <li key={idx} className="text-sm text-iron-gray">• {tip}</li>
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
          className="w-full py-4 px-6 bg-iron-orange text-iron-black rounded-xl font-heading font-bold text-lg shadow-lg hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-wider"
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
        <div className="bg-iron-gray/20 border border-iron-gray rounded-xl p-4">
          <p className="text-sm text-iron-gray">
            <strong className="text-iron-orange">✨ Revolutionary AI:</strong> Your entry will be analyzed, classified, and vectorized for semantic search. The AI coach can find and reference this data in future conversations!
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
