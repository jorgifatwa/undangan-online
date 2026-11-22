"use client";

import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

import { useInvitation } from "../../_shared/runtime/context";
import { Lightbox } from "../../_shared/sections";
import type { Photo } from "@/schemas/common";
import { EnterGroup, F, Section, txt, u } from "../canvas";
import { warmBg } from "./Gift";

/**
 * Galeri Foto: judul tebal miring di latar krem hangat, lalu mosaik foto
 * selebar layar tanpa jarak seperti desain — tiap kelompok 3 foto = satu foto
 * besar (280 × 430) + dua foto bertumpuk (150 × 215), sisi foto besar
 * bergantian. Sisa 1 foto = selebar layar, sisa 2 = berdampingan. Maks.
 * 9 foto di mosaik; sisanya lewat "Lihat semua foto" (lightbox).
 */
const MAX = 9;

function Cell({
  photo,
  w,
  h,
  onOpen,
  d,
}: {
  photo: Photo;
  w: number;
  h: number;
  onOpen: () => void;
  d: number;
}) {
  return (
    <button
      type="button"
      data-a="develop"
      onClick={onOpen}
      aria-label={photo.alt ?? "Lihat foto"}
      style={{
        position: "relative",
        width: u(w),
        height: u(h),
        overflow: "hidden",
        display: "block",
        pointerEvents: "auto",
        cursor: "zoom-in",
        background: "var(--inv-paper-dark)",
        ["--d" as string]: `${d}s`,
      }}
    >
      <Image
        src={photo.url}
        alt={photo.alt ?? ""}
        fill
        sizes={`(max-width: 440px) ${Math.round((w / 430) * 100)}vw, ${Math.round(w * 1.1)}px`}
        style={{
          objectFit: "cover",
          objectPosition: `${photo.focusX ?? 50}% ${photo.focusY ?? 50}%`,
        }}
      />
    </button>
  );
}

export function LiliGallery() {
  const { inv } = useInvitation();
  const photos = inv.data.gallery;
  const [active, setActive] = useState<number | null>(null);
  if (photos.length === 0) return null;
  const shown = photos.slice(0, MAX);

  const groups: Photo[][] = [];
  for (let i = 0; i < shown.length; i += 3) groups.push(shown.slice(i, i + 3));

  let idx = 0;
  return (
    <Section id="galeri" bg={warmBg} groups>
      <EnterGroup>
        <h2
          data-a="write"
          style={{
            ...txt(F.serif, 35, 1.25, { italic: true, weight: 700, color: "var(--inv-ink)" }),
            padding: `${u(18)} 0 ${u(16)}`,
          }}
        >
          Galeri Foto
        </h2>
      </EnterGroup>
      {groups.map((g, gi) => {
        const base = idx;
        idx += g.length;
        const open = (k: number) => () => setActive(base + k);
        if (g.length === 1)
          return (
            <EnterGroup key={gi} threshold={0.2}>
              <Cell photo={g[0]} w={430} h={300} onOpen={open(0)} d={0.1} />
            </EnterGroup>
          );
        if (g.length === 2)
          return (
            <EnterGroup key={gi} threshold={0.2} style={{ display: "flex" }}>
              <Cell photo={g[0]} w={215} h={300} onOpen={open(0)} d={0.1} />
              <Cell photo={g[1]} w={215} h={300} onOpen={open(1)} d={0.3} />
            </EnterGroup>
          );
        const big = <Cell photo={g[0]} w={280} h={430} onOpen={open(0)} d={0.1} />;
        const stack = (
          <div>
            <Cell photo={g[1]} w={150} h={215} onOpen={open(1)} d={0.35} />
            <Cell photo={g[2]} w={150} h={215} onOpen={open(2)} d={0.6} />
          </div>
        );
        return (
          <EnterGroup key={gi} threshold={0.2} style={{ display: "flex" }}>
            {gi % 2 === 0 ? (
              <>
                {big}
                {stack}
              </>
            ) : (
              <>
                {stack}
                {big}
              </>
            )}
          </EnterGroup>
        );
      })}
      {photos.length > MAX && (
        <div style={{ textAlign: "center", padding: `${u(18)} 0 ${u(6)}` }}>
          <button
            type="button"
            onClick={() => setActive(MAX)}
            style={{
              padding: `${u(6)} ${u(16)}`,
              borderRadius: 999,
              background: "#2b2c22",
              ...txt(F.serif, 13, 1.3, { weight: 600, color: "#f4efe3" }),
              pointerEvents: "auto",
              cursor: "pointer",
            }}
          >
            Lihat semua foto ({photos.length})
          </button>
        </div>
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
