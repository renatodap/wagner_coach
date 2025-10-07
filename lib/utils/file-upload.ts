/**
 * File Upload Utilities
 *
 * Handles uploading files to Supabase Storage and getting public URLs.
 */

import { createClient } from '@/lib/supabase/client'

/**
 * Upload a file to Supabase Storage
 *
 * @param file - File to upload
 * @param bucket - Storage bucket name (default: 'user-uploads')
 * @param folder - Optional folder path within bucket
 * @returns Public URL of uploaded file
 */
export async function uploadFile(
  file: File,
  bucket: string = 'user-uploads',
  folder?: string
): Promise<string> {
  const supabase = createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Generate unique file name
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = folder ? `${folder}/${fileName}` : `${user.id}/${fileName}`

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return publicUrl
}

/**
 * Upload multiple files to Supabase Storage
 *
 * @param files - Array of files to upload
 * @param bucket - Storage bucket name (default: 'user-uploads')
 * @param folder - Optional folder path within bucket
 * @returns Array of public URLs
 */
export async function uploadFiles(
  files: File[],
  bucket: string = 'user-uploads',
  folder?: string
): Promise<string[]> {
  const uploadPromises = files.map(file => uploadFile(file, bucket, folder))
  return Promise.all(uploadPromises)
}

/**
 * Validate file before upload
 *
 * @param file - File to validate
 * @param options - Validation options
 */
export function validateFile(file: File, options?: {
  maxSizeMB?: number
  allowedTypes?: string[]
}): { valid: boolean; error?: string } {
  const maxSizeMB = options?.maxSizeMB || 10
  const allowedTypes = options?.allowedTypes || ['image/*', 'audio/*', 'application/pdf']

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024)
  if (fileSizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `File size (${fileSizeMB.toFixed(1)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
    }
  }

  // Check file type
  const isAllowedType = allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const prefix = type.replace('/*', '')
      return file.type.startsWith(prefix)
    }
    return file.type === type
  })

  if (!isAllowedType) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  return { valid: true }
}
