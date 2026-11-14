"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { DriedBouquet } from "../_shared/ornaments";
import {
  EnvelopeBody,
  EnvelopeClosedRest,
  EnvelopeFlap,
  EnvelopeInside,
  EnvelopePocket,
} from "../_shared/ornaments";
import { LaceDoily } from "../_shared/ornaments";
import { VelvetDrape } from "../_shared/textures";
import type { RevealVariant } from "../_shared/motion/Reveal";
import { Art } from "./art";
import { CText, F, Placed, canvasText, u, type Box } from "./canvas";
import { Reveal } from "../_shared/motion/Reveal";

/**
 * Adegan amplop terbuka + kartu renda (koordinat kanvas Section 1, 440 × 903.8).
 * Dipakai section "ayat" DAN transisi cover, sehingga frame terakhir transisi
 * persis sama dengan section 1 (seperti desain referensi).
 */

export const SECTION1_H = 903.8;
export const ENVELOPE_HINGE_Y = 531;
export const ENVELOPE_BOTTOM_Y = 722;
export const ENVELOPE_BODY: Box = [
  68.3,
  ENVELOPE_HINGE_Y,
  301.3,
  ENVELOPE_BOTTOM_Y - ENVELOPE_HINGE_Y,
];
export const SECTION1_DRAPERY: Box = [-164.6, -100.4, 715.1, 1074.4];

/** Di layar pendek (mis. browser WhatsApp) Section 1 digambar lebih kecil agar amplop muat di layar pertama. */
const SECTION1_FIT_BOTTOM = 750;
const SECTION1_MIN_FIT = 0.8;
export const SECTION1_FIT_WIDTH = `clamp(${SECTION1_MIN_FIT * 100}%, ${((440 / SECTION1_FIT_BOTTOM) * 100).toFixed(4)}svh, 100%)`;
export function section1Fit(width: number): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const svh = probe.getBoundingClientRect().height;
  probe.remove();
  if (!svh || !width) return 1;
  return Math.min(1, Math.max(SECTION1_MIN_FIT, (svh * 440) / SECTION1_FIT_BOTTOM / width));
}

export const LINING_CLIP =
  "polygon(49.68% 0%, 51.01% 0.11%, 52.25% 0.84%, 73% 19.99%, 88.5% 35.08%, 100% 47.16%, 99.91% 47.27%, 99.95% 99.72%, 99.77% 100%, 0.23% 100%, 0.09% 99.89%, 0% 99.67%, 0.05% 47.22%, 6.21% 41.04%, 20.01% 27.84%, 31.74% 16.37%, 46.23% 2.78%, 47.88% 1%, 48.99% 0.22%)";

/** Fallback SVG: satu "lembar" amplop SVG penuh bila file asli tidak tersedia. */
const svgBack = <EnvelopeBody slot={false} className="absolute inset-0 h-full w-full" />;

interface LayerProps {
  reveal?: RevealVariant;
  /** Lewati animasi masuk (mis. sudah tampil lewat transisi cover). */
  skip?: boolean;
  /** Geser vertikal (penutup memakai adegan yang sama 31.6 px lebih bawah). */
  dy?: number;
}

const shift = (b: Box, dy = 0): Box => [b[0], b[1] + dy, b[2], b[3]];

export function EnvelopeBack({ reveal, skip, dy }: LayerProps) {
  return (
    <Placed img={shift([68.3, 402.3, 301.3, 320.6], dy)} reveal={skip ? undefined : reveal}>
      <Art slot="envelope-back" w={301.3} fallback={svgBack} />
    </Placed>
  );
}

export function EnvelopeLining({ reveal, skip, dy }: LayerProps) {
  return (
    <Placed
      img={shift([72.2, 281.7, 293.6, 522.5], dy)}
      clip={shift([72.2, 421.7, 293.5, 242.5], dy)}
      clipPath={LINING_CLIP}
      reveal={skip ? undefined : reveal}
    >
      <Art
        slot="envelope-lining"
        w={293.6}
        fallback={<EnvelopeInside slot={false} className="absolute inset-0 h-full w-full" />}
      />
    </Placed>
  );
}

export function EnvelopeFront({ reveal, skip, dy }: LayerProps) {
  return (
    <Placed
      img={shift([32.6, 366.8, 375.5, 469.4], dy)}
      clip={shift([67.7, 532.2, 308.6, 190.7], dy)}
      reveal={skip ? undefined : reveal}
    >
      <Art
        slot="envelope-pocket"
        w={375.5}
        fallback={<EnvelopePocket slot={false} className="absolute inset-0 h-full w-full" />}
      />
    </Placed>
  );
}

