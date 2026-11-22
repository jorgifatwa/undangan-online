"use client";

import Image from "next/image";

import { couple, shortName } from "../../_shared/format";
import { useInvitation } from "../../_shared/runtime/context";
import { HERO_FRAME } from "../art/hero-frame";
import { HeroFrame } from "../art/HeroFrame";
import { paperBg } from "../art/textures";
import closingBouquet from "../art/closing-bouquet.webp";
import { F, Section, box, txt, u, useFit } from "../canvas";

/**
 * Penutup (kanvas 430, kertas krem + sapuan cat air pink): bingkai oval
 * dengan foto penutup, lili cat air + mutiara, kupu-kupu, kalimat penutup
 * miring, "Wassalamualaikum Wr. Wb" (gaya islami), nama skrip, lalu hamparan
 * bunga (lili krem & pink, anggrek hijau, alstroemeria) selebar layar.
 */
const FRAME = { l: 75, t: -8 };
const FRAME_W = 278;
const FRAME_H = Math.round(FRAME_W * HERO_FRAME.ratio);
const FALLBACK =
  "Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu untuk mengiringi langkah baru kami. Atas kehadiran dan doa yang diberikan, kami ucapkan terima kasih.";

/**
 * Hamparan bunga bawah: rangkaian bunga milik pemilik disusun berulang
 * (ukuran, rotasi & arah berbeda) dalam dua baris selebar layar, terpotong
 * tepi bawah — penuh seperti desain. [x tengah, y tengah, sisi, rotasi, cermin]
 */
const BED: [number, number, number, number, boolean][] = [
  // baris belakang (tinggi berselang → tepi atas bergelombang)
  [30, 84, 130, -18, false],
  [148, 58, 160, 10, true],
  [278, 76, 136, -8, false],
  [402, 60, 156, 20, true],
  // baris depan
  [86, 150, 176, 8, true],
  [214, 138, 168, -14, false],
  [350, 150, 180, 6, true],
];

function FloralBed() {
  return (
    <div aria-hidden style={{ position: "relative", height: u(180), pointerEvents: "none" }}>
      {BED.map(([x, y, w, rot, flip], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: u(x - w / 2),
            top: u(y - w / 2),
            width: u(w),
            height: u(w),
            transform: `rotate(${rot}deg)${flip ? " scaleX(-1)" : ""}`,
          }}
        >
          <Image src={closingBouquet} alt="" fill sizes="(max-width: 440px) 42vw, 190px" />
        </div>
      ))}
    </div>
  );
}

export function LiliClosing() {
  const { inv } = useInvitation();
  const d = inv.eventType === "WEDDING" ? inv.data : null;
  const [a, b] = d ? couple(d) : [null, null];
  const names = `${a ? shortName(a) : ""}|${b ? shortName(b) : ""}`;
  const namesRef = useFit<HTMLParagraphElement>(names);
  const islami = inv.data.greeting?.style === "islami";
  const photo = d?.photos.closing ?? d?.photos.cover;

  return (
    <Section
      id="penutup"
      bg={{
        ...paperBg(),
        backgroundImage: `radial-gradient(ellipse 34% 20% at 82% 40%, rgb(240 170 196 / 0.35), transparent 70%), radial-gradient(ellipse 30% 12% at 10% 6%, rgb(240 170 196 / 0.22), transparent 70%), ${paperBg().backgroundImage}`,
        backgroundSize: `auto, auto, ${paperBg().backgroundSize}`,
        backgroundBlendMode: `normal, normal, ${paperBg().backgroundBlendMode}`,
      }}
      overflow="hidden"
    >
      <div style={{ position: "relative", height: u(FRAME.t + FRAME_H + 4) }}>
        <div
          data-a="zoom"
          style={{ ...box(0, 0, 430, FRAME.t + FRAME_H), ["--d" as string]: "0.1s" }}
        >
          <HeroFrame l={FRAME.l} t={FRAME.t} w={FRAME_W} photo={photo} alt="Foto penutup" />
        </div>
      </div>

      <div style={{ position: "relative", padding: `${u(14)} ${u(34)} 0` }}>
        <p
          data-a
          style={{
            ...txt(F.serif, 12.2, u(15.5), { italic: true, color: "var(--inv-ink)" }),
            ["--d" as string]: "0.2s",
          }}
        >
          {inv.data.greeting?.closingText ?? FALLBACK}
        </p>
        {islami && (
          <p
            data-a
            style={{
              ...txt(F.serif, 19, 1.3, { color: "var(--inv-ink)" }),
              marginTop: u(16),
              ["--d" as string]: "0.3s",
            }}
          >
            Wassalamualaikum Wr. Wb
          </p>
        )}
        <p
          ref={namesRef}
          data-a
          style={{
            ...txt(F.script, 46, 1.4, { color: "var(--inv-sage-dark)" }),
            fontSize: `calc(${u(46)} * var(--fit, 1))`,
            whiteSpace: "nowrap",
            marginTop: u(10),
            ["--d" as string]: "0.4s",
          }}
        >
          {a ? shortName(a) : ""}{" "}
          <span style={{ fontFamily: F.amp, fontSize: "0.9em" }}>&amp;</span>{" "}
          {b ? shortName(b) : ""}
        </p>
      </div>
      <div data-a="fade" style={{ marginTop: u(8), ["--d" as string]: "0.3s" }}>
        <FloralBed />
      </div>
    </Section>
  );
}
