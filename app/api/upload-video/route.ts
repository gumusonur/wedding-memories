/**
 * Video Upload API Route
 * 
 * For S3: Provides presigned URLs for direct video uploads.
 * For Cloudinary: Provides error message about 100MB limit and presigned URL support.
 * Avoids storing large video files on Vercel serverless functions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateVideoFile } from '../../../utils/validation';
import { storage } from '../../../storage';
import { appConfig, StorageProvider } from '../../../config';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileSize, fileType, guestName } = body;

    // Validation
    if (!fileName || !fileSize || !fileType || !guestName?.trim()) {
      return NextResponse.json(
        { error: 'fileName, fileSize, fileType, and guestName are required' },
        { status: 400 }
      );
    }

    // Create a mock file object for validation
    const mockFile = {
      name: fileName,
      size: fileSize,
      type: fileType
    } as File;

    // Check storage provider for video upload limitations
    if (appConfig.storage === StorageProvider.Cloudinary) {
      const MAX_CLOUDINARY_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
      if (fileSize > MAX_CLOUDINARY_VIDEO_SIZE) {
        return NextResponse.json(
          { 
            error: `Video file size (${Math.round(fileSize / 1024 / 1024)}MB) exceeds Cloudinary's 100MB limit. Please use a smaller file or switch to S3 storage for larger videos.` 
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Cloudinary does not support presigned URLs for video uploads. Please use the regular upload endpoint (/api/upload) for videos up to 100MB, or switch to S3 storage for presigned URL uploads.' 
        },
        { status: 400 }
      );
    }

    // Validate video file
    const validationResult = await validateVideoFile(mockFile);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    // Generate unique video ID and file path
    const videoId = randomUUID();
    const sanitizedGuestName = guestName.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Generate presigned URL for upload (S3 only)
    const uploadData = await storage.generateVideoUploadUrl({
      fileName,
      guestName: sanitizedGuestName,
      videoId,
      fileType,
      fileSize
    });

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl: uploadData.uploadUrl,
        videoId,
        publicUrl: uploadData.publicUrl,
        fields: uploadData.fields || {}
      },
      message: 'Presigned URL generated successfully'
    });

  } catch (error) {
    console.error('Video presigned URL error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during presigned URL generation' },
      { status: 500 }
    );
  }
}

/**
 * Confirm video upload completion
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, guestName, fileName, publicUrl } = body;

    if (!videoId || !guestName || !fileName || !publicUrl) {
      return NextResponse.json(
        { error: 'videoId, guestName, fileName, and publicUrl are required' },
        { status: 400 }
      );
    }

    // Get video metadata from storage
    const videoMetadata = await storage.getVideoMetadata(publicUrl);

    return NextResponse.json({
      success: true,
      data: {
        video: {
          id: Date.now(),
          height: videoMetadata.height?.toString() || '480',
          width: videoMetadata.width?.toString() || '720',
          public_id: publicUrl, // Use presigned URL for S3 consistency
          format: videoMetadata.format || 'mp4',
          resource_type: 'video',
          guestName: guestName.trim(),
          uploadDate: new Date().toISOString(),
          videoId,
          duration: videoMetadata.duration
        }
      },
      message: 'Video upload confirmed successfully'
    });

  } catch (error) {
    console.error('Video upload confirmation error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during upload confirmation' },
      { status: 500 }
    );
  }
}