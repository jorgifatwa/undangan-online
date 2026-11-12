"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { firstEvent } from "@/lib/datetime";

import { MonogramFill, OvalBaroqueFrame, initials } from "../../_shared/ornaments";
import { couple, shortName } from "../../_shared/format";
import { useInvitation } from "../../_shared/runtime/context";
import { LeafPattern } from "../../_shared/textures";
import type { CoverProps } from "../../types";
import { Art, F } from "../canvas";

/**
 * Cover Renda Rimba: latar daun setinggi layar, judul kuas, bingkai oval emas
 * dengan foto, nama tamu, dan tombol "Buka Undangan". Saat diketuk, cover
 * terbelah jadi dua daun pintu yang berputar membuka (CSS 3D, compositor),
 * isi undangan sudah terpasang di baliknya. Ketukan kedua melewati animasi.
 *
 * Tata letak memakai kanvas 430 × STAGE_H yang diskalakan agar MUAT di layar
 * (lebar dan tinggi): --cu = min(100cqw/430, 100cqh/STAGE_H).
 */
const STAGE_H = 790;
const DOOR_MS = 1100;
/** Ketukan kedua sebelum ini dianggap ketukan ganda tak sengaja. */
const SKIP_AFTER = 400;
const c = (px: number) => `calc(var(--cu) * ${px})`;

function coverDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

function Face({ door }: { door?: "l" | "r" }) {
  const { inv, guestName } = useInvitation();
  const namesRef = useRef<HTMLDivElement | null>(null);
  const hidden = door === "r";

  // Nama panjang: kecilkan sampai muat (diukur setelah font kuas dimuat).
  useEffect(() => {
    const el = namesRef.current;
    if (!el) return;
    const measure = () => {
      el.style.setProperty("--fit", "1");
      const need = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
      const have = el.clientWidth;
      if (need > have + 1) el.style.setProperty("--fit", Math.max(0.45, have / need).toFixed(3));
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => undefined);
  }, []);

  if (inv.eventType !== "WEDDING") return null;
  const d = inv.data;
  const [a, b] = couple(d);
  const event = firstEvent(d.events);
  const photo = d.photos.cover;
  const btnTop = guestName ? 702 : 650;
  // Hanya daun kiri yang membawa <h1>; daun kanan salinan visual.
  const NameTag = hidden ? "p" : "h1";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "var(--inv-cover-bg)",
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        <Art
          slot="leaf-bg"
          fit="cover"
          w={430}
          priority
          filter="var(--inv-filter-leaf)"
          fallback={<LeafPattern slot={false} />}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: c(430),
          height: c(STAGE_H),
          marginLeft: c(-215),
          marginTop: c(-STAGE_H / 2),
        }}
      >
        <p
          className="rr-c-rise"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: c(58),
            margin: 0,
            textAlign: "center",
            fontFamily: F.sans,
            fontSize: c(13.5),
            letterSpacing: c(0.3),
            color: "var(--inv-cream)",
          }}
        >
          The Wedding Of
        </p>

        {/* Nama — teks SSR, langsung terlihat (animasi masuk hanya transform) */}
        <div
          ref={namesRef}
          className="rr-c-names"
          style={{
            position: "absolute",
            left: c(8),
            top: c(84),
            width: c(414),
            textAlign: "center",
            transform: "rotate(-8deg)",
          }}
        >
          <NameTag
            style={{
              display: "inline-flex",
              alignItems: "flex-start",
              gap: c(6),
              margin: 0,
              paddingBottom: c(26),
              whiteSpace: "nowrap",
              fontFamily: F.brush,
              fontWeight: 400,
              fontSize: `calc(var(--cu) * 92 * var(--fit, 1))`,
              lineHeight: 1.05,
              color: "#fff",
            }}
          >
            <span>{shortName(a)}</span>
            <span style={{ fontSize: "0.5em", marginTop: "1.05em" }}>&amp;</span>
            <span style={{ marginTop: "0.34em" }}>{shortName(b)}</span>
          </NameTag>
        </div>
        <p
          className="rr-c-rise"
          style={{
            position: "absolute",
            right: c(40),
            top: c(222),
            margin: 0,
            fontFamily: F.hand,
            fontSize: c(20),
            color: "#fff",
            transform: "rotate(-9deg)",
          }}
        >
          {coverDate(event.date)}
        </p>

        <div
          className="rr-c-zoom"
          style={{ position: "absolute", left: c(70), top: c(258), width: c(290), height: c(348) }}
        >
          <div
            style={{
              position: "absolute",
              left: "13.5%",
              top: "12%",
              width: "73%",
              height: "76%",
              borderRadius: "50%",
              overflow: "hidden",
              background: "#2a2a2a",
            }}
          >
            {!photo && (
              <MonogramFill
                text={initials(shortName(a), shortName(b))}
                background="radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--inv-band) 85%, white) 0%, var(--inv-cover-bg) 75%)"
                color="var(--inv-cream)"
                fontFamily={F.brush}
                scale={0.95}
              />
            )}
            {photo && (
              <Image
                src={photo.url}
                alt={hidden ? "" : (photo.alt ?? "Foto pasangan")}
                fill
                priority
                sizes="(max-width: 440px) 50vw, 220px"
                style={{
                  objectFit: "cover",
                  objectPosition: `${photo.focusX ?? 50}% ${photo.focusY ?? 35}%`,
                }}
              />
            )}
          </div>
          <div style={{ position: "absolute", inset: 0 }}>
            <Art
              slot="oval-frame"
              w={290}
              priority
              fallback={
                <OvalBaroqueFrame slot={false} className="absolute inset-0 h-full w-full" />
              }
            />
          </div>
        </div>

        {guestName && (
          <div
            className="rr-c-rise"
            style={{
              position: "absolute",
              left: c(40),
              width: c(350),
              top: c(624),
              textAlign: "center",
              color: "var(--inv-cream)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: F.sans,
                fontWeight: 300,
                fontSize: c(11),
                letterSpacing: c(0.9),
              }}
            >
              Kepada Yth. Bapak/Ibu/Saudara/i
            </p>
            <p
              style={{
                margin: `${c(5)} 0 0`,
                fontFamily: F.sans,
                fontWeight: 500,
                fontSize: c(18),
                lineHeight: 1.25,
                overflowWrap: "anywhere",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {guestName}
            </p>
          </div>
        )}

        <span
          className="rr-c-rise"
          aria-hidden
          style={{
            position: "absolute",
            left: c(134),
            top: c(btnTop),
            width: c(162),
            height: c(34),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: c(8),
            borderRadius: 999,
            background: "var(--inv-cover-btn)",
            color: "#f6ead8",
            fontFamily: F.sans,
            fontSize: c(14.5),
            boxShadow: `0 ${c(3)} ${c(10)} rgb(0 0 0 / 0.25)`,
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: c(17), height: c(17) }} aria-hidden>
            <path
              fill="currentColor"
              d="M12 5.5C10.3 4.3 7.9 3.7 5 3.7c-1 0-2 .1-3 .3v15.2c1-.2 2-.3 3-.3 2.9 0 5.3.6 7 1.8 1.7-1.2 4.1-1.8 7-1.8 1 0 2 .1 3 .3V4c-1-.2-2-.3-3-.3-2.9 0-5.3.6-7 1.8Zm-1 12.6c-1.6-.8-3.6-1.2-6-1.2-.6 0-1.3 0-2 .1V5.6c.6-.1 1.3-.1 2-.1 2.4 0 4.4.5 6 1.4v11.2Zm10-1.1c-.7-.1-1.4-.1-2-.1-2.4 0-4.4.4-6 1.2V6.9c1.6-.9 3.6-1.4 6-1.4.7 0 1.4 0 2 .1V17Z"
            />
          </svg>
          Buka Undangan
        </span>
      </div>
    </div>
  );
}

