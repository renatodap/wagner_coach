'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mic, Camera, Type, Check, X, AlertCircle } from 'lucide-react'
import { previewQuickEntry, confirmQuickEntry, type QuickEntryResult } from '@/lib/api/quick-entry'
import { MealEditor } from './MealEditor'
import { WorkoutEditor } from './WorkoutEditor'
import { ActivityEditor } from './ActivityEditor'
import { useToast } from '@/hooks/use-toast'

type InputMode = 'text' | 'voice' | 'image'
type FlowStage = 'input' | 'review' | 'saving' | 'success'

export function QuickEntryFlow() {
  const router = useRouter()
  const { toast } = useToast()

  // Flow state
  const [stage, setStage] = useState<FlowStage>('input')
  const [inputMode, setInputMode] = useState<InputMode>('text')

  // Input state
  const [textInput, setTextInput] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)

  // AI result state
  const [aiResult, setAiResult] = useState<QuickEntryResult | null>(null)
  const [editedData, setEditedData] = useState<any>(null)

  // Loading/error state
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePreview = async () => {
    setError(null)
    setIsProcessing(true)

    try {
      const result = await previewQuickEntry({
        text: textInput || undefined,
        imageFile: imageFile || undefined,
        audioFile: audioFile || undefined,
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to process entry')
      }

      setAiResult(result)
      setEditedData(result.data)
      setStage('review')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process entry'
      setError(message)
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirm = async () => {
    if (!aiResult || !editedData) return

    setError(null)
    setIsProcessing(true)
    setStage('saving')

    try {
      const result = await confirmQuickEntry({
        entry_type: aiResult.entry_type,
        data: editedData,
        original_text: textInput || aiResult.extracted_text || '',
        extracted_text: aiResult.extracted_text,
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to save entry')
      }

      setStage('success')

      toast({
        title: 'Success!',
        description: `${aiResult.entry_type.charAt(0).toUpperCase() + aiResult.entry_type.slice(1)} logged successfully`,
        variant: 'default',
      })

      // Redirect after 1 second
      setTimeout(() => {
        switch (aiResult.entry_type) {
          case 'meal':
            router.push('/nutrition')
            break
          case 'workout':
            router.push('/workouts')
            break
          case 'activity':
            router.push('/activities')
            break
          default:
            router.push('/dashboard')
        }
      }, 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save entry'
      setError(message)
      setStage('review')
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    setStage('input')
    setAiResult(null)
    setEditedData(null)
    setError(null)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      toast({
        title: 'Image selected',
        description: file.name,
        variant: 'default',
      })
    }
  }

  const triggerImageUpload = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const input = document.getElementById('image-upload') as HTMLInputElement
    if (input) {
      input.click()
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })
        setAudioFile(audioFile)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)

      // Auto-stop after 60 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
          setIsRecording(false)
        }
      }, 60000)

      // Store recorder for manual stop
      ;(window as any).__mediaRecorder = mediaRecorder
    } catch (err) {
      toast({
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive',
      })
    }
  }

  const stopRecording = () => {
    const mediaRecorder = (window as any).__mediaRecorder
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  // Render different stages
  if (stage === 'saving' || stage === 'success') {
    return (
      <Card className="p-8 text-center">
        {stage === 'saving' ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Saving your entry...</h3>
            <p className="text-sm text-gray-600">This will only take a moment</p>
          </>
        ) : (
          <>
            <div className="h-12 w-12 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Entry saved!</h3>
            <p className="text-sm text-gray-600">Redirecting...</p>
          </>
        )}
      </Card>
    )
  }

  if (stage === 'review' && aiResult) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">
                {aiResult.entry_type === 'meal' && '🍽️'}
                {aiResult.entry_type === 'workout' && '💪'}
                {aiResult.entry_type === 'activity' && '🏃'}
                {aiResult.entry_type === 'note' && '📝'}
                {aiResult.entry_type === 'measurement' && '📊'}
              </div>
              <div>
                <h3 className="font-semibold text-lg capitalize">{aiResult.entry_type} Entry</h3>
                <p className="text-sm text-gray-600">
                  AI Confidence: {Math.round(aiResult.confidence * 100)}%
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 font-medium">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Suggestions */}
        {aiResult.suggestions && aiResult.suggestions.length > 0 && (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <p className="text-sm font-medium text-yellow-900 mb-2">💡 Suggestions:</p>
            <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
              {aiResult.suggestions.map((suggestion, i) => (
                <li key={i}>{suggestion}</li>
              ))}
            </ul>
          </Card>
        )}

        {/* Editor */}
        {aiResult.entry_type === 'meal' && (
          <MealEditor data={editedData} onChange={setEditedData} />
        )}
        {aiResult.entry_type === 'workout' && (
          <WorkoutEditor data={editedData} onChange={setEditedData} />
        )}
        {aiResult.entry_type === 'activity' && (
          <ActivityEditor data={editedData} onChange={setEditedData} />
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleCancel()
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              handleCancel()
            }}
            disabled={isProcessing}
            className="flex-1 min-h-[48px] touch-manipulation active:scale-95 transition-transform"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleConfirm()
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={isProcessing}
            className="flex-1 min-h-[48px] touch-manipulation active:scale-95 transition-transform"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirm & Save
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Input stage
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-2">Quick Entry</h2>
        <p className="text-gray-600 mb-6">
          Log meals, workouts, or activities instantly. AI will understand what you mean.
        </p>

        <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as InputMode)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="gap-2">
              <Type className="h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-2">
              <Mic className="h-4 w-4" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-2">
              <Camera className="h-4 w-4" />
              Photo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="text-input">What did you do?</Label>
              <Textarea
                id="text-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Examples:
