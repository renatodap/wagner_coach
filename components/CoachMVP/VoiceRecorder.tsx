"use client"

import { useState, useRef } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VoiceRecorderProps {
  onTranscript: (text: string) => void
  onError?: (error: string) => void
}

/**
 * VoiceRecorder - Voice input component for hands-free messaging
 *
 * Records audio, transcribes with Web Speech API, and returns text.
 * Fallback to "Coming soon" if browser doesn't support Speech Recognition.
 */
export function VoiceRecorder({ onTranscript, onError }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Check if browser supports Speech Recognition
  const isSpeechRecognitionSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  function startRecording() {
    if (!isSpeechRecognitionSupported) {
      if (onError) {
        onError('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.')
      }
      return
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsRecording(true)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setIsProcessing(true)
        onTranscript(transcript)
        setIsRecording(false)
        setIsProcessing(false)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
        setIsProcessing(false)

        if (onError) {
          const errorMessage = event.error === 'no-speech'
            ? 'No speech detected. Please try again.'
            : event.error === 'not-allowed'
            ? 'Microphone access denied. Please enable microphone permissions.'
            : 'Voice recognition failed. Please try again.'

          onError(errorMessage)
        }
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (error) {
      console.error('Failed to start recording:', error)
      setIsRecording(false)
      if (onError) {
        onError('Failed to start voice recording. Please try again.')
      }
    }
  }

  function stopRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
      variant="ghost"
      size="icon"
      className={`${
        isRecording
          ? 'text-red-500 hover:text-red-600 hover:bg-red-500/10 animate-pulse'
          : 'text-iron-gray hover:text-iron-orange hover:bg-iron-orange/10'
      }`}
      aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
      title={isRecording ? 'Stop recording' : 'Voice input'}
    >
      {isProcessing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isRecording ? (
        <Square className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  )
}
