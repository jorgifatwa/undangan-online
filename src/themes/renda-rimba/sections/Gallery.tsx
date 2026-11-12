"use client";

import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

import { CallaLily, CarvedCorner, PearlStrands } from "../../_shared/ornaments";
import { useInvitation } from "../../_shared/runtime/context";
import { Lightbox } from "../../_shared/sections";
import { VelvetDrape } from "../../_shared/textures";
import { Art, F, Pic, Section, box, txt, u } from "../canvas";

/**
 * "Our Gallery" (desain 430 × ±800): tirai hijau, ukiran kayu di kedua sudut
 * atas, bunga calla marun, untai mutiara, dan grid foto 2 kolom.
 * Grid menampilkan maks. 6 foto (seperti desain); sisanya lewat tombol "Lihat semua".
 */
const MAX_GRID = 6;
const TOP = 112;
const PHOTO = { w: 162, h: 208, gapX: 18, pitch: 228 };

export function RendaGallery() {
  const { inv } = useInvitation();
  const photos = inv.data.gallery;
  const [active, setActive] = useState<number | null>(null);
  const shown = photos.slice(0, MAX_GRID);
  const rows = Math.ceil(shown.length / 2);
  const more = photos.length - shown.length;
  const height = TOP + rows * PHOTO.pitch + (more > 0 ? 70 : 10);
  const left0 = (430 - PHOTO.w * 2 - PHOTO.gapX) / 2;

  return (
    <Section id="galeri" height={height} bg="#000a00" overflow="hidden" z={1} threshold={0.08}>
      <div aria-hidden style={{ position: "absolute", inset: 0 }}>
        <Art
          slot="drape-bg"
          fit="cover"
          w={430}
          position="center top"
          filter="var(--inv-filter-drape)"
          fallback={<VelvetDrape slot={false} />}
        />
      </div>
      <Pic
        slot="carved-corner"
        l={-6}
        t={0}
        w={150}
        ratio={366 / 640}
        a="soft"
        fallback={<CarvedCorner slot={false} className="h-full w-full" />}
      />
      <Pic
        slot="carved-corner"
        l={286}
        t={0}
        w={150}
        ratio={366 / 640}
        flip
        a="soft"
        fallback={<CarvedCorner slot={false} className="h-full w-full" />}
      />
      <Pic
        slot="flowers-burgundy"
        l={-44}
        t={14}
        w={128}
        ratio={800 / 450}
        a="left"
        d={0.2}
        sway="stand"
        z={3}
        fallback={<CallaLily slot={false} className="h-full w-full" />}
      />

      <h2
        data-a="up"
        style={{
          ...box(0, 34, 430),
          ...txt(F.elegant, 46, 1.2),
          textShadow: "0 2px 10px rgb(0 0 0 / .5)",
          zIndex: 2,
        }}
      >
        Our Gallery
      </h2>

      {shown.map((p, i) => (
        <button
          key={p.url + i}
          type="button"
          onClick={() => setActive(i)}
          aria-label={`Buka foto ${i + 1}`}
          data-a="up"
          style={{
            ...box(
              left0 + (i % 2) * (PHOTO.w + PHOTO.gapX),
              TOP + Math.floor(i / 2) * PHOTO.pitch,
              PHOTO.w,
              PHOTO.h,
            ),
            ["--d" as string]: `${0.15 + (i % 2) * 0.12 + Math.floor(i / 2) * 0.05}s`,
            padding: 0,
            border: 0,
            overflow: "hidden",
            background: "#1b241c",
            cursor: "zoom-in",
            boxShadow: `0 ${u(6)} ${u(14)} rgb(0 0 0 / .45)`,
            zIndex: 1,
          }}
        >
          <Image
            src={p.url}
            alt={p.alt ?? `Foto ${i + 1}`}
            fill
            sizes="(max-width: 440px) 38vw, 165px"
            style={{ objectFit: "cover", objectPosition: `${p.focusX ?? 50}% ${p.focusY ?? 40}%` }}
          />
        </button>
      ))}

      {rows >= 2 && (
        <Pic
          slot="pearl-curve"
          l={352}
          t={TOP + 150}
          w={96}
          ratio={800 / 628}
          a="soft"
          d={0.6}
          sway="hang"
          z={2}
          fallback={<PearlStrands slot={false} className="h-full w-full" />}
        />
      )}
      {rows >= 2 && (
        <Pic
          slot="pearl-curve"
          l={-30}
          t={TOP + PHOTO.pitch + 140}
          w={86}
          ratio={800 / 628}
          flip
          a="soft"
          d={0.7}
          sway="hang"
          z={2}
          fallback={<PearlStrands slot={false} className="h-full w-full" />}
        />
      )}

      {more > 0 && (
        <button
          type="button"
          onClick={() => setActive(MAX_GRID)}
          style={{
            ...box(115, TOP + rows * PHOTO.pitch + 6, 200),
            padding: `${u(9)} 0`,
            borderRadius: 99,
            border: "1px solid rgb(246 239 228 / .7)",
            background: "rgb(5 23 10 / .55)",
            cursor: "pointer",
            ...txt(F.body, 12.5, 1, { ls: 0.4 }),
          }}
        >
          Lihat semua foto ({photos.length})
        </button>
      )}

      <AnimatePresence>
        {active !== null && (
          <Lightbox
            photos={photos}
            index={active}
            onChange={setActive}
            onClose={() => setActive(null)}
          />
        )}
      </AnimatePresence>
    </Section>
  );
}
