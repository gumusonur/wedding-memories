# Wedding Memories Gallery

A modern, accessible wedding photo gallery built with Next.js, Cloudinary, and shadcn/ui. Guests can view and upload photos with real-time gallery updates, full keyboard navigation, and exceptional accessibility support.

🌐 **[Live Demo](https://wedding.onurgumus.com)**

## ✨ Features

- **Responsive masonry gallery** with 1-4 columns based on screen size
- **Modal photo viewing** with cached data and keyboard/swipe navigation
- **Multiple file upload** with drag & drop, batch selection, and progress tracking
- **Real-time gallery updates** automatically refresh after uploads
- **Guest welcome system** with name collection and persistent storage
- **Guest isolation mode** - filter photos by guest when enabled in config
- **Advanced name validation** with real-time feedback and comprehensive rules
- **Mobile-optimized UX** with improved touch targets and responsive design
- **Full accessibility** (WCAG 2.1 AA, ARIA labels, screen readers)
- **Dark/light theme** support with system preference detection
- **Transparent loading screens** that show content behind blur
- **TypeScript strict mode** with comprehensive validation

## 🛠️ Tech Stack

- **Framework**: Next.js (latest) with App Router & TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui components  
- **Images**: Cloudinary with optimization and transformations
- **State Management**: Zustand with localStorage persistence
- **UI Components**: Vaul drawers, Framer Motion animations
- **Icons**: Lucide React icon library
- **Theme**: next-themes for dark/light mode support
- **Validation**: Custom security-focused utilities
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
```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
CLOUDINARY_FOLDER=wedding
```

**App Configuration (config.ts)**
```typescript
export const appConfig = {
  brideName: 'YourBrideName',
  groomName: 'YourGroomName',
  guestIsolation: false, // Set to true to filter photos by guest
};
```

**Guest Isolation Mode**
- When `guestIsolation: true`, each guest only sees photos they uploaded
- When `guestIsolation: false`, all guests see all photos (default behavior)
- Server-side rendering shows empty gallery when isolation is enabled

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes (photos, upload)
│   ├── page.tsx           # Main gallery page with server components
│   └── loading.tsx        # Global transparent loading UI
├── components/            # React components
│   ├── ui/               # shadcn/ui components (Button, Drawer, etc.)
│   ├── PhotoGallery.tsx  # Masonry grid with modal integration
│   ├── Upload.tsx        # Photo upload with name validation
│   ├── CachedModal.tsx   # Modal with photo caching
│   ├── AppLoader.tsx     # Startup loader with couple names
│   └── WelcomeDialog.tsx # Guest name collection
├── store/                # Zustand state management
│   └── useAppStore.ts    # Global state store
├── utils/                # Utilities and helpers
│   ├── types.ts          # TypeScript interfaces
│   ├── validation.ts     # Input validation utilities
│   ├── cloudinary.ts     # Cloudinary API integration
│   ├── imageOptimization.ts # Image processing helpers
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
