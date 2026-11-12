"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { Photo } from "@/schemas/common";

import { Reveal } from "../../_shared/motion/Reveal";
import { Sparkles } from "../../_shared/ornaments";
import { useInvitation } from "../../_shared/runtime/context";
import { SectionShell } from "../../_shared/runtime/SectionShell";
import { VelvetTexture } from "../../_shared/textures";
import { Art } from "../art";
import { CANVAS_W, CText, F, Placed, canvasText, u, type Box } from "../canvas";

/**
 * Galeri desain: dua blok 3 foto berulang (A: dua kecil bertumpuk + satu besar;
 * B: satu besar + dua kecil), sisa 1–2 foto mengisi baris penuh di akhir.
 * Lightbox coverflow: foto aktif di depan, tetangga berputar ke samping.
 */
const BLOCK_A: Box[] = [
  [22.86, 131.86, 130.8, 192.41],
  [156.72, 131.86, 261.59, 387.86],
  [22.86, 327.32, 130.8, 192.41],
];
const BLOCK_B: Box[] = [
  [21.67, 523.11, 261.59, 368.42],
  [286.33, 523.11, 130.8, 121.78],
  [286.33, 647.95, 130.8, 243.58],
];
const PERIOD = 763.06;
const GUTTER = 3.39;
const BOTTOM = 19.34;

function layoutCells(count: number): { cells: Box[]; height: number } {
  const cells: Box[] = [];
  const pattern = [...BLOCK_A, ...BLOCK_B];
  const full = count - (count % 3);
  for (let i = 0; i < full; i++) {
    const [x, y, w, h] = pattern[i % 6];
    cells.push([x, y + Math.floor(i / 6) * PERIOD, w, h]);
  }
  let bottom = cells.reduce((m, [, y, , h]) => Math.max(m, y + h), BLOCK_A[0][1] - GUTTER);
  const left = count - full;
  if (left > 0) {
    const w = (418.31 - 22.86 - GUTTER * (left - 1)) / left;
    const h = Math.min(w * 1.5, 294.05);
    for (let i = 0; i < left; i++) cells.push([22.86 + i * (w + GUTTER), bottom + GUTTER, w, h]);
    bottom += GUTTER + h;
  }
  return { cells, height: bottom + BOTTOM };
}

const SIDE = 2;
const offsetOf = (i: number, active: number, n: number) => {
  let d = i - active;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
};

function Coverflow({
  photos,
  index,
  onChange,
  onClose,
}: {
  photos: Photo[];
  index: number;
  onChange: (i: number) => void;
  onClose: () => void;
}) {
  const go = useCallback(
    (dir: 1 | -1) => onChange((index + dir + photos.length) % photos.length),
    [index, onChange, photos.length],
  );
  const touch = useRef<number | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  const arrow: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 44,
    height: 44,
    borderRadius: 999,
    background: "rgb(0 0 0 / .5)",
    border: "1px solid rgb(255 255 255 / .25)",
    color: "#fff",
    fontSize: 22,
    zIndex: 3,
  };

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Galeri foto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgb(0 0 0 / .92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button
        type="button"
        aria-label="Tutup galeri"
        onClick={onClose}
        style={{ ...arrow, top: 16, right: 16, transform: "none" }}
      >
        ×
      </button>
      <button
        type="button"
        aria-label="Foto sebelumnya"
        onClick={(e) => (e.stopPropagation(), go(-1))}
        style={{ ...arrow, left: 14 }}
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Foto selanjutnya"
        onClick={(e) => (e.stopPropagation(), go(1))}
        style={{ ...arrow, right: 14 }}
      >
        ›
      </button>
      <div
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
        style={{ position: "absolute", inset: 0, perspective: 1100, overflow: "hidden" }}
      >
        {photos.map((p, i) => {
          const off = offsetOf(i, index, photos.length);
          const dist = Math.min(Math.abs(off), SIDE + 1);
          const side = Math.sign(off);
          if (dist > SIDE) return null;
          return (
            <div
              key={p.url + i}
              onClick={(e) => {
                e.stopPropagation();
                if (off !== 0) onChange(i);
              }}
              aria-hidden={off !== 0}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "min(70vw, 400px)",
                height: "72vh",
                transform:
                  off === 0
                    ? "translate(-50%, -50%)"
                    : `translate(-50%, -50%) translateX(${side * (34 + dist * 30)}%) translateZ(${-120 - dist * 110}px) rotateY(${-side * 45}deg)`,
                opacity: [1, 0.6, 0.28][dist],
                zIndex: 10 - dist,
                transition: "transform .55s cubic-bezier(.2,.8,.2,1), opacity .55s ease",
                cursor: off === 0 ? "default" : "pointer",
              }}
            >
              <Image
                src={p.url}
                alt={p.alt ?? `Foto ${i + 1}`}
                fill
                sizes="(max-width: 600px) 70vw, 400px"
                style={{ objectFit: "contain", filter: "drop-shadow(0 20px 50px rgb(0 0 0 / .8))" }}
              />
            </div>
          );
        })}
      </div>
      <p
        style={{
          position: "absolute",
          bottom: 24,
          color: "rgb(255 255 255 / .8)",
          fontSize: 13,
          fontFamily: F.cormorant,
          letterSpacing: 1,
        }}
      >
        {index + 1} / {photos.length}
      </p>
    </motion.div>,
    document.body,
  );
}

