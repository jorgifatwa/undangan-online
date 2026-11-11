import Link from "next/link";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

/** Landing sementara — desain lengkap dibuat di tahap landing page. */
export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="text-muted-foreground mb-4 text-sm tracking-[0.2em] uppercase">
        {siteConfig.name}
      </p>
      <h1 className="font-heading max-w-xl text-4xl leading-tight text-balance sm:text-5xl">
        Undangan digital yang hangat, untuk hari paling berharga.
      </h1>
      <p className="text-muted-foreground mt-5 max-w-md text-balance">
        Pernikahan dan ulang tahun. Pilih tema, isi data, bagikan lewat WhatsApp.
      </p>
      <Button asChild size="lg" className="mt-8 rounded-full px-8">
        <Link href="/masuk">Buat Undangan Gratis</Link>
      </Button>
    </main>
  );
}
