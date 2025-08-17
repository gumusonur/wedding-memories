# Wedding Memories Gallery

A modern wedding photo gallery built with Next.js, Cloudinary, and shadcn/ui. Guests can view and upload photos with full keyboard navigation, accessibility support, and responsive design.

## ✨ Features

- **Responsive masonry gallery** with 1-4 columns
- **Modal photo viewing** with URL routing and keyboard navigation
- **Multiple file upload** with drag & drop and batch selection
- **Real-time progress tracking** and file validation
- **Full accessibility** (WCAG 2.1 AA, ARIA labels, screen readers)
- **Dark/light theme** support with system preference detection
- **Static generation** with Cloudinary optimization
- **TypeScript strict mode** with comprehensive validation

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router & TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Images**: Cloudinary with optimization
- **Animations**: Framer Motion
- **Validation**: Custom security-focused utilities
- **Testing**: Jest-ready test utilities and mock factories
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
│   ├── p/[photoId]/       # Individual photo pages
│   └── page.tsx           # Main gallery page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── PhotoGallery.tsx  # Main gallery
│   ├── Upload.tsx        # Photo upload interface
│   └── Modal.tsx         # Photo modal viewer
├── utils/                # Utilities
│   ├── types.ts          # TypeScript interfaces
│   ├── validation.ts     # Input validation
│   ├── errors.ts         # Error handling
│   └── testing.ts        # Test utilities
```

## 📝 Development

```bash
pnpm dev     # Start development server
pnpm build   # Build for production
pnpm lint    # Run ESLint
```

## 🚀 Deployment

Deploy to [Vercel](https://vercel.com/new/clone) (recommended) or any platform supporting Next.js. Don't forget to configure environment variables in your deployment dashboard.

## 🔍 Code Quality

TypeScript strict mode, WCAG 2.1 AA accessibility, security-first validation, and comprehensive testing utilities.

## 🤝 Contributing

1. Fork the repository and create your branch from `main`
2. Follow coding standards (TypeScript, accessibility, security)
3. Add tests and documentation for new features
4. Run `npm run build` to ensure type safety
5. Submit a Pull Request with clear description

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

This project was bootstrapped with the
[Next.js Image Gallery Starter](https://vercel.com/templates/next.js/image-gallery-starter) by Vercel.

---

Built with ❤️ using [Next.js](https://nextjs.org), [Cloudinary](https://cloudinary.com), [shadcn/ui](https://ui.shadcn.com), and [Tailwind CSS](https://tailwindcss.com).

