"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";

import { useEditorBridge, type HatSection } from "@/lib/editor/bridge";
import type { HatPos } from "@/schemas/birthday";
import type { Photo } from "@/schemas/common";

import { AssetImg, useSlotAsset } from "../_shared/assets";
import { useInvitation } from "../_shared/runtime/context";
import { CANVAS_W, u } from "./canvas";
import { hatFromFace } from "./hat";
import { PartyHat } from "./ornaments";

/**
 * FOTO & TOPI PESTA Pita Krayon (cover & pembuka).
 *
 * Tiga lapis foto pembuka:
 *  1. foto biasa (bawaan, tanpa langkah tambahan) → bingkai stiker organik
 *     bertepi merah tebal, sedikit miring, berselotip; dibingkai otomatis ke
 *     wajah (photoDecor.face) agar wajah tidak tertutup kue
 *  2. hasil "Hapus latar otomatis" dan 3. PNG tanpa latar unggahan sendiri
 *     (photo.alpha) → garis merah mengikuti siluet
 *
 * Topi: posisi manual per section (persen relatif foto) → posisi dari deteksi
 * wajah → bawaan pojok kanan atas bingkai (miring). Topi boleh keluar dari
 * bingkai tapi dibatasi agar tidak terpotong tepi layar. Halaman tamu hanya
 * MEMBACA posisi tersimpan — tidak ada model yang dimuat.
 */

type Box = { l: number; t: number; w: number; h: number };
type Nat = { w: number; h: number };
type Rect = { x: number; y: number; w: number; h: number };
type Face = { x: number; y: number; w: number; r: number; for: string };

/** Ukuran asli foto: dari data unggahan; bila tidak ada, diukur saat dimuat. */
function useNatural(photo: Photo): [Nat, (n: Nat) => void] {
  const [measured, setMeasured] = useState<Nat | null>(null);
  const known = photo.width && photo.height ? { w: photo.width, h: photo.height } : null;
  return [known ?? measured ?? { w: 4, h: 5 }, (n) => !known && setMeasured(n)];
}

/** Persegi tampil gambar di dalam kotak (object-fit cover/contain + posisi 0–1). */
export function imageRect(
  box: Box,
  nat: Nat,
  fit: "cover" | "contain",
  px: number,
  py: number,
): Rect {
  const s =
    fit === "cover"
      ? Math.max(box.w / nat.w, box.h / nat.h)
      : Math.min(box.w / nat.w, box.h / nat.h);
  const w = nat.w * s;
  const h = nat.h * s;
  return { x: (box.w - w) * px, y: (box.h - h) * py, w, h };
}

/**
 * Posisi object-fit:cover yang menaruh puncak kepala di `headAt` (0–1 tinggi
 * kotak) dan kepala di tengah horizontal. Tanpa wajah → fokus foto / tengah atas.
 */
export function focusFor(box: Box, nat: Nat, face: Face | null, photo: Photo, headAt = 0.16) {
  const r = imageRect(box, nat, "cover", 0, 0);
  if (!face) return { px: (photo.focusX ?? 50) / 100, py: (photo.focusY ?? 30) / 100 };
  const cx = (face.x / 100) * r.w;
  const top = (face.y / 100) * r.h;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const ox = box.w - r.w;
  const oy = box.h - r.h;
  return {
    px: ox ? clamp((box.w * 0.5 - cx) / ox) : 0.5,
    py: oy ? clamp((box.h * headAt - top) / oy) : 0.5,
  };
}

export function usePhotoDecor() {
  const { inv } = useInvitation();
  const d = inv.eventType === "BIRTHDAY" ? inv.data.photoDecor : undefined;
  return {
    bw: d?.bw ?? true,
    cake: d?.cake ?? true,
    coverHat: d?.coverHat ?? { show: true },
    heroHat: d?.heroHat ?? { show: true },
    face: d?.face ?? null,
  };
}

const HAT = {
  cover: { slot: "party-hat", ratio: 1.43, fallback: <PartyHat /> },
  hero: { slot: "party-hat-glitter", ratio: 1.36, fallback: <PartyHat glitter /> },
} as const;

/**
 * Topi pesta di atas foto. `rect` = persegi tampil gambar (px kanvas, relatif
 * terhadap `box`). Di editor (EditorBridge ada) topi bisa digeser.
 */
