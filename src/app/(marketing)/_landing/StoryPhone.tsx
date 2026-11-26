"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * "HP BERCERITA": HP menempel di layar saat digulir; isinya berganti mengikuti
 * langkah yang sedang dibaca (gambar layar tema asli Tirai Beludru,
 * pnpm landing:record & landing:story). Di HP: HP kecil di kiri, teks di kanan
 * (tidak bertumpuk). Ringan: satu IntersectionObserver, tanpa scroll handler.
 */
const STEPS = [
  {
    img: "/landing/hero.webp",
    eyebrow: "Sampul",
    title: "Disambut dengan namanya sendiri",
    body: "Setiap tamu melihat namanya di sampul. Ketuk amplop bersegel lilin, tirai beludru pun tersibak.",
  },
  {
    img: "/landing/story-profil.webp",
    eyebrow: "Mempelai",
    title: "Perkenalkan kalian berdua",
    body: "Foto, nama lengkap, dan orang tua — ditata seperti undangan cetak yang dirancang khusus.",
  },
  {
    img: "/landing/story-acara.webp",
    eyebrow: "Acara",
    title: "Waktu & tempat yang jelas",
    body: "Akad dan resepsi, hitung mundur, peta lokasi, sampai simpan ke kalender — sekali ketuk.",
  },
  {
    img: "/landing/story-ucapan.webp",
    eyebrow: "RSVP & ucapan",
    title: "Kehadiran & doa langsung terkumpul",
    body: "Tamu mengonfirmasi kehadiran dan menulis ucapan. Rekapnya muncul di dashboard Anda.",
  },
  {
    img: "/landing/story-galeri.webp",
    eyebrow: "Galeri",
    title: "Kenangan yang ikut dibagikan",
    body: "Hingga 12 foto dengan tata letak yang rapi — tetap tajam dan ringan dibuka di HP.",
  },
];

export function StoryPhone() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid grid-cols-[108px_1fr] gap-x-5 sm:grid-cols-[150px_1fr] sm:gap-x-8 md:grid-cols-[1fr_340px] md:gap-x-16 lg:grid-cols-[1fr_380px]">
      {/* HP menempel: di HP kecil di kiri, di layar lebar di kanan */}
      <div className="sticky top-[calc(50vh-125px)] z-[1] w-full self-start sm:top-[calc(50vh-170px)] md:top-[calc(50vh-300px)] md:order-last md:mx-auto md:w-[290px] lg:w-[300px]">
        <div className="phone">
          <div className="screen aspect-[540/1168]">
            {STEPS.map((s, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- gambar layar statis, ukuran tetap
              <img
                key={s.img}
                src={s.img}
                alt={i === active ? `Contoh bagian ${s.eyebrow} undangan tema Tirai Beludru` : ""}
                width={540}
                height={1168}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                className={cn(
                  "story-screen absolute inset-0 h-full w-full object-cover",
                  i === active ? "is-active" : i < active ? "is-past" : "",
                )}
              />
            ))}
          </div>
        </div>
        <ol className="mt-3 flex justify-center gap-1 md:mt-4 md:gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <li
              key={s.img}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                i === active ? "bg-primary w-4 md:w-6" : "bg-foreground/15 w-1 md:w-1.5",
              )}
            />
          ))}
        </ol>
      </div>

      <ol className="relative">
        {STEPS.map((s, i) => (
          <li
            key={s.img}
            data-step={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="flex min-h-[62vh] items-center md:min-h-[82vh]"
          >
            <div
              className={cn(
                "max-w-md transition-all duration-700",
                i === active ? "opacity-100" : "opacity-30 md:translate-y-2",
              )}
            >
              <p className="text-gold-ink text-[11px] font-semibold tracking-[0.24em] uppercase">
                {String(i + 1).padStart(2, "0")} · {s.eyebrow}
              </p>
              <h3 className="font-heading mt-2 text-2xl leading-tight tracking-tight sm:mt-3 sm:text-4xl">
                {s.title}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed sm:mt-3 sm:text-base">
                {s.body}
              </p>
            </div>
          </li>
        ))}
        {/* Ajakan langsung ke tema andalan */}
        <li className="flex min-h-[40vh] items-center md:min-h-[50vh]">
          <div className="max-w-md">
            <p className="font-heading text-2xl leading-tight sm:text-3xl">
              Jatuh hati dengan Tirai Beludru?
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button asChild size="lg" className="h-11 rounded-full px-6">
                <Link href="/pesan/tirai-beludru">Pesan Tirai Beludru</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 rounded-full bg-transparent px-6"
              >
                <Link href="/preview/tirai-beludru">Coba dulu</Link>
              </Button>
            </div>
          </div>
        </li>
      </ol>
    </div>
  );
}