/** Kartu renda oval pembawa ayat. */
export function LaceCard({ skip }: { skip?: boolean }) {
  return (
    <Placed
      img={[63.3, 122.9, 304.3, 434.7]}
      clip={[67.7, 130.1, 299.9, 427.4]}
      reveal={skip ? undefined : "zoom"}
    >
      <Art
        slot="lace-doily"
        w={304.3}
        fallback={<LaceDoily slot={false} className="absolute inset-0 h-full w-full" />}
      />
    </Placed>
  );
}

/**
 * Geometri kartu renda (koordinat kanvas 440): kolom teks x 123,9–316,1.
 * Ekor buket gantung menutupi sisi kiri kartu (x < 205) sampai y ≈ 318;
 * di bawah y ≈ 452 kartu mulai tertutup amplop.
 */
const VERSE = { x: 123.9, w: 192.2, top: 255, clearTop: 318, bottom: 452, tailRight: 205 } as const;

/**
 * Ayat di kartu renda, seperti desain referensi: teks rata tengah selebar
 * kolom kartu. Posisi menyesuaikan panjang kutipan:
 *  - pendek → ditengahkan di area bersih di bawah buket (318–452)
 *  - sedang (mis. QS Ar-Rum 21) → selebar kolom, ditengahkan di 255–452
 *  - sangat panjang (mis. 1 Korintus 13:4-7) → mulai y 255, baris di samping
 *    ekor buket mengalir di kanannya (float tak terlihat), font dikecilkan
 * Sumber ayat mengalir di bawah teks.
 */
export function Verse({ text, source, skip }: { text: string; source?: string; skip?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState<{ top: number; float: boolean; fit: number }>({
    top: VERSE.top,
    float: true,
    fit: 1,
  });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const unit = el.offsetWidth / VERSE.w || 1; // px per unit kanvas
      const heightAt = (float: boolean, fit: number) => {
        el.style.setProperty("--vfit", String(fit));
        el.style.setProperty("--vfloat", float ? "1" : "0");
        return el.scrollHeight / unit;
      };
      const clear = VERSE.bottom - VERSE.clearTop;
      // 1) muat di area bersih di bawah buket (font boleh mengecil sampai 90%)
      for (const f of [1, 0.95, 0.9]) {
        const h0 = heightAt(false, f);
        if (h0 <= clear) {
          setLayout({ top: VERSE.clearTop + (clear - h0) / 2, float: false, fit: f });
          return;
        }
      }
      // 2) selebar kolom kartu, ditengahkan di 255–452 (font boleh mengecil sampai 90%)
      const full = VERSE.bottom - VERSE.top;
      for (const f of [1, 0.95, 0.9]) {
        const h1 = heightAt(false, f);
        if (h1 <= full) {
          setLayout({ top: VERSE.top + (full - h1) / 2, float: false, fit: f });
          return;
        }
      }
      // 3) sangat panjang: mulai lebih atas, baris di samping buket mengalir ke kanan
      let h = 0;
      const room = VERSE.bottom - VERSE.top;
      let fit = 1;
      h = heightAt(true, fit);
      while (h > room && fit > 0.72) {
        fit -= 0.04;
        h = heightAt(true, fit);
      }
      setLayout({ top: VERSE.top, float: true, fit });
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => undefined);
  }, [text, source]);

  const fs = (px: number) => `calc(${u(px)} * var(--vfit, 1))`;
  const body = (
    <div
      ref={ref}
      style={{
        ["--vfit" as string]: layout.fit,
        ["--vfloat" as string]: layout.float ? 1 : 0,
        width: u(VERSE.w),
        textAlign: "center",
        color: "var(--inv-ink, #2d110e)",
        fontFamily: F.verse,
        fontSize: fs(10.526),
        lineHeight: fs(14.488),
        overflowWrap: "anywhere",
      }}
    >
      {/* area ekor buket: baris di sampingnya bergeser ke kanan */}
      <span
        aria-hidden
        style={{
          display: "block",
          float: "left",
          width: `calc(${u(VERSE.tailRight - VERSE.x)} * var(--vfloat, 1))`,
          height: `calc(${u(VERSE.clearTop - VERSE.top)} * var(--vfloat, 1))`,
        }}
      />
      {/* lekukan oval di kanan atas */}
      <span
        aria-hidden
        style={{
          display: "block",
          float: "right",
          width: `calc(${u(14)} * var(--vfloat, 1))`,
          height: `calc(${u(40)} * var(--vfloat, 1))`,
        }}
      />
      <p style={{ margin: 0 }}>&ldquo;{text}&rdquo;</p>
      {source && <p style={{ margin: `${u(12)} 0 0`, clear: "both" }}>{source}</p>}
    </div>
  );
  const pos: React.CSSProperties = {
    position: "absolute",
    left: u(VERSE.x),
    top: u(layout.top),
    width: u(VERSE.w),
    pointerEvents: "none",
    // di atas untaian buket gantung (yang juga menjuntai ke kartu) agar teks utuh terbaca
    zIndex: 1,
  };
  return skip ? (
    <div style={pos}>{body}</div>
  ) : (
    <Reveal variant="blur" style={pos}>
      {body}
    </Reveal>
  );
}