function Hat({
  section,
  photo,
  box,
  rect,
  pos,
  face,
  frameRot = 0,
  z = 5,
  origin,
}: {
  /** posisi absolut (kanvas 430) kotak foto, bila `box` relatif terhadap pembungkus */
  origin?: { l: number; t: number };
  section: HatSection;
  photo: Photo;
  box: Box;
  rect: Rect;
  pos: HatPos;
  face: Face | null;
  frameRot?: number;
  z?: number;
}) {
  const bridge = useEditorBridge();
  const img = useSlotAsset(undefined, HAT[section].slot);
  const ratio = img ? img.height / img.width : HAT[section].ratio;
  const manual =
    pos.for === photo.url && pos.x !== undefined && pos.y !== undefined && pos.w !== undefined;
  const auto = !manual && face && face.for === photo.url ? hatFromFace(face) : null;
  const p = manual ? { x: pos.x!, y: pos.y!, w: pos.w!, r: pos.r ?? 0 } : auto;

  let hw: number, left: number, top: number, rot: number;
  if (p) {
    hw = (p.w / 100) * rect.w;
    left = rect.x + (p.x / 100) * rect.w - hw / 2;
    top = rect.y + (p.y / 100) * rect.h - hw * ratio;
    rot = p.r;
  } else {
    // bawaan: pojok kanan atas bingkai, miring
    hw = Math.min(box.w * 0.3, 70);
    left = box.w - hw * 0.62;
    top = -hw * ratio * 0.58;
    rot = 16;
  }
  // tidak terpotong tepi layar (kanvas 0–430)
  const absL = (origin?.l ?? box.l) + left;
  const minL = 4;
  const maxL = CANVAS_W - 4 - hw;
  if (frameRot === 0) left += Math.min(Math.max(absL, minL), maxL) - absL;
  else left += Math.min(Math.max(absL, minL + 6), maxL - 6) - absL;
  top = Math.max(top, -(origin?.t ?? box.t) + 2);

  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const start = useRef<{ x: number; y: number; scale: number } | null>(null);
  const el = useRef<HTMLDivElement | null>(null);

  const onDown = (e: React.PointerEvent) => {
    if (!bridge) return;
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    // px layar per px kanvas
    const parent = el.current?.parentElement?.getBoundingClientRect();
    const scale = parent ? parent.width / box.w : 1;
    start.current = { x: e.clientX, y: e.clientY, scale };
    setDrag({ dx: 0, dy: 0 });
  };
  const onMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    setDrag({
      dx: (e.clientX - start.current.x) / start.current.scale,
      dy: (e.clientY - start.current.y) / start.current.scale,
    });
  };
  const onUp = () => {
    if (!start.current || !drag || !bridge) return;
    const nx = ((left + drag.dx + hw / 2 - rect.x) / rect.w) * 100;
    const ny = ((top + drag.dy + hw * ratio - rect.y) / rect.h) * 100;
    bridge.moveHat(section, {
      x: Math.round(nx * 10) / 10,
      y: Math.round(ny * 10) / 10,
      w: Math.round((hw / rect.w) * 1000) / 10,
      r: Math.round(rot),
      for: photo.url,
    });
    start.current = null;
    setDrag(null);
  };

  return (
    <div
      ref={el}
      aria-hidden={!bridge}
      data-pk-hat={section}
      data-hat-src={manual ? "manual" : auto ? "auto" : "default"}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onClick={bridge ? (e) => e.stopPropagation() : undefined}
      style={{
        position: "absolute",
        left: u(left + (drag?.dx ?? 0)),
        top: u(top + (drag?.dy ?? 0)),
        width: u(hw),
        height: u(hw * ratio),
        transform: `rotate(${rot}deg)`,
        transformOrigin: "50% 100%",
        zIndex: z,
        filter: "var(--inv-filter-tint)",
        pointerEvents: bridge ? "auto" : "none",
        cursor: bridge ? (drag ? "grabbing" : "grab") : undefined,
        touchAction: bridge ? "none" : undefined,
        outline: bridge ? "2px dashed rgb(0 0 0 / 0.35)" : undefined,
        outlineOffset: 4,
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        {img ? <AssetImg image={img} mode="fill" sizes="120px" /> : HAT[section].fallback}
      </div>
    </div>
  );
}

const bwFilter = (on: boolean) => (on ? "grayscale(1) contrast(1.06)" : undefined);

/* ---------------------------------- COVER ---------------------------------- */

/** Foto cover di dalam bingkai scallop (kotak isi = koordinat kanvas cover). */
export function CoverPhoto({
  photo,
  box,
  origin,
}: {
  photo: Photo;
  /** kotak isi bingkai, relatif terhadap pembungkus bingkai */
  box: Box;
  /** posisi absolut kotak (kanvas cover 430) — untuk batas tepi layar */
  origin: { l: number; t: number };
}) {
  const { bw, coverHat, face } = usePhotoDecor();
  const [nat, setNat] = useNatural(photo);
  const f = face && face.for === photo.url ? face : null;
  const { px, py } = focusFor(box, nat, f, photo, 0.14);
  const rect = imageRect(box, nat, "cover", px, py);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: u(box.l),
          top: u(box.t),
          width: u(box.w),
          height: u(box.h),
          overflow: "hidden",
          background: "#e6e1dc",
        }}
      >
        <Image
          src={photo.url}
          alt={photo.alt ?? ""}
          fill
          priority
          sizes="(max-width: 440px) 46vw, 200px"
          onLoad={(e) =>
            setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
          }
          style={{
            objectFit: "cover",
            objectPosition: `${px * 100}% ${py * 100}%`,
            filter: bwFilter(bw),
          }}
        />
      </div>
      {coverHat.show !== false && (
        <div
          style={{
            position: "absolute",
            left: u(box.l),
            top: u(box.t),
            width: u(box.w),
            height: u(box.h),
            zIndex: 6,
          }}
        >
          <Hat
            section="cover"
            photo={photo}
            box={box}
            rect={rect}
            pos={coverHat}
            face={f}
            origin={origin}
          />
        </div>
      )}
    </>
  );
}