export function TiraiGallery() {
  const { inv } = useInvitation();
  const photos = inv.data.gallery;
  const [active, setActive] = useState<number | null>(null);
  const { cells, height } = layoutCells(photos.length);
  const tiles = Math.ceil((height + 26.78) / 1172.52);

  return (
    <SectionShell
      id="galeri"
      className="tb-canvas"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `440 / ${height}`,
        overflow: "hidden",
        containerType: "inline-size",
        background: "#4a0d18",
        contentVisibility: "visible",
      }}
    >
      {Array.from({ length: tiles }, (_, i) => (
        <Placed
          key={i}
          img={[-109.77, -26.78 + i * 1172.52, 659.53, 1172.52]}
          clip={[0, 0, 440, height]}
        >
          <Art
            slot="velvet-bg"
            w={660}
            filter="var(--inv-filter-velvet)"
            fallback={<VelvetTexture slot={false} />}
          />
        </Placed>
      ))}
      <CText reveal="blur" style={canvasText([69.69, 38.84, 300.63], F.script, 51.574, 72.176)}>
        Gallery
      </CText>
      <Sparkles
        style={{
          position: "absolute",
          left: u(179.03 - 20.25),
          top: u(54.14 - 28.5),
          width: u(40.5),
          height: u(57.03),
          transform: "rotate(40.43deg) scaleY(-1)",
        }}
      />
      {photos.map((p, i) => {
        const [x, y, w, h] = cells[i];
        return (
          <Reveal
            key={p.url + i}
            variant={x + w / 2 < CANVAS_W / 2 ? "tilt-left" : "tilt-right"}
            amount={0.15}
            style={{ position: "absolute", left: u(x), top: u(y), width: u(w), height: u(h) }}
          >
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Buka foto ${i + 1}`}
              style={{
                position: "relative",
                display: "block",
                width: "100%",
                height: "100%",
                padding: 0,
                border: "none",
                borderRadius: u(8),
                overflow: "hidden",
                cursor: "pointer",
                background: "#3a050f",
              }}
            >
              <Image
                src={p.url}
                alt={p.alt ?? `Galeri foto ${i + 1}`}
                fill
                sizes={`(max-width: 440px) ${Math.round((w / CANVAS_W) * 100)}vw, ${Math.round(w)}px`}
                style={{
                  objectFit: "cover",
                  objectPosition: `${p.focusX ?? 50}% ${p.focusY ?? 30}%`,
                }}
              />
            </button>
          </Reveal>
        );
      })}
      <AnimatePresence>
        {active !== null && (
          <Coverflow
            photos={photos}
            index={active}
            onChange={setActive}
            onClose={() => setActive(null)}
          />
        )}
      </AnimatePresence>
    </SectionShell>
  );
}
