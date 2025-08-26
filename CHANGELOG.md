# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-alpha.4] - 2025-08-26

### 🎉 Alpha Release: Complete Video Architecture Overhaul

This release represents a complete refactoring of the video handling architecture, removing HLS complexity in favor of direct HTML5 video playback and implementing a unified upload system with S3 presigned URL support.

### 🚀 Added

#### Unified Upload Architecture
- **Single Upload Endpoint**: `/api/upload` now handles all media uploads with smart storage routing
- **S3 Presigned URL Support**: Direct browser-to-S3 uploads bypassing Vercel's 10MB limit
- **Request Type Detection**: Automatic handling of JSON metadata vs FormData uploads
- **Storage-Agnostic Frontend**: Upload logic adapts automatically to configured storage provider

#### Enhanced Security & Performance
- **Private S3 Bucket Support**: Full support with presigned URLs (24h read, 1h write expiry)
- **Zero Public Access**: S3 buckets can be completely private with temporary access URLs
- **Direct Browser Uploads**: Large files upload directly to storage, eliminating server processing
- **Enhanced Error Handling**: Storage-specific error messages and validation

#### Developer Experience
- **Internationalization**: Multi-language support for validation errors (English/Turkish)
- **Comprehensive Documentation**: Complete refactoring documentation in `REFACTOR-LOG.md`
- **Type Safety**: Full TypeScript coverage for both storage providers

### 🔄 Changed

#### Breaking Changes
- **Video Playback**: Removed HLS streaming, now uses direct HTML5 video playback
- **Upload Endpoints**: Merged `/api/upload-video` functionality into unified `/api/upload`
- **S3 Serving**: Replaced S3 proxy with presigned URLs for better security
- **Path Structure**: Removed redundant "wedding" base folder in S3 paths

#### Architecture Improvements
- **Simplified Video Processing**: Eliminated FFmpeg server-side processing
- **URL Handling**: S3 presigned URLs used directly without client reconstruction
- **Storage Abstraction**: Complete server-side storage provider abstraction
- **Performance Optimization**: Reduced bundle size and server processing overhead

### 🗑️ Removed

#### Legacy Components
- **HLS Components**: Removed `HLSVideoPlayer.tsx` and `HLSVideoProcessor.ts`
- **HLS Dependencies**: Removed `hls.js`, `ffmpeg-static`, `ffprobe-static`
- **S3 Proxy**: Removed `/api/s3-proxy/` endpoint in favor of presigned URLs
- **Duplicate Endpoints**: Consolidated video upload functionality

### 🐛 Fixed

#### Critical Issues Resolved
- **413 Content Too Large**: S3 video uploads now bypass Vercel entirely
- **S3 403 Errors**: Complete presigned URL implementation resolves private bucket access
- **Cloudinary Quality Mapping**: Fixed URL transformation errors with numeric quality values
- **TypeScript Compilation**: Resolved all type errors in S3Service and upload endpoints
- **Upload Request Handling**: Corrected processing order for S3 video uploads

### 📈 Performance Improvements

#### Upload Performance
- **Faster Uploads**: Direct client-to-storage uploads eliminate server bottlenecks
- **Reduced Memory Usage**: No video buffering in serverless functions
- **Lower Server Usage**: Significant reduction in Vercel function usage for large files

#### Playback Performance  
- **Immediate Video Playback**: HTML5 video starts without segment loading delays
- **Reduced Bundle Size**: Removed heavy HLS.js and FFmpeg dependencies
- **Optimized Loading**: Direct storage URLs with proper caching headers

### 🔒 Security Enhancements

#### S3 Security
- **AWS IAM Integration**: Full policy control over S3 access
- **Temporary URLs**: All presigned URLs expire automatically
- **Audit Trail**: Complete S3 access logging through AWS CloudTrail
- **Zero Permanent Access**: No public bucket policies required

## [0.1.0-alpha.3] - 2025-08-25

### Added
- Multi-storage architecture support (Cloudinary and S3/Wasabi)
- Storage service abstraction layer
- S3Service implementation with AWS SDK integration
- HLS video processing pipeline with FFmpeg
- Video segment generation and playlist creation

### Changed
- Enhanced video upload handling for large files
- Improved storage provider configuration system

### Fixed
- S3 bucket access permissions and CORS configuration
- Video metadata extraction and processing

## [0.1.0-alpha.2] - 2025-08-24

### Added
- Advanced video upload system
- Guest name validation with internationalization
- Upload progress tracking and error handling
- Video thumbnail generation

### Changed
- Upload UI improvements with drag-and-drop support
- Enhanced mobile responsiveness for upload interface

### Fixed
- File validation for video formats
- Upload error messaging and user feedback

## [0.1.0-alpha.1] - 2025-08-23

### Added
- Initial wedding memories gallery application
- Responsive masonry grid layout with Tailwind CSS
- Modal viewing with pinch-to-zoom functionality
- Guest isolation features and filtering
- Mobile-first responsive design
- Accessibility compliance (WCAG 2.1 AA)
- TypeScript strict mode configuration
- Next.js App Router architecture
- Cloudinary integration for image optimization
- Zustand state management with persistence
- Basic media upload functionality

### Core Features
- Image gallery with masonry layout
- Modal navigation with keyboard shortcuts
- Guest name collection and association
- Basic image optimization and blur placeholders
- Responsive design for all screen sizes

---

## Migration Guide from 0.1.0-alpha.3 to 0.1.0-alpha.4

### 🚨 Breaking Changes

1. **Video Playback**: HLS video player removed. Videos now use HTML5 `<video>` element.
2. **Upload Endpoints**: Use `/api/upload` for all uploads instead of separate video endpoint.
3. **S3 URLs**: Direct S3 URLs replaced with presigned URLs for security.

### ⚠️ Alpha Release Notice

This is an alpha release. While extensively tested, some features may still have rough edges. Please test thoroughly before using in production.

### ✅ No Action Required

- **Environment Variables**: All existing configurations work seamlessly
- **Cloudinary Setup**: No changes needed for Cloudinary users
- **Frontend Usage**: Video uploads automatically use correct strategy

### 🔧 S3 Users: Update Configuration

If using S3/Wasabi, update your bucket policy for presigned URL support:

```json
{
  "Version": "2012-10-17", 
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::ACCOUNT-ID:user/your-user"},
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

**CORS Configuration** for presigned uploads:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 🎯 Benefits After Migration

- ✅ **No More 413 Errors**: Videos >10MB upload successfully to S3
- ✅ **Enhanced Security**: Private S3 buckets with temporary access
- ✅ **Better Performance**: Faster uploads and immediate video playback
- ✅ **Simplified Architecture**: Less complexity, easier maintenance
- ✅ **Cost Optimization**: Reduced serverless function usage