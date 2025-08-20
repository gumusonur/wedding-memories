import { ThemeProvider } from '@/components/theme-provider';
import { AppLoader } from '@/components/AppLoader';
import { ToasterProvider } from '@/components/ToasterProvider';
import { WelcomeDialog } from '@/components/WelcomeDialog';
import type { Metadata, Viewport } from 'next';
import '../styles/index.css';

const groomName = process.env.NEXT_PUBLIC_GROOM_NAME || 'Groom';
const brideName = process.env.NEXT_PUBLIC_BRIDE_NAME || 'Bride';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: `${brideName} & ${groomName} Wedding Memories`,
  description: 'Beautiful wedding memories captured in time.',
  openGraph: {
    title: `${brideName} & ${groomName} Wedding Memories`,
    description: 'Beautiful wedding memories captured in time.',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${brideName} & ${groomName} Wedding Memories`,
    description: 'Beautiful wedding memories captured in time.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppLoader>{children}</AppLoader>
          <ToasterProvider />
          <WelcomeDialog />
        </ThemeProvider>
      </body>
    </html>
  );
}
