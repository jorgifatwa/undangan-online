"use client";

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

const verseStyle = (top: number): React.CSSProperties => ({
  ...canvasText([123.9, top, 192.2], F.verse, 10.526, 14.488, {
    renderScale: 1,
    color: "var(--inv-ink, #2d110e)",
    wrap: true,
  }),
});

/** Ayat di kartu renda: terjemahan + sumber (teks mengecil otomatis bila panjang). */
export function Verse({ text, source, skip }: { text: string; source?: string; skip?: boolean }) {
  return (
    <>
      <CText style={verseStyle(255.3)} reveal={skip ? undefined : "blur"} maxLines={11}>
        &ldquo;{text}&rdquo;
      </CText>
      {source && (
        <CText style={verseStyle(429.3)} reveal={skip ? undefined : "blur"}>
          {source}
        </CText>
      )}
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