/**
 * Isi kartu renda bila ayat/kutipan kosong (mis. gaya salam "umum"): nama
 * pasangan + tanggal — dari data user sendiri, bukan teks contoh.
 */
export function CardNames({ names, date, skip }: { names: string; date: string; skip?: boolean }) {
  return (
    <>
      <CText
        style={{
          ...canvasText([123.9, 268, 192.2], F.script, 30, 40, {
            renderScale: 1,
            color: "var(--inv-ink, #2d110e)",
            wrap: true,
          }),
          whiteSpace: "pre-line",
        }}
        reveal={skip ? undefined : "blur"}
        maxLines={3}
      >
        {names.replace(" & ", "\n&\n")}
      </CText>
      <CText
        style={canvasText([123.9, 402, 192.2], F.cormorant, 11, 16, {
          renderScale: 1,
          color: "var(--inv-ink, #2d110e)",
          letterSpacing: 1.2,
        })}
        reveal={skip ? undefined : "blur"}
      >
        {date.toUpperCase()}
      </CText>
    </>
  );
}

/**
 * Tirai zamrud + karpet (file asli, atau VelvetDrape SVG) mengisi kotak.
 * Filter warna varian hanya untuk TIRAI: karpet damask (mulai ±82% tinggi
 * file) dilapis salinan tanpa filter, sehingga tetap merah di semua varian.
 * Kedua lapis memakai file yang sama (diunduh sekali).
 */
export function Drapery({ priority }: { priority?: boolean }) {
  return (
    <>
      <Art
        slot="drape-bg"
        w={715}
        priority={priority}
        filter="var(--inv-filter-drape)"
        fallback={<VelvetDrape slot={false} />}
      />
      <div style={{ position: "absolute", inset: 0, clipPath: "inset(82% 0 0 0)" }}>
        <Art slot="drape-bg" w={715} fallback={null} />
      </div>
    </>
  );
}

export function HangingBouquet({ w = 200 }: { w?: number }) {
  return (
    <Art
      slot="bouquet-hanging"
      w={w}
      fallback={
        <DriedBouquet variant="hanging" slot={false} className="absolute inset-0 h-full w-full" />
      }
    />
  );
}
export function FloorBouquet({ w = 200 }: { w?: number }) {
  return (
    <Art
      slot="bouquet-floor"
      w={w}
      fallback={
        <DriedBouquet variant="floor" slot={false} className="absolute inset-0 h-full w-full" />
      }
    />
  );
}
export function AccentBouquet({ w = 200 }: { w?: number }) {
  return (
    <Art
      slot="bouquet-accent"
      w={w}
      fallback={
        <DriedBouquet variant="accent" slot={false} className="absolute inset-0 h-full w-full" />
      }
    />
  );
}

/** Amplop tertutup (cover): file asli dipotong poligon tutup / sisanya. */
export const CLOSED_FLAP_CLIP = "polygon(0% 0%, 100% 0%, 100% 1.9%, 50% 68%, 0% 1.9%)";
export const CLOSED_REST_CLIP = "polygon(0% 1.9%, 50% 68%, 100% 1.9%, 100% 100%, 0% 100%)";
export function ClosedEnvelopePart({
  box,
  part,
  className,
}: {
  box: Box;
  part: "flap" | "rest";
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        left: u(box[0]),
        top: u(box[1]),
        width: u(box[2]),
        height: u(box[3]),
        clipPath: part === "flap" ? CLOSED_FLAP_CLIP : CLOSED_REST_CLIP,
        pointerEvents: "none",
      }}
    >
      <Art
        slot="envelope-closed"
        w={box[2]}
        priority
        fallback={
          part === "flap" ? (
            <div className="absolute inset-x-0 top-0" style={{ height: "71%" }}>
              <EnvelopeFlap slot={false} className="h-full w-full" />
            </div>
          ) : (
            <EnvelopeClosedRestFallback />
          )
        }
      />
    </div>
  );
}

function EnvelopeClosedRestFallback() {
  return (
    <>
      <EnvelopeBody slot={false} className="absolute inset-0 h-full w-full" />
      <EnvelopeClosedRest className="absolute inset-0 h-full w-full" />
    </>
  );
}
