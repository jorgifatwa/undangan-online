"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * "HP BERCERITA": HP menempel di layar saat digulir; isinya berganti mengikuti
 * langkah yang sedang dibaca (gambar layar tema asli Tirai Beludru,
 * pnpm landing:record & landing:story). Ringan: satu IntersectionObserver,
 * tanpa scroll handler; gambar selain pertama dimuat lambat.
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
    <div className="grid gap-x-16 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px]">
      {/* HP menempel (di HP: di atas, kecil) */}
      <div className="sticky top-20 z-[1] order-first mx-auto mb-6 w-[150px] self-start md:top-[calc(50vh-300px)] md:order-last md:mb-0 md:w-[290px] lg:w-[300px]">
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
        <ol className="mt-4 flex justify-center gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <li
              key={s.img}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                i === active ? "bg-primary w-6" : "bg-foreground/15 w-1.5",
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
            className="flex min-h-[70vh] items-center md:min-h-[82vh]"
          >
            <div
              className={cn(
                "bg-background/85 max-w-md rounded-3xl p-6 backdrop-blur transition-all duration-700 md:bg-transparent md:p-0 md:backdrop-blur-none",
                i === active ? "opacity-100" : "opacity-35 md:translate-y-2",
              )}
            >
              <p className="text-gold text-[11px] font-semibold tracking-[0.24em] uppercase">
                {String(i + 1).padStart(2, "0")} · {s.eyebrow}
              </p>
              <h3 className="font-heading mt-3 text-3xl leading-tight tracking-tight sm:text-4xl">
                {s.title}
              </h3>
              <p className="text-muted-foreground mt-3 leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
