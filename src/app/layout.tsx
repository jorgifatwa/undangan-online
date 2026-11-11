import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.appUrl),
  title: {
    default: `${siteConfig.name} — Undangan Digital Pernikahan & Ulang Tahun`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  themeColor: "#faf6f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${jakarta.variable} ${fraunces.variable} antialiased`}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