• Chicken breast with rice and broccoli, 500 calories
• Ran 5 miles in 45 minutes
• Bench press 3x10 at 185 lbs, overhead press 3x8 at 95 lbs"
                rows={6}
                disabled={isProcessing}
              />
            </div>
          </TabsContent>

          <TabsContent value="voice" className="space-y-4 mt-4">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Record your entry by speaking. AI will transcribe and understand it.
              </p>

              {!audioFile && (
                <Button
                  type="button"
                  variant={isRecording ? 'destructive' : 'default'}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    isRecording ? stopRecording() : startRecording()
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault()
                    isRecording ? stopRecording() : startRecording()
                  }}
                  className="w-full gap-2 min-h-[48px] touch-manipulation active:scale-95 transition-transform"
                  disabled={isProcessing}
                >
                  <Mic className="h-4 w-4" />
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
              )}

              {audioFile && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Recording ready
                      </p>
                      <p className="text-xs text-green-700">{audioFile.name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAudioFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              )}

              {isRecording && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="h-3 w-3 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-sm text-red-800">Recording...</span>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4 mt-4">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Upload a photo of your meal, workout, or progress. AI will analyze it.
              </p>

              {!imageFile && (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 active:border-blue-600 transition-colors touch-manipulation"
                  onClick={triggerImageUpload}
                  onTouchEnd={triggerImageUpload}
                >
                  <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <div className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">
                      Choose a photo
                    </span>
                    <span className="text-gray-600"> or tap here</span>
                  </div>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isProcessing}
                  />
                </div>
              )}

              {imageFile && (
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Image ready</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setImageFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Upload preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Card className="p-4 bg-red-50 border-red-200 mt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 font-medium">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </Card>
        )}

        <Button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handlePreview()
          }}
          onTouchEnd={(e) => {
            e.preventDefault()
            handlePreview()
          }}
          disabled={isProcessing || (!textInput && !imageFile && !audioFile)}
          className="w-full mt-6 min-h-[48px] touch-manipulation active:scale-95 transition-transform"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing with AI...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </Card>
    </div>
  )
}
