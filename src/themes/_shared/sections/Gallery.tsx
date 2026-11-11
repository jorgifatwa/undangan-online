"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { Photo } from "@/schemas/common";

import { Reveal } from "../motion/Reveal";
import { useInvitation } from "../runtime/context";
import { SectionShell } from "../runtime/SectionShell";
import { FillPhoto, SectionTitle } from "./ui";

/**
 * Lightbox galeri: geser kiri/kanan, tombol panah, keyboard, tutup dengan Esc
 * atau ketuk latar. Dipakai ulang oleh tema lain.
 */
export function Lightbox({
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
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  const photo = photos[index];
  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Galeri foto"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <motion.div
        key={index}
        className="relative h-[80dvh] w-[92vw] max-w-[440px]"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={photo.url}
          alt={photo.alt ?? `Foto ${index + 1}`}
          fill
          sizes="(max-width: 480px) 92vw, 440px"
          className="object-contain"
        />
      </motion.div>
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute top-4 right-4 size-11 text-3xl text-white"
      >
        ×
      </button>
      {photos.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Foto sebelumnya"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-2 size-11 text-4xl text-white/80"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Foto selanjutnya"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-2 size-11 text-4xl text-white/80"
          >
            ›
          </button>
          <p className="absolute bottom-5 text-sm text-white/70">
            {index + 1} / {photos.length}
          </p>
        </>
      )}
    </motion.div>,
    document.body,
  );
}

/** Galeri default: grid 2 kolom dengan foto pertama besar. */
export function DefaultGaleri() {
  const { inv } = useInvitation();
  const photos = inv.data.gallery;
  const [active, setActive] = useState<number | null>(null);

  return (
    <SectionShell id="galeri" className="px-4 py-20">
      <SectionTitle kicker="Momen" title="Galeri" />
      <div className="grid grid-cols-2 gap-2">
        {photos.map((p, i) => (
          <Reveal
            key={p.url + i}
            variant={i % 2 ? "tilt-right" : "tilt-left"}
            className={i % 5 === 0 ? "col-span-2" : ""}
            amount={0.1}
          >
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Buka foto ${i + 1}`}
              className={`relative block w-full overflow-hidden rounded-xl ${i % 5 === 0 ? "aspect-[4/3]" : "aspect-[3/4]"}`}
            >
              <FillPhoto
                photo={p}
                sizes={i % 5 === 0 ? "440px" : "220px"}
                className="transition-transform duration-500 hover:scale-105"
              />
            </button>
          </Reveal>
        ))}
      </div>
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
    </SectionShell>
  );
}
