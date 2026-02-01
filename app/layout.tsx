"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import  {DetailModal}  from "@/components/DetailModal";

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
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full overflow-hidden`}
      >
        {children}
        <DetailModal />
      </body>
    </html>
  );
}
