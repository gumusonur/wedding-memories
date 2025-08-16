import { ThemeProvider } from "@/components/theme-provider";
import { AppLoader } from "@/components/AppLoader";
import { ToasterProvider } from "@/components/ToasterProvider";
import type { Metadata } from "next";
import "../styles/index.css";

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_GROOM_NAME} & ${process.env.NEXT_PUBLIC_BRIDE_NAME} Wedding Memories`,
  description: "Beautiful wedding memories captured in time.",
  openGraph: {
    siteName: "nextjsconf-pics.vercel.app",
    description: "See pictures from Next.js Conf and the After Party.",
    title: "Next.js Conf 2022 Pictures",
  },
  twitter: {
    card: "summary_large_image",
    title: "Next.js Conf 2022 Pictures",
    description: "See pictures from Next.js Conf and the After Party.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppLoader>
            {children}
          </AppLoader>
          <ToasterProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}

