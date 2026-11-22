"use client";

import Image from "next/image";

import { useInvitation } from "../../_shared/runtime/context";
import { DOILY } from "../art/doily";
import doily from "../art/doily.webp";
import lilyBouquet from "../art/lily-bouquet.webp";
import { paperBg } from "../art/textures";
import { SWANS_H, SWANS_W, SwanPair } from "../art/Swans";
import { F, Section, txt, u } from "../canvas";

/**
 * Love Story: latar hijau tua bertekstur, kartu renda persegi (doily milik
 * pemilik, 9-slice: tinggi mengikuti isi) berisi judul skrip "Love Story" &
 * bab cerita, lalu sepasang angsa diapit buket lili kiri & kanan.
 */

/**
 * Buket lili (gambar milik pemilik, persegi) disusun berulang dengan ukuran,
 * rotasi & arah berbeda agar sekitar angsa terasa penuh seperti desain.
 * `x` = tepi kiri (px kanvas, sisi kiri); sisi kanan = cermin otomatis.
 */
type B = { x: number; y: number; s: number; rot?: number; flip?: boolean; mirror?: boolean };
const SIDE: Omit<B, "mirror">[] = [
  { x: -70, y: 0, s: 200, rot: -12 },
  { x: -46, y: 70, s: 250, rot: 6 },
];
const SIDE_FRONT: Omit<B, "mirror">[] = [{ x: -40, y: 168, s: 170, rot: 24, flip: true }];
/** Kartu renda: margin kiri-kanan & skala irisan (lebar kartu 382 px kanvas). */
const DOILY_M = 24;
const DK = (430 - DOILY_M * 2) / DOILY.w;
/** Panel krem diperpanjang ke belakang angsa (px kanvas) — tanpa celah latar. */
const PANEL_EXT = 120;
/** Seberapa jauh angsa diturunkan dari tepi atas rangkaian (px kanvas). */
const SWANS_DROP = 38;
const both = (list: Omit<B, "mirror">[]): B[] => list.flatMap((b) => [b, { ...b, mirror: true }]);
const BACK = both(SIDE);
/** Baris bawah: menutup sisa latar di bawah badan angsa (kiri-kanan + tengah). */
const BOTTOM: Omit<B, "mirror">[] = [{ x: 70, y: 226, s: 130, rot: -8 }];
const FRONT: B[] = [...both(SIDE_FRONT), ...both(BOTTOM), { x: 150, y: 236, s: 130, rot: 80 }];

function Bouquet({ x, y, s, rot = 0, flip, mirror }: B) {
  const scaleX = (flip ? -1 : 1) * (mirror ? -1 : 1);
  // tempo & fase berbeda per buket agar tidak bergoyang serempak
  const seed = Math.abs(x * 7 + y * 3 + (mirror ? 11 : 0));
  return (
    <div
      aria-hidden
      data-sway="stand"
      style={{
        ["--amp" as string]: "1.5deg",
        ["--sdur" as string]: `${(4.4 + (seed % 17) / 10).toFixed(1)}s`,
        ["--sdly" as string]: `${(-(seed % 30) / 10).toFixed(1)}s`,
        position: "absolute",
        left: mirror ? undefined : u(x),
        right: mirror ? u(x) : undefined,
        top: u(y),
        width: u(s),
        height: u(s),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scaleX(${scaleX}) rotate(${mirror ? -rot : rot}deg)`,
        }}
      >
        <Image src={lilyBouquet} alt="" fill sizes="(max-width: 440px) 56vw, 250px" />
      </div>
    </div>
  );
}

export function LiliLoveStory() {
  const { inv } = useInvitation();
  if (inv.eventType !== "WEDDING") return null;
  const items = inv.data.loveStory;
  if (items.length === 0) return null;

  return (
    <Section id="loveStory" bg={paperBg("var(--inv-forest)")} overflow="hidden">
      <div
        style={{
          position: "relative",
          margin: `${u(44)} ${u(DOILY_M)} 0`,
          // kartu renda 9-slice: sudut tetap, tepi diulang, tengah krem meregang
          borderStyle: "solid",
          borderColor: "transparent",
          borderWidth: `${u(DOILY.t * DK)} ${u(DOILY.r * DK)} ${u(DOILY.b * DK)} ${u(DOILY.l * DK)}`,
          borderImage: `url(${doily.src}) ${DOILY.t} ${DOILY.r} ${DOILY.b} ${DOILY.l} fill / ${u(DOILY.t * DK)} ${u(DOILY.r * DK)} ${u(DOILY.b * DK)} ${u(DOILY.l * DK)} stretch round`,
          padding: `${u(4)} 0 ${u(40 + PANEL_EXT)}`,
          filter: `drop-shadow(0 ${u(3)} ${u(6)} rgb(0 0 0 / 0.3))`,
        }}
      >
        <h2
          data-a
          style={{
            ...txt(F.script, 50, 1.25, { color: "var(--inv-sage-dark)" }),
          }}
        >
          Love Story
        </h2>
        {items.map((it, i) => (
          <div
            key={`${it.title}-${i}`}
            data-a
            style={{ marginTop: u(i === 0 ? 8 : 26), ["--d" as string]: `${0.1 + i * 0.12}s` }}
          >
            {it.photo && (
              <div
                style={{
                  position: "relative",
                  width: u(180),
                  height: u(130),
                  margin: `0 auto ${u(10)}`,
                  border: `${u(4)} solid #fffdf8`,
                  boxShadow: "0 1px 3px rgb(0 0 0 / 0.18)",
                }}
              >
                <Image
                  src={it.photo.url}
                  alt={it.photo.alt ?? it.title}
                  fill
                  sizes="200px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            )}
            <h3 style={txt(F.serif, 15.5, 1.35, { italic: true, weight: 700, color: "#4f5238" })}>
              {it.title}
            </h3>
            {it.date && (
              <p style={txt(F.serif, 12, 1.4, { italic: true, color: "#7a7765" })}>{it.date}</p>
            )}
            {it.text && (
              <p
                style={{
                  ...txt(F.serif, 14, u(20.5), { color: "#5d5b4c" }),
                  marginTop: u(2),
                }}
              >
                {it.text}
              </p>
            )}
          </div>
        ))}
      </div>
      {/* angsa: kepala tepat di bawah teks terakhir, badan menumpang tepi
          bawah panel (seperti desain) */}
      <div
        data-a="fade"
        style={{
          position: "relative",
          marginTop: u(-84 - PANEL_EXT),
          height: u(SWANS_H + SWANS_DROP + 8),
        }}
      >
        {/* rangkaian lili di belakang angsa: penuh di kiri & kanan */}
        {BACK.map((b, i) => (
          <Bouquet key={`b${i}`} {...b} />
        ))}
        <SwanPair
          style={{
            position: "absolute",
            left: u((430 - SWANS_W) / 2),
            // agak ke bawah: badan angsa menutupi celah di antara lili bawah
            top: u(SWANS_DROP),
            width: u(SWANS_W),
            height: u(SWANS_H),
          }}
        />
        {/* lili di depan: bawah sayap & tengah bawah */}
        {FRONT.map((b, i) => (
          <Bouquet key={`f${i}`} {...b} />
        ))}
      </div>
    </Section>
  );
}
