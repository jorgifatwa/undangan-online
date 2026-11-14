"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import type { Photo } from "@/schemas/common";
import type { SectionId } from "@/schemas/sections";

import { AssetImg, useSlotAsset } from "../_shared/assets";
import { useInvitation } from "../_shared/runtime/context";
import { SectionShell } from "../_shared/runtime/SectionShell";

/**
 * Sistem kanvas Pita Krayon: desain referensi (Canva) selebar 430 px.
 * `u(px)` → cqw (section memakai container-type: inline-size), jadi angka di
 * tema ini = koordinat px desain asli. Bagian yang berisi data pengguna
 * MENGALIR (tinggi mengikuti isi), ornamen diposisikan absolut.
 */
export const CANVAS_W = 430;
export const u = (px: number) => `${((px / CANVAS_W) * 100).toFixed(4)}cqw`;

export const F = {
  hand: "var(--pk-hand), 'Gaegu', 'Comic Sans MS', cursive",
  count: "var(--pk-count), Arial, sans-serif",
} as const;

export function txt(
  size: number,
  lh: number,
  o: {
    color?: string;
    ls?: number;
    weight?: 400 | 700;
    align?: React.CSSProperties["textAlign"];
    upper?: boolean;
    font?: string;
  } = {},
): React.CSSProperties {
  return {
    fontFamily: o.font ?? F.hand,
    fontSize: u(size),
    lineHeight: lh < 4 ? String(lh) : u(lh),
    letterSpacing: o.ls ? u(o.ls) : undefined,
    fontWeight: o.weight ?? 400,
    color: o.color ?? "var(--inv-ink)",
    textAlign: o.align ?? "center",
    textTransform: o.upper ? "uppercase" : undefined,
  };
}

export function box(l: number, t: number, w?: number, h?: number): React.CSSProperties {
  return {
    position: "absolute",
    left: u(l),
    top: u(t),
    width: w === undefined ? undefined : u(w),
    height: h === undefined ? undefined : u(h),
  };
}

/* --------------------------- Teks dekoratif EN/ID -------------------------- */

const DECOR = {
  en: {
    turning: "IS TURNING",
    birthdayOf: (n: string) => `IT'S ${n}'S BIRTHDAY!`,
    saveDate: ["SAVE", "THE", "DATE!"],
    dday: "D-day !!",
    listen: "Click play button to listen..",
    story: "Birthday Story",
    seeYou: "SEE YOU",
    seeYouOn: "ON",
    units: ["DAYS", "HOURS", "MINUTES", "SECONDS"],
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    gallery: "Photo Booth",
    gift: "Birthday Gift",
    wishlist: "Wishlist",
    dress: "Dress Code",
    live: "Live Streaming",
    thanks: "THANK YOU!",
    seeThere: "see you there ✨",
  },
  id: {
    turning: "GENAP",
    birthdayOf: (n: string) => `${n} ULANG TAHUN!`,
    saveDate: ["CATAT", "TANGGAL", "NYA!"],
    dday: "Hari-H !!",
    listen: "Ketuk tombol play untuk mendengarkan..",
    story: "Cerita Ulang Tahun",
    seeYou: "SAMPAI",
    seeYouOn: "JUMPA",
    units: ["HARI", "JAM", "MENIT", "DETIK"],
    days: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    gallery: "Kumpulan Foto",
    gift: "Kado Ulang Tahun",
    wishlist: "Daftar Keinginan",
    dress: "Dress Code",
    live: "Siaran Langsung",
    thanks: "TERIMA KASIH!",
    seeThere: "sampai jumpa ✨",
  },
} as const;

/** Bahasa teks HIASAN tema (decorLang); form & tombol selalu bahasa Indonesia. */
export function useDecor() {
  const { inv } = useInvitation();
  const lang: "en" | "id" =
    inv.eventType === "BIRTHDAY" && inv.data.decorLang === "id" ? "id" : "en";
  return { lang, t: DECOR[lang] };
}

/** Akhiran urutan Inggris: 1ST, 2ND, 3RD, 11TH, 21ST. */
export function ordinal(n: number) {
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 13) return "TH";
  return ({ 1: "ST", 2: "ND", 3: "RD" } as Record<number, string>)[n % 10] ?? "TH";
}

/** Nama panggilan (atau kata pertama nama lengkap) untuk judul hiasan. */
export function useNick() {
  const { inv } = useInvitation();
  if (inv.eventType !== "BIRTHDAY") return "";
  const c = inv.data.celebrant;
  return (c.nickname || c.name.split(/\s+/)[0] || "").trim();
}

/* ------------------------------ Animasi masuk ------------------------------ */

/** true sekali setelah elemen terlihat (threshold), tidak kembali false. */
export function useEnter(
  ref: React.RefObject<HTMLElement | null>,
  threshold = 0.18,
  enabled = true,
): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || on || !enabled) return;
    if (!("IntersectionObserver" in window)) return setOn(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, on, enabled]);
  return on;
}

/**
 * Section kanvas. Kelas `pk-in` dipasang sekali saat section terlihat (dan
 * cover sudah dibuka — isi disiapkan di balik cover); elemen `data-a` di
 * theme.css menunggu kelas itu.
 */
