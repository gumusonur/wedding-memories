# Wedding Memories Gallery

A modern, accessible wedding memories gallery supporting **both photos and videos** with multi-storage backend support. Built with Next.js, supports Cloudinary and S3/Wasabi storage providers, and features full keyboard navigation and exceptional accessibility.

🌐 **[Live Demo](https://wedding.onurgumus.com)**

## ✨ Features

- **Photo & Video Support** - unified handling for images and videos with direct HTML5 playback
- **Unified Upload Architecture** - single endpoint handling all media with smart storage routing
- **Responsive masonry gallery** with 1-4 columns based on screen size
- **Modal viewing** with cached data, keyboard/swipe navigation, and pinch-to-zoom
- **Multiple file upload** with drag & drop, batch selection, and progress tracking
- **Real-time gallery updates** automatically refresh after uploads
- **Guest welcome system** with name collection and persistent storage
- **Multi-storage backend** - Cloudinary and S3/Wasabi with seamless switching
- **S3 Presigned URLs** - secure private bucket support with direct browser uploads
- **Guest isolation mode** - filter media by guest when enabled in config
- **Advanced validation** with real-time feedback and security-focused rules
- **Mobile-optimized UX** with touch gestures and responsive design
- **Full accessibility** (WCAG 2.1 AA, ARIA labels, screen readers)
- **Dark/light theme** support with system preference detection
- **Transparent loading screens** that show content behind blur
- **TypeScript strict mode** with comprehensive type safety

## 🛠️ Tech Stack

- **Framework**: Next.js (latest) with App Router & TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui components  
- **Media Storage**: Multi-provider (Cloudinary, S3/Wasabi)
- **Video Handling**: Direct HTML5 playback with presigned URL uploads
- **State Management**: Zustand with localStorage persistence
- **UI Components**: Vaul drawers, Framer Motion animations
- **Icons**: Lucide React icon library
- **Theme**: next-themes for dark/light mode support
- **Validation**: Security-focused with comprehensive input sanitization
- **Accessibility**: WCAG 2.1 AA compliant

## 🚀 Quick Start

1. **Clone and install**

   ```bash
   git clone <repository-url>
   cd wedding-memories
   pnpm install
   ```

2. **Configure environment and settings**

   ```bash
   cp .env.example .env
   # Edit .env with your Cloudinary credentials
   # Edit config.ts for couple names and features
   ```

3. **Start development**

   ```bash
   pnpm dev
   # Open http://localhost:3000
   ```

### Configuration Files

**Environment Variables (.env)**

*For Cloudinary Storage:*
```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
CLOUDINARY_FOLDER=wedding
```

*For S3/Wasabi Storage:*
```bash
# AWS S3 / Wasabi Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
NEXT_PUBLIC_S3_BUCKET=your_bucket_name
NEXT_PUBLIC_S3_ENDPOINT=https://s3.wasabisys.com  # Optional: for Wasabi or other S3-compatible services
```

**App Configuration (config.ts)**
```typescript
export enum StorageProvider {
  Cloudinary = 'cloudinary',
  S3 = 's3',
}

export const appConfig = {
  brideName: 'YourBrideName',
  groomName: 'YourGroomName',
  guestIsolation: false, // Set to true to filter photos by guest
  storage: StorageProvider.Cloudinary, // Storage provider selection
};
```

**Storage Providers**
- **Cloudinary**: Cloud-based media storage with automatic optimization, transformations, and blur placeholders for images/videos
- **S3/Wasabi**: Object storage compatible with AWS S3 API via secure proxy with request deduplication and stream handling
- **Seamless Switching**: Change providers instantly by updating `storage` config - no code changes required
- **Smart Media Handling**: Automatic optimization for Cloudinary, proxy-based serving for S3/Wasabi with progressive video loading
- **Feature Parity**: Download, external links, and all functionality work identically across providers

**S3/Wasabi Presigned URL Architecture**
- **Unified Upload Endpoint**: `/api/upload` handles all media with smart routing based on storage provider
- **Direct Browser Uploads**: Large files upload directly to S3, bypassing Vercel's 10MB limit
- **Private Bucket Support**: Full support for private S3 buckets via presigned URLs
- **Secure Access**: Presigned read URLs (24h expiry) and write URLs (1h expiry)
- **Request Type Detection**: JSON metadata vs FormData automatically detected
- **Storage Agnostic**: Frontend code adapts automatically to configured storage provider
- **No 413 Errors**: Video files >10MB bypass server entirely for S3 uploads
- **Maintains Features**: All Cloudinary optimizations and S3 uploads work seamlessly

**Guest Isolation Mode**
- When `guestIsolation: true`, each guest only sees photos they uploaded
- When `guestIsolation: false`, all guests see all photos (default behavior)
- Server-side rendering shows empty gallery when isolation is enabled

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── photos/        # Photo listing endpoint
│   │   └── upload/        # Unified media upload endpoint
│   ├── page.tsx           # Main gallery page with server components
│   └── loading.tsx        # Global transparent loading UI
├── components/            # React components
│   ├── ui/               # shadcn/ui components (Button, Drawer, etc.)
│   ├── MediaGallery.tsx  # Masonry grid with modal integration for photos/videos
│   ├── StorageAwareMedia.tsx # Storage-agnostic media rendering with HTML5 video
│   ├── MediaModal.tsx    # Modal with pinch-to-zoom and gesture support
│   ├── Upload.tsx        # Unified media upload with presigned URL support
│   ├── AppLoader.tsx     # Startup loader with couple names
│   └── WelcomeDialog.tsx # Guest name collection
├── store/                # Zustand state management
│   └── useAppStore.ts    # Global state store
├── storage/              # Storage abstraction layer
│   ├── StorageService.ts # Storage interface definition
│   ├── CloudinaryService.ts # Cloudinary implementation with blur placeholders
│   ├── S3Service.ts      # S3/Wasabi implementation with presigned URLs
│   └── index.ts          # Provider selection and export
├── utils/                # Utilities and helpers
│   ├── types.ts          # TypeScript interfaces for media data
│   ├── validation.ts     # Input validation utilities with security focus
│   ├── imageUrl.ts       # Storage-agnostic URL generation (MediaUrlService)
│   ├── mediaOptimization.ts  # Storage-aware optimization for images and videos
│   ├── generateBlurPlaceholder.ts # Blur placeholder generation for smooth loading
│   ├── cloudinary.ts     # Cloudinary API integration
│   └── testing.ts        # Test utilities and mocks
├── config.ts             # App configuration (couple names, features)
```

## 📝 Development

```bash
pnpm dev         # Start development server (http://localhost:3000)
pnpm build       # Build for production
pnpm start       # Start production server
pnpm lint        # Run ESLint code linting
pnpm format      # Format code with Prettier
pnpm type-check  # Run TypeScript type checking
```

## 🚀 Deployment

Deploy to [Vercel](https://vercel.com/new/clone) (recommended), Netlify, or any platform supporting Next.js:

1. **Vercel (Recommended)**
   - Connect your GitHub repository
   - Configure environment variables in dashboard
   - Automatic deployments on push to main

2. **Other Platforms**
   - Ensure Node.js 18+ support
   - Configure all environment variables
   - Set build command: `pnpm build`
   - Set output directory: `.next`

## 🔍 Code Quality & Features

- **TypeScript strict mode** with comprehensive type safety
- **WCAG 2.1 AA accessibility** compliance throughout  
- **Security-first validation** with input sanitization and file type checking
- **Advanced name validation** with real-time feedback, length limits, and character restrictions
- **Guest isolation system** with server-side and client-side filtering
- **Mobile-optimized UX** with improved touch targets and responsive dialogs
- **Performance optimizations** with Next.js Image, Cloudinary transformations, and caching
- **Progressive enhancement** with graceful fallbacks for all features
- **Real-time state management** with Zustand and localStorage persistence
- **Mobile-first responsive design** with Tailwind CSS utilities
- **Stable React components** preventing unnecessary re-renders and animations

## 🤝 Contributing

1. Fork the repository and create your branch from `main`
2. Follow coding standards defined in [CONTRIBUTING.md](./CONTRIBUTING.md)
3. Ensure TypeScript strict mode compliance and accessibility standards
4. Test your changes thoroughly, especially upload functionality
5. Run quality checks: `pnpm lint`, `pnpm type-check`, and `pnpm build`
6. Submit a Pull Request with clear description of changes

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

This project was bootstrapped with the
[Next.js Image Gallery Starter](https://vercel.com/templates/next.js/image-gallery-starter) by Vercel.

---

Built with ❤️ using [Next.js](https://nextjs.org), [Cloudinary](https://cloudinary.com), [shadcn/ui](https://ui.shadcn.com), and [Tailwind CSS](https://tailwindcss.com).
