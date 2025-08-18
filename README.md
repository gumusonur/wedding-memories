# Wedding Memories Gallery

A modern wedding photo gallery built with Next.js, Cloudinary, and shadcn/ui. Guests can view and upload photos with real-time gallery updates, full keyboard navigation, and exceptional accessibility support.

## ✨ Features

- **Responsive masonry gallery** with 1-4 columns based on screen size
- **Modal photo viewing** with cached data and keyboard/swipe navigation
- **Multiple file upload** with drag & drop, batch selection, and progress tracking
- **Real-time gallery updates** automatically refresh after uploads
- **Guest welcome system** with name collection and persistent storage
- **Full accessibility** (WCAG 2.1 AA, ARIA labels, screen readers)
- **Dark/light theme** support with system preference detection
- **Transparent loading screens** that show content behind blur
- **TypeScript strict mode** with comprehensive validation

## 🛠️ Tech Stack

- **Framework**: Next.js (latest) with App Router & TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Images**: Cloudinary with optimization and transformations
- **State Management**: Zustand with persistence
- **UI Components**: Vaul drawers, Framer Motion animations
- **Validation**: Custom security-focused utilities
- **Testing**: Comprehensive test utilities and mock factories
- **Accessibility**: WCAG 2.1 AA compliant

## 🚀 Quick Start

1. **Clone and install**

   ```bash
   git clone <repository-url>
   cd wedding-memories
   pnpm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your Cloudinary credentials and couple names
   ```

3. **Start development**

   ```bash
   pnpm dev
   # Open http://localhost:3000
   ```

### Required Environment Variables

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` & `CLOUDINARY_API_SECRET` - API credentials
- `CLOUDINARY_FOLDER` - Photo storage folder
- `NEXT_PUBLIC_BRIDE_NAME` & `NEXT_PUBLIC_GROOM_NAME` - Display names

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes (photos, upload)
│   ├── page.tsx           # Main gallery page with server components
│   └── loading.tsx        # Global transparent loading UI
├── components/            # React components
│   ├── ui/               # shadcn/ui components (Button, Drawer, etc.)
│   ├── PhotoGallery.tsx  # Masonry grid with modal integration
│   ├── Upload.tsx        # Photo upload with progress tracking
│   ├── CachedModal.tsx   # Modal with photo caching
│   ├── AppLoader.tsx     # Startup loader with couple names
│   └── WelcomeDialog.tsx # Guest name collection
├── store/                # Zustand state management
│   └── useAppStore.ts    # Global state store
├── utils/                # Utilities and helpers
│   ├── types.ts          # TypeScript interfaces
│   ├── validation.ts     # Input validation
│   ├── cloudinary.ts     # Cloudinary API integration
│   ├── imageOptimization.ts # Image processing helpers
│   └── testing.ts        # Test utilities and mocks
```

## 📝 Development

```bash
pnpm dev         # Start development server
pnpm build       # Build for production
pnpm start       # Start production server
pnpm lint        # Run ESLint
pnpm format      # Format code with Prettier
pnpm type-check  # Run TypeScript type checking
```

## 🚀 Deployment

Deploy to [Vercel](https://vercel.com/new/clone) (recommended) or any platform supporting Next.js. Don't forget to configure environment variables in your deployment dashboard.

## 🔍 Code Quality

- **TypeScript strict mode** with comprehensive type safety
- **WCAG 2.1 AA accessibility** compliance throughout
- **Security-first validation** with input sanitization
- **Comprehensive testing utilities** and mock factories
- **Performance optimizations** with caching and progressive loading
- **Real-time state management** with Zustand persistence

## 🤝 Contributing

1. Fork the repository and create your branch from `main`
2. Follow coding standards (TypeScript, accessibility, security)
3. Add tests and documentation for new features
4. Run `pnpm build` and `pnpm type-check` to ensure quality
5. Submit a Pull Request with clear description

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

This project was bootstrapped with the
[Next.js Image Gallery Starter](https://vercel.com/templates/next.js/image-gallery-starter) by Vercel.

---

Built with ❤️ using [Next.js](https://nextjs.org), [Cloudinary](https://cloudinary.com), [shadcn/ui](https://ui.shadcn.com), and [Tailwind CSS](https://tailwindcss.com).

