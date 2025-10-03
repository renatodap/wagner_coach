'use client';

/**
 * ChatGPT-Style Quick Entry Component
 *
 * Features:
 * - Clean ChatGPT-inspired interface
 * - Multi-input support (text, voice, files)
 * - Log type selector (Meal/Workout/Auto-detect)
 * - Confirmation modal before saving
 * - Manual edit capability
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Paperclip,
  Send,
  X,
  Check,
  Loader2,
  ChevronDown,
  Edit3,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  Volume2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

type LogType = 'auto' | 'meal' | 'workout' | 'activity' | 'note' | 'measurement';

interface ProcessedEntry {
  type: string;
  confidence: number;
  data: Record<string, any>;
  suggestions?: string[];
  extracted_text?: string;
}

interface AttachedFile {
  file: File;
  preview?: string;
  type: 'image' | 'audio' | 'pdf' | 'other';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ChatQuickEntry() {
  // State
  const [text, setText] = useState('');
  const [selectedLogType, setSelectedLogType] = useState<LogType>('auto');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [processedEntry, setProcessedEntry] = useState<ProcessedEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================================================
  // FILE HANDLING
  // ============================================================================

  const handleFileSelect = (files: FileList) => {
    const newFiles: AttachedFile[] = [];

    Array.from(files).forEach(file => {
      let fileType: AttachedFile['type'] = 'other';

      if (file.type.startsWith('image/')) {
        fileType = 'image';
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachedFiles(prev => prev.map(f =>
            f.file === file ? { ...f, preview: reader.result as string } : f
          ));
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('audio/')) {
        fileType = 'audio';
      } else if (file.type === 'application/pdf') {
        fileType = 'pdf';
      }

      newFiles.push({ file, type: fileType });
    });

    setAttachedFiles(prev => [...prev, ...newFiles]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ============================================================================
  // VOICE RECORDING
  // ============================================================================

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

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // ============================================================================
  // SUBMIT & PROCESS
  // ============================================================================

  const handleSubmit = async () => {
    if (!text && attachedFiles.length === 0) {
      setError('Please enter text or attach a file');
      return;
    }

    setIsProcessing(true);
    setError(null);

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
      if (selectedLogType !== 'auto') {
        formData.append('manual_type', selectedLogType);
      }

      // Attach files
      attachedFiles.forEach(({ file, type }) => {
        if (type === 'image') {
          formData.append('image', file);
        } else if (type === 'audio') {
          formData.append('audio', file);
        } else if (type === 'pdf') {
          formData.append('pdf', file);
        }
      });

      // Call PREVIEW endpoint (doesn't save yet)
      const response = await fetch('http://localhost:8000/api/v1/quick-entry/preview', {
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

      const data = await response.json();

      // Show confirmation modal
      setProcessedEntry(data);
      setEditedData(data.data);
      setShowConfirmation(true);

    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process entry');
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================================
  // CONFIRM & SAVE
  // ============================================================================

  const handleConfirmAndLog = async () => {
    if (!processedEntry) return;

    setIsSaving(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('You must be logged in');
        setIsSaving(false);
        return;
      }

      // Call CONFIRM endpoint to save
      const response = await fetch('http://localhost:8000/api/v1/quick-entry/confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entry_type: processedEntry.type,
          data: isEditing ? editedData : processedEntry.data,
          original_text: text,
          extracted_text: processedEntry.extracted_text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save entry');
      }

      const result = await response.json();

      // Success! Clear form and close modal
      setText('');
      setAttachedFiles([]);
      setShowConfirmation(false);
      setProcessedEntry(null);
      setIsEditing(false);
      setEditedData({});

      // TODO: Show success toast/notification

    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getLogTypeLabel = (type: LogType) => {
    const labels: Record<LogType, string> = {
      auto: 'Auto-detect',
      meal: 'Meal',
      workout: 'Workout',
      activity: 'Activity',
      note: 'Note',
      measurement: 'Measurement',
    };
    return labels[type];
  };

  const getLogTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      meal: '🍽️',
      workout: '💪',
      activity: '🏃',
      note: '📝',
      measurement: '📊',
      unknown: '❓',
    };
    return icons[type] || '❓';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      meal: 'from-green-600 to-green-500',
      workout: 'from-orange-600 to-orange-500',
      activity: 'from-blue-600 to-blue-500',
      note: 'from-gray-600 to-gray-500',
      measurement: 'from-purple-600 to-purple-500',
    };
    return colors[type] || 'from-gray-600 to-gray-500';
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-col h-screen bg-iron-black">
      {/* Header */}
      <div className="p-4 border-b border-iron-gray">
        <h1 className="text-2xl font-heading text-iron-orange">QUICK ENTRY</h1>
        <p className="text-sm text-iron-gray mt-1">Log anything instantly with AI</p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Placeholder when empty */}
        {!text && attachedFiles.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-iron-gray">
              <p className="text-lg mb-2">What did you do today?</p>
              <p className="text-sm">Type, speak, or attach a photo</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
      </div>

      {/* ChatGPT-Style Input Section */}
      <div className="p-4 border-t border-iron-gray bg-iron-black">
        {/* Attached Files Preview */}
        {attachedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachedFiles.map((attached, index) => (
              <div
                key={index}
                className="relative bg-iron-gray p-2 flex items-center gap-2"
                style={{ borderRadius: '8px' }}
              >
                {attached.type === 'image' && attached.preview ? (
                  <img
                    src={attached.preview}
                    alt="Preview"
                    className="w-12 h-12 object-cover"
                    style={{ borderRadius: '4px' }}
                  />
                ) : attached.type === 'audio' ? (
                  <div className="w-12 h-12 bg-iron-black flex items-center justify-center">
                    <Volume2 className="w-6 h-6 text-iron-orange" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-iron-black flex items-center justify-center">
                    <FileText className="w-6 h-6 text-iron-orange" />
                  </div>
                )}
                <span className="text-xs text-iron-white truncate max-w-[100px]">
                  {attached.file.name}
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 flex items-center justify-center"
                  style={{ borderRadius: '50%' }}
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Container */}
        <div
          className="bg-iron-gray border border-iron-gray flex items-end gap-2 p-2"
          style={{ borderRadius: '24px' }}
        >
          {/* Log Type Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              disabled={isProcessing}
              className="p-2 hover:bg-iron-black/50 transition-colors disabled:opacity-50"
              style={{ borderRadius: '12px' }}
              title="Select log type"
            >
              <div className="flex items-center gap-1">
                <span className="text-lg">{getLogTypeIcon(selectedLogType)}</span>
                <ChevronDown className="w-4 h-4 text-iron-white" />
              </div>
            </button>

            {/* Dropdown Menu */}
            {showTypeDropdown && (
              <div
                className="absolute bottom-full mb-2 left-0 bg-iron-gray border border-iron-gray shadow-xl min-w-[150px]"
                style={{ borderRadius: '12px' }}
              >
                {(['auto', 'meal', 'workout', 'activity', 'note', 'measurement'] as LogType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedLogType(type);
                      setShowTypeDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-iron-black/50 transition-colors flex items-center gap-2 ${
                      selectedLogType === type ? 'bg-iron-orange text-white' : 'text-iron-white'
                    }`}
                  >
                    <span>{getLogTypeIcon(type)}</span>
                    <span className="text-sm">{getLogTypeLabel(type)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* File Attachment */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="p-2 hover:bg-iron-black/50 transition-colors disabled:opacity-50"
            style={{ borderRadius: '12px' }}
            title="Attach file"
          >
            <Paperclip className="w-5 h-5 text-iron-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,audio/*,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          />

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Describe what you ate, did, or how you feel..."
            disabled={isProcessing}
            className="flex-1 bg-transparent text-iron-white placeholder-iron-gray resize-none outline-none max-h-[120px] min-h-[24px] py-2 disabled:opacity-50"
            rows={1}
          />

          {/* Voice Recording */}
          {!isRecording ? (
            <button
              onClick={startVoiceRecording}
              disabled={isProcessing}
              className="p-2 hover:bg-iron-black/50 transition-colors disabled:opacity-50"
              style={{ borderRadius: '12px' }}
              title="Voice input"
            >
              <Mic className="w-5 h-5 text-iron-white" />
            </button>
          ) : (
            <button
              onClick={stopVoiceRecording}
              className="p-2 bg-red-500 animate-pulse"
              style={{ borderRadius: '12px' }}
              title="Stop recording"
            >
              <Mic className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={(!text && attachedFiles.length === 0) || isProcessing}
            className="p-2 bg-iron-orange hover:bg-iron-orange/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: '12px' }}
            title="Submit"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Helper Text */}
        <div className="mt-2 text-xs text-iron-gray text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && processedEntry && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div
            className="bg-iron-black border border-iron-gray max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ borderRadius: '16px' }}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-iron-gray">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(processedEntry.type)} flex items-center justify-center text-2xl`}
                    style={{ borderRadius: '12px' }}
                  >
                    {getLogTypeIcon(processedEntry.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-heading text-iron-orange uppercase">
                      {processedEntry.type} Detected
                    </h2>
                    <p className="text-sm text-iron-gray">
                      Confidence: {(processedEntry.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setProcessedEntry(null);
                    setIsEditing(false);
                  }}
                  className="p-2 hover:bg-iron-gray transition-colors"
                  style={{ borderRadius: '8px' }}
                >
                  <X className="w-5 h-5 text-iron-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Extracted Data */}
              {processedEntry.data && Object.keys(processedEntry.data).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-iron-white mb-3 uppercase tracking-wider">
                    Extracted Information
                  </h3>
                  <div
                    className="bg-iron-gray p-4 space-y-2"
                    style={{ borderRadius: '12px' }}
                  >
                    {Object.entries(isEditing ? editedData : processedEntry.data).map(([key, value]) => {
                      if (typeof value === 'object' && value !== null) {
                        return (
                          <div key={key} className="border-l-2 border-iron-orange pl-3">
                            <p className="text-xs text-iron-gray uppercase">{key.replace(/_/g, ' ')}</p>
                            <pre className="text-sm text-iron-white mt-1 whitespace-pre-wrap">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          </div>
                        );
                      }

                      return (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm text-iron-gray capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={String(value)}
                              onChange={(e) => setEditedData(prev => ({
                                ...prev,
                                [key]: e.target.value
                              }))}
                              className="bg-iron-black text-iron-white px-2 py-1 text-sm border border-iron-gray"
                              style={{ borderRadius: '4px' }}
                            />
                          ) : (
                            <span className="text-sm text-iron-white font-medium">
                              {String(value)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {processedEntry.suggestions && processedEntry.suggestions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-iron-white mb-3 uppercase tracking-wider">
                    💡 Suggestions
                  </h3>
                  <ul className="space-y-2">
                    {processedEntry.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-iron-gray flex items-start gap-2">
                        <span className="text-iron-orange">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Error in modal */}
              {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-500 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-iron-gray flex gap-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                disabled={isSaving}
                className="flex-1 p-3 bg-iron-gray hover:bg-iron-gray/80 text-iron-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ borderRadius: '12px' }}
              >
                <Edit3 className="w-5 h-5" />
                {isEditing ? 'Done Editing' : 'Edit Details'}
              </button>
              <button
                onClick={handleConfirmAndLog}
                disabled={isSaving}
                className="flex-1 p-3 bg-iron-orange hover:bg-iron-orange/80 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ borderRadius: '12px' }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Confirm & Log
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