/* ---------------------------------- HERO ----------------------------------- */

const ring = (edge: number) => {
  const e = u(edge);
  return `drop-shadow(${e} 0 0 var(--inv-red)) drop-shadow(calc(-1 * ${e}) 0 0 var(--inv-red)) drop-shadow(0 ${e} 0 var(--inv-red)) drop-shadow(0 calc(-1 * ${e}) 0 var(--inv-red)) drop-shadow(0 ${u(5)} ${u(7)} rgb(0 0 0 / 0.2))`;
};

/** Kotak foto pembuka per jenis foto (koordinat kanvas 430). */
export const HERO_BOX = {
  cutout: { l: 104, t: 222, w: 222, h: 380 },
  frame: { l: 112, t: 200, w: 206, h: 262 },
} as const;
const FRAME_ROT = -3;

export function HeroPhoto({ photo, alt }: { photo: Photo; alt: string }) {
  const { bw, heroHat, face } = usePhotoDecor();
  const [nat, setNat] = useNatural(photo);
  const id = useId().replace(/:/g, "");
  const f = face && face.for === photo.url ? face : null;
  const onLoad = (e: React.SyntheticEvent<HTMLImageElement>) =>
    setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });

  if (photo.alpha) {
    // siluet: garis merah mengikuti kanal alpha
    const box = HERO_BOX.cutout;
    const rect = imageRect(box, nat, "contain", 0.5, 0);
    return (
      <div
        data-pk-photo="cutout"
        style={{
          position: "absolute",
          left: u(box.l),
          top: u(box.t),
          width: u(box.w),
          height: u(box.h),
          zIndex: 2,
        }}
      >
        <div
          data-a="pop"
          style={{ position: "absolute", inset: 0, filter: ring(6), ["--d" as string]: "0.6s" }}
        >
          <Image
            src={photo.url}
            alt={alt}
            fill
            sizes="(max-width: 440px) 52vw, 222px"
            onLoad={onLoad}
            style={{ objectFit: "contain", objectPosition: "50% 0%", filter: bwFilter(bw) }}
          />
        </div>
        {heroHat.show !== false && (
          <Hat section="hero" photo={photo} box={box} rect={rect} pos={heroHat} face={f} z={6} />
        )}
      </div>
    );
  }

  // foto biasa: bingkai stiker potongan (bentuk organik), miring, berselotip
  const box = HERO_BOX.frame;
  const { px, py } = focusFor(box, nat, f, photo, 0.15);
  const rect = imageRect(box, nat, "cover", px, py);
  return (
    <div
      data-pk-photo="frame"
      style={{
        position: "absolute",
        left: u(box.l),
        top: u(box.t),
        width: u(box.w),
        height: u(box.h),
        transform: `rotate(${FRAME_ROT}deg)`,
        zIndex: 2,
      }}
    >
      <div data-a="pop" style={{ position: "absolute", inset: 0, ["--d" as string]: "0.6s" }}>
        <svg width="0" height="0" aria-hidden style={{ position: "absolute" }}>
          <clipPath id={`${id}-blob`} clipPathUnits="objectBoundingBox">
            {/* potongan gunting tak beraturan */}
            <path d="M0.07 0.05 C0.28 -0.01 0.55 0.035 0.82 0.01 C0.95 0.02 0.99 0.12 0.97 0.3 C0.955 0.45 0.995 0.62 0.98 0.8 C0.975 0.93 0.93 0.99 0.8 0.985 C0.58 0.97 0.36 1.0 0.16 0.985 C0.05 0.98 0.015 0.9 0.025 0.74 C0.035 0.56 0.0 0.4 0.02 0.22 C0.03 0.11 0.04 0.07 0.07 0.05 Z" />
          </clipPath>
        </svg>
        <div style={{ position: "absolute", inset: 0, filter: ring(7) }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `url(#${id}-blob)`,
              background: "#e6e1dc",
            }}
          >
            <Image
              src={photo.url}
              alt={alt}
              fill
              sizes="(max-width: 440px) 50vw, 206px"
              onLoad={onLoad}
              style={{
                objectFit: "cover",
                objectPosition: `${px * 100}% ${py * 100}%`,
                filter: bwFilter(bw),
              }}
            />
          </div>
        </div>
        {/* selotip */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: u(-12),
            left: "50%",
            width: u(86),
            height: u(24),
            transform: "translateX(-50%) rotate(4deg)",
            background: "color-mix(in srgb, #fff 55%, var(--inv-accent) 25%)",
            opacity: 0.85,
            boxShadow: `0 ${u(1)} ${u(2)} rgb(0 0 0 / 0.08)`,
          }}
        />
      </div>
      {heroHat.show !== false && (
        <Hat
          section="hero"
          photo={photo}
          box={box}
          rect={rect}
          pos={heroHat}
          face={f}
          frameRot={FRAME_ROT}
          z={6}
        />
      )}
    </div>
  );
}