export function Section({
  id,
  minHeight,
  bg = "var(--inv-bg)",
  overflow = "clip",
  threshold,
  style,
  children,
}: {
  id: SectionId;
  minHeight?: number;
  bg?: string;
  overflow?: "visible" | "clip";
  threshold?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { opened } = useInvitation();
  const entered = useEnter(ref, threshold, opened);
  return (
    <SectionShell
      id={id}
      className={`pk-sec ${entered ? "pk-in" : ""}`}
      style={{
        position: "relative",
        width: "100%",
        minHeight: minHeight ? u(minHeight) : undefined,
        containerType: "inline-size",
        background: bg,
        overflow,
        contentVisibility: "visible",
        color: "var(--inv-ink)",
        ...style,
      }}
    >
      <div ref={ref} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      {children}
    </SectionShell>
  );
}

/**
 * Efek mesin ketik seperti desain: huruf muncul satu per satu (±55 ms),
 * murni CSS. Teks utuh tetap ada untuk pembaca layar (aria-label).
 * `instant` = tanpa animasi (mis. nama — harus terlihat sejak HTML pertama).
 */
export function Typewriter({
  text,
  delay = 0,
  step = 0.055,
  instant,
}: {
  text: string;
  delay?: number;
  step?: number;
  instant?: boolean;
}) {
  if (instant) return <>{text}</>;
  return (
    <span aria-label={text} role="text">
      {[...text].map((ch, i) => (
        <span
          key={i}
          aria-hidden
          className="pk-tw"
          style={{ ["--d" as string]: `${(delay + i * step).toFixed(3)}s` }}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

/** Kecilkan teks satu baris bila lebih lebar dari kotaknya (nama panjang). */
export function useFit<T extends HTMLElement>(key: string, limit = 1) {
  const ref = useRef<T | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      el.style.setProperty("--fit", "1");
      const need = el.scrollWidth;
      const have = el.clientWidth * limit;
      if (need > have + 1)
        el.style.setProperty("--fit", Math.max(0.45, (have / need) * 0.98).toFixed(3));
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => undefined);
  }, [key, limit]);
  return ref;
}
export const fitSize = (size: number) => `calc(${u(size)} * var(--fit, 1))`;

/* --------------------------------- Ornamen --------------------------------- */

/**
 * Ornamen dari slot aset (status dev/milik di ASSET-AUDIT.md) dengan pengganti
 * SVG coretan bila slot belum punya file. `tint` → diwarnai ulang per varian
 * (ornamen asli berwarna merah).
 */
export function Orn({
  slot,
  l,
  t,
  w,
  ratio,
  rotate,
  flip,
  tint = true,
  a,
  d,
  wiggle,
  z,
  fallback,
  priority,
}: {
  slot: string;
  l: number;
  t: number;
  w: number;
  /** tinggi/lebar cadangan bila slot belum punya file. */
  ratio: number;
  rotate?: number;
  flip?: boolean;
  tint?: boolean;
  a?: string;
  d?: number;
  /** goyang halus berulang (pita); dimatikan di mode ringan & reduced motion. */
  wiggle?: boolean;
  z?: number;
  fallback: React.ReactNode;
  priority?: boolean;
}) {
  const img = useSlotAsset(undefined, slot);
  const r = img ? img.height / img.width : ratio;
  const vw = Math.min(100, Math.round((w / CANVAS_W) * 100));
  return (
    <div
      aria-hidden
      data-a={a}
      style={{
        ...box(l, t, w, w * r),
        pointerEvents: "none",
        zIndex: z,
        ...(d !== undefined ? { ["--d" as string]: `${d}s` } : null),
      }}
    >
      <div
        className={wiggle ? "pk-wiggle" : undefined}
        style={{
          position: "absolute",
          inset: 0,
          transform:
            [flip ? "scaleX(-1)" : "", rotate ? `rotate(${rotate}deg)` : ""].join(" ").trim() ||
            undefined,
          filter: tint ? "var(--inv-filter-tint)" : undefined,
        }}
      >
        {img ? (
          <AssetImg
            image={img}
            mode="fill"
            priority={priority}
            sizes={`(max-width: 440px) ${vw}vw, ${Math.round(w)}px`}
          />
        ) : (
          fallback
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Foto stiker ------------------------------- */

/**
 * Foto bergaya stiker: garis tepi tebal warna tema mengikuti bentuk gambar
 * (drop-shadow mengikuti kanal alpha). PNG tanpa latar → garis mengikuti
 * siluet; foto biasa → sudut membulat bergaris. Statis (tanpa animasi filter).
 */
export function Sticker({
  photo,
  sizes,
  priority,
  edge = 5,
  radius = 18,
  fit = "contain",
  position = "50% 100%",
  alt = "",
}: {
  photo: Photo;
  sizes: string;
  priority?: boolean;
  /** tebal garis tepi (px kanvas) */
  edge?: number;
  radius?: number;
  fit?: "contain" | "cover";
  position?: string;
  alt?: string;
}) {
  const e = u(edge);
  return (
    <div
      className="pk-sticker"
      style={{
        position: "absolute",
        inset: 0,
        filter: `drop-shadow(${e} 0 0 var(--inv-red)) drop-shadow(calc(-1 * ${e}) 0 0 var(--inv-red)) drop-shadow(0 ${e} 0 var(--inv-red)) drop-shadow(0 calc(-1 * ${e}) 0 var(--inv-red)) drop-shadow(0 ${u(6)} ${u(8)} rgb(0 0 0 / 0.18))`,
      }}
    >
      <Image
        src={photo.url}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        draggable={false}
        style={{ objectFit: fit, objectPosition: position, borderRadius: u(radius) }}
      />
    </div>
  );
}
