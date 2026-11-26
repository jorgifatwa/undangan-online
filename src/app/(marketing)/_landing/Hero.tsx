import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { business } from "@/config/business";
import { THEME_MANIFESTS } from "@/themes/registry";

import { bouquetHanging, velvetBg, waxSeal } from "./art";
import { HeroVideo } from "./HeroVideo";
import { PhoneThumb } from "./PhoneThumb";

const LABELS = ["Pernikahan", "Ulang tahun", "Kirim lewat WhatsApp"];

/**
 * Hero editorial: label kecil, judul serif sangat besar, lalu panel "foto"
 * bertekstur daun berisi tiga HP (tengah = video tema asli) & ornamen.
 */
export function Hero() {
  const words = business.tagline.split(" ");
  // tengah = Tirai Beludru (tema andalan, video asli); samping = dua tema lain
  const sideThemes = ["lili", "renda-rimba"]
    .map((id) => THEME_MANIFESTS.find((m) => m.id === id))
    .filter((m): m is (typeof THEME_MANIFESTS)[number] => !!m);
  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 md:pt-16">
        <ul className="hero-fade text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-semibold tracking-[0.22em] uppercase">
          {LABELS.map((l) => (
            <li key={l}>
              <span className="text-gold">+</span> {l}
            </li>
          ))}
        </ul>
        <div className="mt-6 grid items-end gap-8 lg:grid-cols-[1.5fr_1fr]">
          <h1 className="font-heading text-[2.9rem] leading-[0.98] tracking-tight text-balance sm:text-7xl lg:text-[5.6rem]">
            {words.map((w, i) => (
              <span key={`${w}-${i}`}>
                <span className="hero-word">
                  <span
                    style={{ ["--i" as string]: i }}
                    className={
                      i >= words.length - 2 ? "text-primary font-normal italic" : undefined
                    }
                  >
                    {w}
                  </span>
                </span>{" "}
              </span>
            ))}
          </h1>
          <div className="hero-fade space-y-6 lg:pb-3">
            <p className="text-muted-foreground text-[17px] leading-relaxed text-pretty">
              Undangan digital pernikahan & ulang tahun dengan tema yang hangat. Pilih tema, isi
              sendiri sambil melihat hasilnya, lalu sapa setiap tamu dengan namanya.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full px-6 text-[15px] shadow-[0_12px_30px_-12px_rgb(110_20_35/0.5)]"
              >
                <Link href="/tema">
                  Pilih tema <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full bg-transparent px-6 text-[15px]"
              >
                <Link href="/#demo">Coba dengan namamu</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Panel "foto": tekstur beludru (Tirai Beludru) + tiga HP + ornamen */}
      <div className="mx-auto mt-10 max-w-[1320px] px-2 sm:px-4 md:mt-14">
        <div
          className="photo-panel relative h-[460px] overflow-hidden rounded-[32px] sm:h-[540px] lg:h-[600px]"
          data-reveal="curtain"
          style={{ ["--reveal-delay" as string]: "var(--intro-delay, 0s)" }}
        >
          <Image
            src={velvetBg}
            alt=""
            fill
            priority
            sizes="100vw"
            className="scale-110 object-cover"
          />
          <div className="relative z-[1] flex h-full items-end justify-center gap-4 pb-0 sm:gap-8">
            {sideThemes[0] && (
              <PhoneThumb
                theme={sideThemes[0]}
                className="mb-[-40px] hidden w-[200px] -rotate-6 sm:block lg:w-[230px]"
              />
            )}
            <div className="phone mb-[-60px] w-[250px] sm:w-[280px] lg:w-[300px]">
              <div className="screen aspect-[540/1168]">
                {/* eslint-disable-next-line @next/next/no-img-element -- gambar diam statis, ukuran tetap */}
                <img
                  src="/landing/hero.webp"
                  alt="Contoh undangan pernikahan digital tema Tirai Beludru di layar HP"
                  width={540}
                  height={1168}
                  fetchPriority="high"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <HeroVideo />
              </div>
            </div>
            {sideThemes[1] && (
              <PhoneThumb
                theme={sideThemes[1]}
                className="mb-[-40px] hidden w-[200px] rotate-6 sm:block lg:w-[230px]"
              />
            )}
          </div>
          <Image
            src={bouquetHanging}
            alt=""
            width={300}
            className="pointer-events-none absolute -top-4 -left-6 z-[2] w-44 drop-shadow-2xl sm:w-64"
          />
          <Image
            src={waxSeal}
            alt=""
            width={120}
            className="pointer-events-none absolute right-6 bottom-10 z-[2] w-16 drop-shadow-xl sm:right-14 sm:w-24"
          />
          <p className="absolute top-6 right-6 z-[2] hidden max-w-[240px] text-right text-sm leading-snug text-white/85 md:block">
            <span className="text-gold block text-[11px] font-semibold tracking-[0.22em] uppercase">
              Tema andalan
            </span>
            Tirai Beludru — tirai beludru yang tersibak, amplop bersegel lilin, dan buket bunga.
          </p>
        </div>
      </div>
    </section>
  );
}
