"use client";

import Image from "next/image";

import { useInvitation } from "../../_shared/runtime/context";
import lilyBouquet from "../art/lily-bouquet.webp";
import { SWANS_H, SWANS_W, SwanPair } from "../art/Swans";
import { F, Section, txt, u } from "../canvas";

/**
 * Love Story: latar renda gading timbul (pola lubang & bunga kecil), panel
 * krem bertepi titik, judul skrip "Love Story", bab cerita (judul tebal
 * miring + paragraf), lalu sepasang angsa diapit buket lili kiri & kanan.
 */
const svg = (s: string) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const LACE = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"><rect width="22" height="22" fill="#dcd4c2"/><circle cx="11" cy="11" r="4.4" fill="#e9e2d2" stroke="#fbf8f1" stroke-width="1.8"/><circle cx="11.7" cy="11.7" r="4.4" fill="none" stroke="#b9ae96" stroke-width="0.7"/><circle cx="0" cy="0" r="1.6" fill="#f8f5ee"/><circle cx="22" cy="0" r="1.6" fill="#f8f5ee"/><circle cx="0" cy="22" r="1.6" fill="#f8f5ee"/><circle cx="22" cy="22" r="1.6" fill="#f8f5ee"/><circle cx="11" cy="0" r="0.9" fill="#d8cfbd"/><circle cx="0" cy="11" r="0.9" fill="#d8cfbd"/></svg>`,
);
/** Motif bunga renda besar (pita atas), ubin 120 px. */
const LACE_FLORAL = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="72"><g fill="none" stroke="#faf7f0" stroke-width="2"><path d="M60 64 C40 50 36 26 60 10 C84 26 80 50 60 64Z"/><path d="M60 50 C50 40 50 28 60 20 C70 28 70 40 60 50Z"/><path d="M10 60 C20 40 34 34 44 44 M110 60 C100 40 86 34 76 44"/></g><g fill="#cfc6b2" opacity="0.6"><circle cx="60" cy="36" r="2"/><circle cx="30" cy="20" r="1.4"/><circle cx="90" cy="20" r="1.4"/></g></svg>`,
);

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
const both = (list: Omit<B, "mirror">[]): B[] => list.flatMap((b) => [b, { ...b, mirror: true }]);
const BACK = both(SIDE);
const FRONT: B[] = [...both(SIDE_FRONT), { x: 158, y: 196, s: 114, rot: 90, flip: false }];

function Bouquet({ x, y, s, rot = 0, flip, mirror }: B) {
  const scaleX = (flip ? -1 : 1) * (mirror ? -1 : 1);
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: mirror ? undefined : u(x),
        right: mirror ? u(x) : undefined,
        top: u(y),
        width: u(s),
        height: u(s),
        transform: `scaleX(${scaleX}) rotate(${mirror ? -rot : rot}deg)`,
      }}
    >
      <Image src={lilyBouquet} alt="" fill sizes="(max-width: 440px) 56vw, 250px" />
    </div>
  );
}

export function LiliLoveStory() {
  const { inv } = useInvitation();
  if (inv.eventType !== "WEDDING") return null;
  const items = inv.data.loveStory;
  if (items.length === 0) return null;

  return (
    <Section
      id="loveStory"
      bg={{
        backgroundColor: "#dcd4c2",
        backgroundImage: `${LACE_FLORAL}, ${LACE}`,
        backgroundSize: `${u(120)} ${u(72)}, ${u(22)} ${u(22)}`,
        backgroundRepeat: "repeat-x, repeat",
        backgroundPosition: "0 0, 0 0",
      }}
      overflow="hidden"
    >
      <div
        style={{
          position: "relative",
          margin: `${u(72)} ${u(38)} 0`,
          padding: `${u(26)} ${u(6)} ${u(96)}`,
          background: "#f3e9d3",
          boxShadow: "0 0 0 1px #ded5c2, inset 0 0 0 4px #f2ecdd, inset 0 0 0 5px #d9cfb9",
        }}
      >
        <h2
          data-a
          style={{
            ...txt(F.script, 58, 1.25, { color: "var(--inv-sage-dark)" }),
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
        style={{ position: "relative", marginTop: u(-84), height: u(SWANS_H + 40) }}
      >
        {/* rangkaian lili di belakang angsa: penuh di kiri & kanan */}
        {BACK.map((b, i) => (
          <Bouquet key={`b${i}`} {...b} />
        ))}
        <SwanPair
          style={{
            position: "absolute",
            left: u((430 - SWANS_W) / 2),
            top: 0,
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
