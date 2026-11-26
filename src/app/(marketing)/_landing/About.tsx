import Image from "next/image";

import { LIMITS } from "@/lib/pricing";
import { THEME_MANIFESTS } from "@/themes/registry";

import { laceDoily, leafBg, waxSealGold } from "./art";
import { CountUp } from "./CountUp";
import { PhoneThumb } from "./PhoneThumb";

/** Kalimat besar + kolase bertekstur, lalu fakta produk (angka jujur, bukan klaim). */
export function About() {
  const featured = THEME_MANIFESTS.find((m) => m.id === "renda-rimba") ?? THEME_MANIFESTS[0];
  const facts = [
    { n: THEME_MANIFESTS.length, s: "", l: "tema beranimasi" },
    { n: LIMITS.galleryPhotos, s: "", l: "foto galeri per undangan" },
    { n: 1, s: "×", l: "bayar, tanpa langganan" },
    { n: 0, s: "", l: "aplikasi yang perlu dipasang" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p
            data-reveal
            className="text-gold-ink text-[11px] font-semibold tracking-[0.24em] uppercase"
          >
            Tentang kami
          </p>
          <h2
            className="font-heading mt-4 text-4xl leading-[1.08] tracking-tight text-balance sm:text-5xl"
            data-reveal="mask"
          >
            Undangan yang terasa seperti{" "}
            <em className="text-primary italic">kertas, renda, dan segel lilin</em> — tapi sampai ke
            tamu lewat WhatsApp.
          </h2>
          <p data-reveal className="text-muted-foreground mt-6 max-w-lg leading-relaxed">
            Setiap tema kami gambar ulang dengan detail undangan cetak: tekstur, ornamen, dan
            animasi pembuka. Anda tinggal mengisi, tamu tinggal membuka — disapa dengan namanya.
          </p>
        </div>
        <div
          className="photo-panel relative h-[440px] overflow-hidden rounded-[32px]"
          data-reveal="curtain"
        >
          <Image
            src={leafBg}
            alt=""
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover"
          />
          <Image
            src={laceDoily}
            alt=""
            width={320}
            className="absolute top-8 -left-10 z-[1] w-56 -rotate-12 opacity-95 drop-shadow-2xl sm:w-72"
          />
          <PhoneThumb
            theme={featured}
            sizes="200px"
            className="absolute right-10 bottom-[-30px] z-[2] w-[180px] rotate-6 sm:w-[200px]"
          />
          <Image
            src={waxSealGold}
            alt=""
            width={110}
            className="absolute bottom-10 left-10 z-[3] w-20 drop-shadow-xl sm:w-24"
          />
        </div>
      </div>
      <dl className="mt-16 grid grid-cols-2 gap-y-8 border-t pt-10 sm:grid-cols-4">
        {facts.map((f) => (
          <div key={f.l} data-reveal>
            <dt className="font-heading text-5xl tracking-tight sm:text-6xl">
              <CountUp to={f.n} suffix={f.s} />
            </dt>
            <dd className="text-muted-foreground mt-2 text-sm">{f.l}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
