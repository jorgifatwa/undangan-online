import { RevealObserver } from "@/components/marketing/Reveal";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";

import { SiteFonts } from "../site-fonts";
import "./marketing.css";

/** Halaman website publik (tanpa login): landing, tema, harga, tentang, legal. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SiteFonts>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </div>
      <RevealObserver />
    </SiteFonts>
  );
}
