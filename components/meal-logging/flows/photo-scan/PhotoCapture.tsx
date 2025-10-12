'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PhotoCaptureProps } from '@/types/nutrition';
import { Camera, Upload, X, RotateCw, Image } from 'lucide-react';

export default function PhotoCapture({ onPhotoCapture, onCancel, isProcessing = false }: PhotoCaptureProps) {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize camera
  useEffect(() => {
    initializeCamera();
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Camera access failed';
      if (errorMessage.includes('Permission denied')) {
        setError('Camera access denied. Please enable camera permissions.');
      } else if (errorMessage.includes('not found')) {
        setError('Camera not found. Please check your device.');
      } else {
        setError('Camera initialization failed. ' + errorMessage);
      }
    }
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    onPhotoCapture(imageData);
  }, [onPhotoCapture]);

  const retakePhoto = () => {
    setCapturedImage(null);
    setError(null);
  };

  const compressImage = async (file: File): Promise<string> => {
    setIsCompressing(true);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate new dimensions (max 1920px width/height)
          let width = img.width;
          let height = img.height;
          const maxSize = 1920;

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const compressedData = canvas.toDataURL('image/jpeg', 0.8);
          setIsCompressing(false);
          resolve(compressedData);
        };
        img.onerror = () => {
          setIsCompressing(false);
          reject(new Error('Failed to process image'));
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        setIsCompressing(false);
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB');
      return;
    }

    try {
      let imageData: string;
      if (file.size > 2 * 1024 * 1024) {
        // Compress if larger than 2MB
        imageData = await compressImage(file);
      } else {
        const reader = new FileReader();
        imageData = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      setCapturedImage(imageData);
      onPhotoCapture(imageData);
      setError(null);
    } catch (err) {
      setError('Failed to process image');
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      await handleFileSelect(imageFile);
    } else {
      setError('Only image files are allowed');
    }
  };

  return (
    <div className="photo-capture-container">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          {error.includes('Camera') && (
            <button
              onClick={initializeCamera}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              aria-label="Retry"
            >
              <RotateCw className="inline mr-2" size={16} />
              Retry
            </button>
          )}
        </div>
      )}

      {isCompressing && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Compressing image...</p>
        </div>
      )}

      {isProcessing && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Processing...</p>
        </div>
      )}

      {!capturedImage && !isCompressing && !isProcessing && (
        <>
          {/* Camera Preview */}
          {cameraStream && (
            <div className="relative mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg"
                data-testid="camera-preview"
              />
              <button
                onClick={capturePhoto}
                disabled={isProcessing}
                className="mt-4 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Capture"
              >
                <Camera className="inline mr-2" size={20} />
                Capture Photo
              </button>
            </div>
          )}

          {/* File Upload */}
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
              id="file-upload"
              aria-label="Upload"
            />
            <label
              htmlFor="file-upload"
              className="block w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer text-center"
            >
              <Upload className="inline mr-2" size={20} />
              Upload from Gallery
            </label>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50 drag-over' : 'border-gray-300'
            }`}
          >
            <Image className="mx-auto mb-2 text-gray-400" size={40} />
            <p className="text-gray-600">Drag and drop an image here</p>
            <p className="text-sm text-gray-500 mt-1">or use the options above</p>
          </div>
        </>
      )}

      {/* Captured/Uploaded Image Preview */}
      {capturedImage && (
        <div className="relative">
          <img
            src={capturedImage}
            alt="Captured meal preview"
            className="w-full rounded-lg"
          />
          {!isProcessing && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={retakePhoto}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                aria-label="Retake"
              >
                <RotateCw className="inline mr-2" size={16} />
                Retake
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        aria-label="Cancel"
      >
        <X className="inline mr-2" size={16} />
        Cancel
      </button>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}