# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js wedding memories gallery application built with Cloudinary integration for image storage and processing. The app allows users to view photos in a masonry grid layout with modal viewing and upload functionality. Features customizable couple names through environment variables and transparent blur loading screens for better UX.

## Key Architecture

### Core Technologies
- **Next.js** (App Router) with TypeScript
- **Cloudinary** for image storage, optimization, and transformations
- **Tailwind CSS** with shadcn/ui components for styling
- **Framer Motion** for animations
- **React Global State** for state management

### Application Structure
- **App Router**: Uses Next.js app directory structure
- **Static Generation**: Images are fetched at build time via `getStaticProps`
- **Modal Navigation**: URL-based photo viewing with shallow routing (`/?photoId=X` → `/p/X`)
- **Component Architecture**: Reusable UI components in `/components` with shadcn/ui integration
- **Transparent Loading**: Blur loading screens that show content behind for better UX

### Key Files and Directories
- `app/page.tsx` - Main gallery page with masonry layout
- `app/p/[photoId]/page.tsx` - Individual photo pages
- `app/api/upload/route.ts` - API endpoint for photo uploads
- `app/loading.tsx` - Global loading UI with transparent blur
- `components/AppLoader.tsx` - App startup loader with couple names
- `components/Upload.tsx` - Photo upload component with drawer UI
- `components/WelcomeDialog.tsx` - Guest name collection dialog
- `utils/cloudinary.ts` - Cloudinary configuration
- `utils/types.ts` - TypeScript interfaces for image data

## Development Commands

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## Environment Configuration

Required environment variables:
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name (public)
- `CLOUDINARY_API_KEY` - Cloudinary API key (server-side)
- `CLOUDINARY_API_SECRET` - Cloudinary API secret (server-side)
- `CLOUDINARY_FOLDER` - Folder name in Cloudinary for photo storage
- `NEXT_PUBLIC_BRIDE_NAME` - Bride's name for display throughout the app
- `NEXT_PUBLIC_GROOM_NAME` - Groom's name for display throughout the app

## Image Handling Architecture

### Image Flow
1. **Upload**: Photos uploaded via `/api/upload` endpoint to Cloudinary
2. **Storage**: Images stored in configured Cloudinary folder with guest context
3. **Retrieval**: `getStaticProps` fetches images from Cloudinary at build time
4. **Display**: Images served with Cloudinary transformations (720px width, optimized)
5. **Blur Placeholders**: Generated server-side for better loading experience

### Cloudinary Integration
- Images fetched using Cloudinary Search API with folder filtering
- Automatic image optimization and responsive sizing
- Blur placeholder generation for smooth loading
- Upload API handles base64 file conversion

## UI/UX Patterns

### Layout System
- **Masonry Grid**: Responsive columns (1-4 based on screen size)
- **Modal Navigation**: URL-preserving photo viewing with keyboard/swipe navigation
- **Drawer Upload**: Bottom drawer for mobile-friendly photo upload

### Styling Architecture
- **Tailwind CSS**: Utility-first styling with custom theme extensions
- **shadcn/ui**: Pre-built accessible components (Button, Drawer, Input)
- **CSS Variables**: HSL-based color system for theme consistency
- **Responsive Design**: Mobile-first approach with custom breakpoints

## State Management

- **React Global State**: Used for tracking last viewed photo position
- **URL State**: Photo modal state managed through Next.js router
- **Local State**: Component-level state for upload form and UI interactions

## Performance Optimizations

- **Static Generation**: Images pre-fetched at build time
- **Image Optimization**: Next.js Image component with Cloudinary transformations
- **Blur Placeholders**: Smooth loading experience
- **Responsive Images**: Multiple sizes served based on viewport