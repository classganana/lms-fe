"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DetailModal } from "@/components/DetailModal";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full overflow-hidden bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <DetailModal />
        </ThemeProvider>
      </body>
    </html>
  );
}
