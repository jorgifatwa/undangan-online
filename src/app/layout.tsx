import type { Metadata, Viewport } from "next";

import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/lib/site";
import "./globals.css";

// Font website dipasang di layout grup (marketing/auth/dashboard), bukan di sini,
// agar halaman undangan (/u, /preview) tidak ikut mengunduhnya. Lihat site-fonts.tsx.

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
      <body className="antialiased">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
