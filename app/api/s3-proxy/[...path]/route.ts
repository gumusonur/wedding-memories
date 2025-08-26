/**
 * S3 Media Proxy API Route
 * 
 * Proxies S3/Wasabi media through our server to bypass permission issues.
 * This approach works regardless of bucket permissions or CORS configuration.
 * Includes request deduplication and proper caching for performance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Request deduplication cache to prevent multiple simultaneous requests for same file
// Store the buffer data instead of the response to avoid stream consumption issues
interface CachedResponse {
  buffer: Buffer;
  contentType: string;
  status: number;
  headers: Record<string, string>;
}

const ongoingRequests = new Map<string, Promise<CachedResponse>>();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT,
  forcePathStyle: true,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await params and reconstruct the S3 object key from the path
    const resolvedParams = await params;
    const objectKey = resolvedParams.path.join('/');
    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET;

    if (!bucket) {
      return NextResponse.json(
        { error: 'S3 bucket not configured' },
        { status: 500 }
      );
    }

    // Check if this is a download request
    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get('download') === 'true';
    
    // Check for range requests (important for video streaming)
    const range = request.headers.get('range');
    
    // Create unique key for request deduplication
    const requestKey = `${objectKey}:${isDownload}:${range || 'full'}`;
    
    // Check for conditional requests (If-None-Match)
    const ifNoneMatch = request.headers.get('if-none-match');
    const expectedETag = `"${objectKey}-cached"`;
    
    if (ifNoneMatch === expectedETag && !isDownload && !range) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
          'ETag': expectedETag,
        }
      });
    }
    
    // Check if there's already an ongoing request for this file
    if (ongoingRequests.has(requestKey)) {
      const cachedData = await ongoingRequests.get(requestKey)!;
      
      // Create a new response with the cached data
      return new NextResponse(cachedData.buffer as BodyInit, {
        status: cachedData.status,
        headers: cachedData.headers,
      });
    }

    // Create the request promise and store it for deduplication
    const requestPromise = (async () => {
      try {
        // Handle range requests for video streaming
        const range = request.headers.get('range');
        const commandParams: any = {
          Bucket: bucket,
          Key: objectKey,
        };

        // Add range to S3 request if present
        if (range) {
          commandParams.Range = range;
        }

        // Fetch the object from S3/Wasabi using AWS SDK
        const command = new GetObjectCommand(commandParams);
        const response = await s3Client.send(command);

        if (!response.Body) {
          throw new Error('Object not found');
        }

        // Convert the stream to buffer
        const chunks = [];
        for await (const chunk of response.Body as any) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // Determine content type with special handling for HLS files
        let contentType = response.ContentType || 'application/octet-stream';
        
        // Ensure proper MIME types for HLS files
        if (objectKey.endsWith('.m3u8')) {
          contentType = 'application/vnd.apple.mpegurl';
        } else if (objectKey.endsWith('.ts')) {
          contentType = 'video/mp2t';
        }

        // Prepare headers with proper caching
        const headers: Record<string, string> = {
          'Content-Type': contentType,
          'Content-Length': buffer.length.toString(),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD',
          'Access-Control-Allow-Headers': 'Content-Type, Range',
          'Accept-Ranges': 'bytes', // Enable range requests for video streaming
        };

        let status = 200;
        
        // Handle range requests properly
        if (range && response.ContentRange) {
          headers['Content-Range'] = response.ContentRange;
          headers['Content-Length'] = buffer.length.toString();
          status = 206; // Partial Content
        }

        // Add download headers if requested
        if (isDownload) {
          const filename = objectKey.split('/').pop() || 'media';
          headers['Content-Disposition'] = `attachment; filename="${filename}"`;
          headers['Cache-Control'] = 'no-cache';
        } else {
          // Aggressive caching for media files with better cache headers
          headers['Cache-Control'] = 'public, max-age=31536000, immutable';
          headers['ETag'] = `"${objectKey}-cached"`;
          headers['Last-Modified'] = new Date().toUTCString();
          // Add explicit cache instructions for browsers
          headers['Pragma'] = 'cache';
          headers['Expires'] = new Date(Date.now() + 31536000000).toUTCString(); // 1 year
        }

        // Return data object instead of NextResponse
        return {
          buffer,
          contentType,
          status,
          headers,
        };
      } finally {
        // Clean up the request from cache after completion
        ongoingRequests.delete(requestKey);
      }
    })();

    // Store the promise for deduplication
    ongoingRequests.set(requestKey, requestPromise);
    
    // Wait for the data and create a response
    const data = await requestPromise;
    return new NextResponse(data.buffer as BodyInit, {
      status: data.status,
      headers: data.headers,
    });

  } catch (error: any) {
    // Clean up the request from cache on error
    try {
      const resolvedParams = await params;
      const objectKey = resolvedParams.path.join('/');
      const { searchParams } = new URL(request.url);
      const isDownload = searchParams.get('download') === 'true';
      const requestKey = `${objectKey}:${isDownload}`;
      ongoingRequests.delete(requestKey);
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    
    console.error('S3 proxy error:', error);
    
    // Handle specific S3 errors
    if (error.name === 'NoSuchKey' || error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
    },
  });
}