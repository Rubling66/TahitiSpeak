import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ClientProviders } from '@/components/ClientProviders';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tahitian Tutor - Learn Tahitian Language",
  description: "Interactive Tahitian language learning platform with AI-powered lessons, vocabulary building, and cultural insights.",
  keywords: "Tahitian, language learning, AI tutor, Polynesian culture, French Polynesia",
  authors: [{ name: "Tahitian Tutor Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
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
      <head>
        <meta name="theme-color" content="#0ea5e9" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
