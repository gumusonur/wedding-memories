# Wedding Memories Gallery

A beautiful, modern wedding photo gallery built with Next.js, Cloudinary, and shadcn/ui. This application allows wedding guests to view and upload photos from the celebration in a responsive, elegant interface with customizable couple names and transparent loading screens.

## ✨ Features

### 🖼️ Photo Gallery
- **Responsive masonry layout** with 1-4 columns based on screen size
- **Modal photo viewing** with URL routing (`/p/[photoId]`)
- **Keyboard navigation** (arrow keys, ESC)
- **Smooth animations** powered by Framer Motion
- **Optimized loading** with blur placeholders

### 📤 Photo Upload
- **Multiple file upload** with drag & drop support
- **Thumbnail previews** in grid layout
- **Real-time progress tracking** with visual feedback
- **File type validation** (JPG, PNG, GIF, WebP only)
- **Upload confirmation** with toast notifications
- **Guest name tracking** for photo attribution

### 🎨 User Experience
- **Dark/Light/System theme** support
- **Mobile-first responsive design**
- **Transparent blur loading screens** with content preview
- **App startup loader** with smooth transitions
- **Environment-based couple name configuration**
- **Toast notifications** for user feedback
- **Welcome dialog** with guest name collection

### 🚀 Performance
- **Static generation** with build-time image fetching
- **Cloudinary optimization** for fast image delivery
- **Next.js Image component** with responsive sizes
- **Efficient caching** and CDN delivery

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **Image Storage**: Cloudinary
- **Animations**: Framer Motion
- **State Management**: React Global State
- **TypeScript**: Full type safety
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Cloudinary account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd with-cloudinary-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   
   Copy the example file and configure:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your values:
   ```env
   # Cloudinary Configuration
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CLOUDINARY_FOLDER=wedding-photos
   
   # Couple Names
   NEXT_PUBLIC_BRIDE_NAME=Bride Name
   NEXT_PUBLIC_GROOM_NAME=Groom Name
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/upload/        # Photo upload API endpoint
│   ├── p/[photoId]/       # Individual photo pages
│   ├── page.tsx           # Main gallery page
│   ├── layout.tsx         # Root layout with theme provider
│   └── loading.tsx        # Loading UI with skeletons
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── Upload.tsx        # Photo upload interface
│   ├── Modal.tsx         # Photo modal viewer
│   ├── Carousel.tsx      # Photo navigation
│   └── ModeToggle.tsx    # Theme switcher
├── utils/                # Utility functions
│   ├── cloudinary.ts     # Cloudinary configuration
│   ├── types.ts          # TypeScript interfaces
│   └── generateBlurPlaceholder.ts
├── styles/               # Global styles
└── public/               # Static assets
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name (public) | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key (server-side) | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (server-side) | ✅ |
| `CLOUDINARY_FOLDER` | Folder name for storing photos | ✅ |
| `NEXT_PUBLIC_BRIDE_NAME` | Bride's name for display | ✅ |
| `NEXT_PUBLIC_GROOM_NAME` | Groom's name for display | ✅ |

### Cloudinary Setup

1. Create a [Cloudinary account](https://cloudinary.com)
2. Get your cloud name, API key, and API secret from the dashboard
3. Create a folder for wedding photos (e.g., "wedding-photos")
4. Configure upload presets if needed

## 📱 Usage

### For Guests
1. **View Photos**: Browse the gallery in a beautiful masonry layout
2. **Full-Screen View**: Click any photo to view in modal with navigation
3. **Upload Photos**: Click "Upload Photos" to add your pictures
4. **Theme Toggle**: Switch between dark/light modes

### For Wedding Couple
- Photos are automatically organized in Cloudinary
- Access admin dashboard through Cloudinary console
- Download original photos or create albums
- Monitor upload activity and guest participation

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy with Vercel**
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

3. **Configure environment variables** in Vercel dashboard

4. **Custom domain** (optional) - Add your wedding domain

### Alternative Platforms

- **Netlify**: Works with static export
- **Railway**: Full-stack deployment
- **DigitalOcean**: App platform deployment

## 🎨 Customization

### Branding
- Update couple names in `.env` file (`NEXT_PUBLIC_BRIDE_NAME`, `NEXT_PUBLIC_GROOM_NAME`)
- Replace `public/favicon.ico` with custom icon
- Modify colors in `tailwind.config.js`
- Update metadata in `app/layout.tsx`

### Features
- Add password protection
- Implement admin dashboard
- Create photo albums/categories
- Add photo sharing options

## 📝 Development Commands

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Type checking
pnpm type-check       # Run TypeScript compiler
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - React framework
- [Cloudinary](https://cloudinary.com) - Image management
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Framer Motion](https://framer.com/motion) - Animations

---

Built with ❤️ for creating beautiful wedding memories