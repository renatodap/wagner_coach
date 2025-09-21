'use client';

import React, { useState, useRef, useCallback } from 'react';
import { PhotoUploadProps } from '@/types/nutrition';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, AlertCircle, Loader2 } from 'lucide-react';

export function PhotoUpload({
  onImageSelect,
  onImageRemove,
  isProcessing = false,
  error,
  maxSizeInBytes = 10485760, // 10MB default
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp']
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [localError, setLocalError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset errors
    setLocalError('');

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      setLocalError('Please select an image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size
    if (file.size > maxSizeInBytes) {
      setLocalError(`File size must be less than ${formatFileSize(maxSizeInBytes)}`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Set file info
    setFileName(file.name);
    setFileSize(file.size);

    // Notify parent
    onImageSelect(file);
  }, [acceptedFormats, maxSizeInBytes, onImageSelect]);

  const handleRemoveImage = useCallback(() => {
    setPreview(null);
    setFileName('');
    setFileSize(0);
    setLocalError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    onImageRemove();
  }, [onImageRemove]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const displayError = error || localError;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Upload Button */}
        {!preview && (
          <div className="text-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleButtonClick}
              disabled={isProcessing}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" data-testid="upload-icon" />
              Upload Photo
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Accepted formats: JPEG, PNG, WebP (Max {formatFileSize(maxSizeInBytes)})
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={handleFileSelect}
              className="hidden"
              data-testid="file-input"
              aria-label="Upload meal photo"
            />
          </div>
        )}

        {/* Image Preview */}
        {preview && (
          <div className="relative">
            <img
              src={preview}
              alt="Meal preview"
              className="w-full h-48 object-cover rounded"
            />
            {!isProcessing && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                data-testid="remove-image"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* File Info */}
            <div className="mt-2 text-sm text-muted-foreground">
              <span>{fileName}</span>
              <span className="mx-2">•</span>
              <span>{formatFileSize(fileSize)}</span>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin mr-2" data-testid="loading-spinner" />
            <span>Analyzing your meal...</span>
          </div>
        )}

        {/* Error Display */}
        {displayError && (
          <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded text-red-700" role="alert">
            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{displayError}</span>
          </div>
        )}
      </div>
    </Card>
  );
}