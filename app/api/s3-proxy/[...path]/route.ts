/**
 * S3 Image Proxy API Route
 * 
 * Proxies S3/Wasabi images through our server to bypass permission issues.
 * This approach works regardless of bucket permissions or CORS configuration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

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

    // Fetch the object from S3/Wasabi using AWS SDK
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return NextResponse.json(
        { error: 'Object not found' },
        { status: 404 }
      );
    }

    // Convert the stream to buffer
    const chunks = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Determine content type
    const contentType = response.ContentType || 'image/jpeg';

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Length': buffer.length.toString(),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Add download headers if requested
    if (isDownload) {
      const filename = objectKey.split('/').pop() || 'image.jpg';
      headers['Content-Disposition'] = `attachment; filename="${filename}"`;
      headers['Cache-Control'] = 'no-cache';
    } else {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }

    // Return the image with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers,
    });

  } catch (error: any) {
    console.error('S3 proxy error:', error);
    
    // Handle specific S3 errors
    if (error.name === 'NoSuchKey') {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch image' },
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}