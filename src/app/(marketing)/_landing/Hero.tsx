import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { business } from "@/config/business";
import { PACKAGES } from "@/lib/packages";

import { HeroVideo } from "./HeroVideo";

export function Hero() {
  const trial = PACKAGES.FREE.features.activeDays;
  return (
    <section className="paper relative overflow-hidden">
      {/* lengkung lembut di belakang HP */}
      <div
        aria-hidden
        className="bg-sand absolute top-24 -right-24 bottom-0 hidden w-[520px] rounded-t-full md:block lg:right-[6%]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-8 pb-14 sm:px-6 md:grid-cols-[1.15fr_1fr] md:gap-12 md:pt-16 md:pb-24">
        <div>
          <p className="text-muted-foreground flex items-center gap-3 text-[11px] font-semibold tracking-[0.22em] uppercase">
            <span className="bg-gold h-px w-8" aria-hidden />
            <span className="sm:hidden">Pernikahan & ulang tahun</span>
            <span className="hidden sm:inline">Undangan pernikahan & ulang tahun online</span>
          </p>
          <h1 className="font-heading mt-5 text-[2.6rem] leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
            {business.tagline.split(" ").slice(0, -2).join(" ")}{" "}
            <span className="text-primary">{business.tagline.split(" ").slice(-2).join(" ")}</span>
          </h1>
          <p className="text-muted-foreground mt-5 max-w-lg text-[17px] text-pretty sm:mt-6 sm:text-lg">
            Undangan digital pernikahan & ulang tahun dengan tema yang hangat. Sapa setiap tamu
            dengan namanya, kumpulkan RSVP & ucapan, lalu kirim lewat WhatsApp dalam hitungan menit.
          </p>
          <div className="mt-7 flex gap-2.5 sm:mt-8 sm:gap-3">
            <Link
              href="/masuk"
              className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-[15px] font-medium whitespace-nowrap shadow-[0_12px_30px_-12px_rgb(120_50_25/0.6)] transition-transform hover:-translate-y-0.5 sm:px-6 sm:text-base"
            >
              Buat Undangan Gratis <ArrowRight className="hidden size-4 sm:block" aria-hidden />
            </Link>
            <Link
              href="/#tema"
              className="border-foreground/15 hover:bg-sand rounded-full border px-5 py-3.5 text-[15px] font-medium whitespace-nowrap sm:px-6 sm:text-base"
            >
              Lihat Tema
            </Link>
          </div>
          <ul className="text-muted-foreground mt-6 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] sm:mt-8 sm:gap-x-5 sm:text-sm">
            <li>✦ Coba gratis {trial} hari</li>
            <li>✦ Tanpa aplikasi</li>
            <li>✦ Ganti tema kapan saja</li>
          </ul>
        </div>

        <div className="relative mx-auto w-[min(78vw,300px)] md:w-[320px]">
          <div className="float-slow">
            <div className="phone rotate-[-2.5deg]">
              <div className="screen aspect-[540/1168]">
                {/* eslint-disable-next-line @next/next/no-img-element -- gambar diam statis, ukuran tetap */}
                <img
                  src="/landing/hero.webp"
                  alt="Contoh undangan pernikahan digital tema Renda Rimba di layar HP"
                  width={540}
                  height={1168}
                  fetchPriority="high"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <HeroVideo />
              </div>
            </div>
          </div>
          <div
            aria-hidden
            className="border-gold/60 absolute -bottom-6 -left-10 size-28 rounded-full border"
          />
        </div>
      </div>
    </section>
  );
}
