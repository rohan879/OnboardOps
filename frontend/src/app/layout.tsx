import type { Metadata } from "next";
import { IBM_Plex_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OnboardOps Dashboard",
  description: "The 10-Minute Repo Whisperer",
};

// Viewport locked to 1920×1080 for hackathon demo
export const viewport = {
  width: 1920,
  height: 1080,
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-ibm-gray-100">{children}</body>
    </html>
  );
}
