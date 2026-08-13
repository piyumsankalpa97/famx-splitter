import type { Metadata, Viewport } from "next";
import { Fredoka, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { IdentityHeader } from "@/components/IdentityHeader";
import { BottomNav } from "@/components/BottomNav";
import { Suspense } from "react";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Anu Pol Trip",
  description: "Private expense splitter for the Anu Pol trip.",
};

export const viewport: Viewport = {
  width: 'device-width',
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
    <html lang="en">
      <body
        className={`${inter.variable} ${fredoka.variable} ${plexMono.variable} antialiased bg-[#e2e8f0] text-[#1B2A4A] h-[100dvh] overflow-hidden flex justify-center`}
      >
        <div className="w-full max-w-[430px] bg-[#F7F9FC] h-[100dvh] relative shadow-2xl flex flex-col overflow-hidden">
          <Suspense fallback={null}>
            <IdentityHeader />
          </Suspense>
          
          <main className="flex-1 overflow-y-auto h-full scroll-smooth relative z-0">
            {children}
          </main>

          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
        </div>
      </body>
    </html>
  );
}