export function RendaCover({ onOpen, startMusic }: CoverProps) {
  const [stage, setStage] = useState<"closed" | "opening" | "skipped">("closed");
  const openedAt = useRef(0);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onOpen(); // pasang isi undangan di balik pintu; cover dilepas lewat animasi keluarnya
  };

  const tap = () => {
    if (stage === "opening") {
      if (Date.now() - openedAt.current < SKIP_AFTER) return;
      setStage("skipped");
      finish();
      return;
    }
    if (stage !== "closed") return;
    startMusic(); // langsung di gesture tamu → diizinkan browser
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStage("skipped");
      finish();
      return;
    }
    openedAt.current = Date.now();
    setStage("opening");
    // Daun pintu mulai berputar dulu (compositor), baru isi undangan dirender
    // di baliknya — render besar tidak menunda frame pertama animasi.
    requestAnimationFrame(() => requestAnimationFrame(finish));
  };

  return (
    <motion.div
      onClick={tap}
      role="button"
      tabIndex={0}
      aria-label="Buka undangan"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") (e.currentTarget as HTMLDivElement).click();
      }}
      className={`rr-cover pointer-events-auto ${stage === "opening" ? "rr-opening" : ""} ${stage === "skipped" ? "rr-skipped" : ""}`}
      style={{
        position: "absolute",
        inset: 0,
        containerType: "size",
        ["--cu" as string]: `min(calc(100cqw / 430), calc(100cqh / ${STAGE_H}))`,
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      // Tetap terpasang selama pintu berputar, lalu sisa daun memudar.
      exit={{ opacity: 0, transition: { duration: 0.25, delay: (DOOR_MS - 250) / 1000 } }}
    >
      <div className="rr-door rr-door--l">
        <Face door="l" />
      </div>
      {/* Daun kanan disiapkan sejak awal (tersembunyi) agar gambarnya sudah ter-decode */}
      <div className="rr-door rr-door--r" aria-hidden inert>
        <Face door="r" />
      </div>
    </motion.div>
  );
}
