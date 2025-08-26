# Upload Endpoints Cleanup Task List

## Current Problem Analysis

**Issue**: We have confusing dual upload endpoints causing 413 errors on S3 storage

**Root Cause**: 
- Two separate endpoints: `/api/upload` and `/api/upload-video`
- Frontend sending large files to wrong endpoint (Next.js server instead of direct S3)
- Body parser limits not working in App Router

## Current Endpoint Status

### `/api/upload` (Line 76-128 in route.ts)
- **Purpose**: Direct file upload through Next.js server
- **Works For**: Cloudinary storage (FormData upload)  
- **Problem**: Tries to handle S3 uploads but hits 413 errors on large files
- **Body Parser**: `sizeLimit: '150mb'` (not working in App Router)

### `/api/upload-video` (Separate endpoint)
- **Purpose**: Generate presigned URLs for S3 direct upload
- **Works For**: S3/Wasabi storage (presigned URL approach)
- **Status**: Should be the primary S3 upload method

## Task List

### Phase 1: Analysis & Documentation
- [ ] **Map Current Upload Flow**: Document which components use which endpoints
- [ ] **Check Frontend Upload Logic**: Analyze `components/Upload.tsx` routing logic
- [ ] **Verify Storage Service Integration**: Confirm S3Service presigned URL generation
- [ ] **Test Current Behavior**: Document what works vs what fails

### Phase 2: Architecture Decision
Choose ONE of these approaches:

#### Option A: Single Unified Endpoint (Recommended)
- [ ] **Merge Endpoints**: Combine `/api/upload` and `/api/upload-video` into single endpoint
- [ ] **Smart Routing**: Auto-detect storage provider and route accordingly
  - Cloudinary → FormData upload through Next.js
  - S3 → Generate presigned URL for direct upload
- [ ] **Update Frontend**: Single upload method in components

#### Option B: Storage-Specific Endpoints  
- [ ] **Keep Separate Endpoints**: Maintain `/api/upload` (Cloudinary) and `/api/upload-video` (S3)
- [ ] **Fix Frontend Logic**: Update Upload component to use correct endpoint based on storage
- [ ] **Clear Documentation**: Document which endpoint to use when

### Phase 3: Implementation
- [ ] **Fix App Router Body Limits**: Implement proper request size handling
- [ ] **Update Upload Component**: Fix endpoint selection logic
- [ ] **Remove Dead Code**: Clean up unused upload paths
- [ ] **Add Error Handling**: Better error messages for storage-specific issues

### Phase 4: Testing
- [ ] **Test Cloudinary Uploads**: Verify FormData uploads work (images + small videos)
- [ ] **Test S3 Large Files**: Verify presigned URL uploads work (large videos)
- [ ] **Test Error Cases**: File too large, invalid formats, network issues
- [ ] **Cross-Storage Testing**: Test switching between Cloudinary and S3 in config

### Phase 5: Documentation
- [ ] **Update API Docs**: Document final endpoint structure
- [ ] **Update README**: Clear upload flow documentation
- [ ] **Add Storage Guide**: When to use Cloudinary vs S3

## Recommended Solution

**Single Unified Endpoint Approach:**

```typescript
// /api/upload/route.ts
export async function POST(request: NextRequest) {
  const { file, guestName } = await parseFormData(request);
  
  if (appConfig.storage === StorageProvider.S3) {
    // Return presigned URL for direct S3 upload
    const presignedUrl = await storage.generatePresignedUrl(file, guestName);
    return NextResponse.json({ presignedUrl, uploadMethod: 'direct' });
  } else {
    // Handle Cloudinary upload through Next.js
    const result = await storage.upload(file, guestName);
    return NextResponse.json({ result, uploadMethod: 'server' });
  }
}
```

**Frontend Logic:**
```typescript
// components/Upload.tsx
const handleUpload = async (file: File) => {
  const response = await fetch('/api/upload', { method: 'POST', body: formData });
  const data = await response.json();
  
  if (data.uploadMethod === 'direct') {
    // Upload directly to S3 using presigned URL
    await uploadToS3(file, data.presignedUrl);
  } else {
    // File already uploaded via server
    handleUploadSuccess(data.result);
  }
};
```

## Benefits of This Approach
- ✅ Single endpoint for all uploads
- ✅ Storage-agnostic frontend code  
- ✅ No 413 errors (S3 uploads bypass Next.js)
- ✅ Maintains Cloudinary optimization features
- ✅ Cleaner architecture

## Next Steps
1. Review current upload flow in `components/Upload.tsx`
2. Decide on architecture approach
3. Implement chosen solution
4. Test thoroughly with both storage providers