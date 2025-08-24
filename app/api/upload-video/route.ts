/**
 * Video Upload API Route with HLS Processing
 * 
 * Handles video uploads and generates HLS streams for Instagram-style fast playback.
 * Stores both original videos and HLS segments in organized S3 structure.
 */

import { NextRequest, NextResponse } from 'next/server';
import { HLSVideoProcessor } from '../../../services/HLSVideoProcessor';
import { validateVideoFile } from '../../../utils/validation';
import { storage } from '../../../storage';
import type { MediaProps } from '../../../utils/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const video = formData.get('video') as File;
    const guestName = formData.get('guestName') as string;

    // Validation
    if (!video) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    if (!guestName?.trim()) {
      return NextResponse.json(
        { error: 'Guest name is required' },
        { status: 400 }
      );
    }

    // Validate video file
    const validationResult = await validateVideoFile(video);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    // Process video to HLS
    const hlsProcessor = new HLSVideoProcessor();
    const videoBuffer = Buffer.from(await video.arrayBuffer());
    
    const processingResult = await hlsProcessor.processVideoToHLS(
      videoBuffer,
      video.name,
      {
        guestName: guestName.trim(),
        quality: 'medium', // Default to medium quality for balance
        segmentDuration: 6 // 6-second segments for fast seeking
      }
    );

    // Create MediaProps object for the processed video
    const mediaItem: MediaProps = {
      id: Date.now(), // Temporary ID, will be replaced by gallery
      height: '480', // Default height, could be extracted from video metadata
      width: '720',  // Default width, could be extracted from video metadata
      public_id: processingResult.originalPath,
      format: 'mp4',
      resource_type: 'video',
      guestName: guestName.trim(),
      uploadDate: new Date().toISOString(),
      // HLS-specific metadata
      hlsPlaylistUrl: processingResult.playlistUrl,
      hlsPath: processingResult.hlsPath,
      videoId: processingResult.videoId,
      duration: processingResult.duration
    };

    return NextResponse.json({
      success: true,
      data: {
        video: mediaItem,
        hls: {
          playlistUrl: processingResult.playlistUrl,
          segmentUrls: processingResult.segmentUrls,
          videoId: processingResult.videoId,
          duration: processingResult.duration
        }
      },
      message: 'Video uploaded and processed successfully'
    });

  } catch (error) {
    console.error('Video upload error:', error);
    
    // Return appropriate error response
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during video processing' },
      { status: 500 }
    );
  }
}

/**
 * Get HLS playlist URL for an existing video
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guestName = searchParams.get('guestName');
    const videoId = searchParams.get('videoId');

    if (!guestName || !videoId) {
      return NextResponse.json(
        { error: 'guestName and videoId are required' },
        { status: 400 }
      );
    }

    const hlsProcessor = new HLSVideoProcessor();
    const playlistUrl = await hlsProcessor.getHLSPlaylistUrl(guestName, videoId);

    return NextResponse.json({
      success: true,
      data: {
        playlistUrl,
        videoId,
        guestName
      }
    });

  } catch (error) {
    console.error('Error getting HLS playlist:', error);
    return NextResponse.json(
      { error: 'Failed to get video playlist' },
      { status: 500 }
    );
  }
}