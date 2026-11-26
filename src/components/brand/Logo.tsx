import { cn } from "@/lib/utils";

/**
 * Logo undanganonline.id — digambar ulang sebagai SVG dari file asli pemilik
 * (.reference/logo; ikon segel + tulisan Playfair Display Italic & Plus Jakarta
 * Sans sebagai path). File di public/brand/.
 *  - default : segel marun, tulisan marun (latar terang)
 *  - emas    : segel & tulisan emas (latar gelap/marun)
 *  - hitam   : satu warna (cetak)
 */
const FILES = {
  default: "/brand/logo.svg",
  tagline: "/brand/logo-tagline.svg",
  emas: "/brand/logo-emas.svg",
  hitam: "/brand/logo-hitam.svg",
} as const;

export function Logo({
  variant = "default",
  className,
}: {
  variant?: keyof typeof FILES;
  className?: string;
}) {
  const tall = variant === "tagline";
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG statis kecil, tidak perlu optimasi gambar
    <img
      src={FILES[variant]}
      alt="undanganonline.id"
      width={970}
      height={tall ? 252 : 172}
      className={cn("h-8 w-auto", className)}
      decoding="async"
    />
  );
}

/** Ikon segel saja (marun, atau emas untuk latar gelap). */
export function LogoMark({
  variant = "default",
  className,
}: {
  variant?: "default" | "emas";
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG statis kecil
    <img
      src={variant === "emas" ? "/brand/ikon-emas.svg" : "/brand/ikon.svg"}
      alt=""
      aria-hidden
      width={672}
      height={660}
      className={cn("size-9", className)}
      decoding="async"
    />
  );
}
