import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "../src/styles/animations.css";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ClientProviders } from '@/components/ClientProviders';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0ea5e9',
};

export const metadata: Metadata = {
  title: "Tahitian Tutor - Learn Tahitian Language",
  description: "Interactive Tahitian language learning platform with AI-powered lessons, vocabulary building, and cultural insights.",
  keywords: "Tahitian, language learning, AI tutor, Polynesian culture, French Polynesia",
  authors: [{ name: "Tahitian Tutor Team" }],
  robots: "index, follow",

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Tahitian Tutor - Learn Tahitian Language",
    description: "Interactive Tahitian language learning platform with AI-powered lessons",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tahitian Tutor - Learn Tahitian Language",
    description: "Interactive Tahitian language learning platform with AI-powered lessons",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ErrorBoundary level="critical">
          <ClientProviders>
            {children}
          </ClientProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}