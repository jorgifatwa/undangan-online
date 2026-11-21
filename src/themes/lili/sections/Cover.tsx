"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useLayoutEffect, useRef } from "react";

import { couple, shortName } from "../../_shared/format";
import { useInvitation } from "../../_shared/runtime/context";
import type { CoverProps } from "../../types";
import laceBand from "../art/lace-band.webp";
import waxSeal from "../art/wax-seal.webp";
import { envelopeBg } from "../art/textures";
import { F } from "../canvas";

/**
 * Cover Lili — "A Love Letter From": amplop sage, nama skrip pink dengan "&"
 * krem, "Open The Invitation" bergaris bawah, pita renda melintang dengan
 * segel lilin lili (foto milik pemilik), lalu kotak gelap nama tamu. Pita renda = foto renda milik
 * pemilik yang dilengkungkan (`scripts/lili-lace.ts` → art/lace-band.webp).
 *
 * Kanvas 430 × STAGE_H (= layar screenshot desain) diskalakan agar MUAT di
 * layar: --cu = min(100cqw/430, 100cqh/STAGE_H). Latar amplop & garis tutup
 * amplop tetap memenuhi layar. Membuka: cover memudar sambil naik (animasi
 * sederhana, framer exit).
 */
const STAGE_H = 698;
const c = (px: number) => `calc(var(--cu) * ${px})`;

/** Kecilkan nama satu baris bila melebihi kotaknya (setelah font dimuat). */
function useFitLine(key: string) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const measure = () => {
      el.style.setProperty("--fit", "1");
      const need = el.offsetWidth;
      const have = parent.clientWidth;
      if (need > have + 1) el.style.setProperty("--fit", Math.max(0.45, have / need).toFixed(3));
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => undefined);
  }, [key]);
  return ref;
}

export function LiliCover({ onOpen, startMusic }: CoverProps) {
  const { inv, guestName } = useInvitation();
  const done = useRef(false);
  const [a, b] = inv.eventType === "WEDDING" ? couple(inv.data) : [null, null];
  const nameA = a ? shortName(a) : "";
  const nameB = b ? shortName(b) : "";
  const refA = useFitLine(nameA);
  const refB = useFitLine(nameB);

  const open = () => {
    if (done.current) return;
    done.current = true;
    startMusic(); // langsung di gesture tamu → diizinkan browser
    onOpen();
  };

  const script = (size: number): React.CSSProperties => ({
    display: "inline-block",
    whiteSpace: "nowrap",
    fontFamily: F.script,
    fontWeight: 400,
    fontSize: `calc(var(--cu) * ${size} * var(--fit, 1))`,
    lineHeight: 1.3,
  });

  return (
    <motion.div
      onClick={open}
      role="button"
      tabIndex={0}
      aria-label="Buka undangan"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") open();
      }}
      className="li-cover pointer-events-auto"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        containerType: "size",
        ["--cu" as string]: `min(calc(100cqw / 430), calc(100cqh / ${STAGE_H}))`,
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
        ...envelopeBg(),
      }}
      exit={{ opacity: 0, y: "-6%", transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }}
    >
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
        {/* tutup amplop: dua tepi miring bertemu di bawah segel (melebar keluar kanvas) */}
        <svg
          aria-hidden
          viewBox={`-400 0 1230 ${STAGE_H}`}
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            left: c(-400),
            top: 0,
            width: c(1230),
            height: c(STAGE_H),
            overflow: "visible",
          }}
        >
          <path d="M-400 84 L215 470 L830 113 V900 H-400Z" fill="rgb(0 0 0 / 0.045)" />
          <path
            d="M-400 84 L215 470 L830 113"
            fill="none"
            stroke="rgb(0 0 0 / 0.2)"
            strokeWidth={3}
            transform="translate(0 1.6)"
          />
          <path
            d="M-400 84 L215 470 L830 113"
            fill="none"
            stroke="rgb(255 255 255 / 0.14)"
            strokeWidth={1.2}
          />
        </svg>

        <p
          className="li-c-rise"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: c(44),
            textAlign: "center",
            fontFamily: F.serif,
            fontStyle: "italic",
            fontSize: c(25),
            lineHeight: 1.2,
            color: "#efe9d8",
          }}
        >
          A Love Letter From
        </p>

        {/* Nama — teks SSR, langsung terlihat (animasi masuk hanya transform) */}
        <h1 className="li-c-names" style={{ margin: 0 }}>
          <span
            style={{
              position: "absolute",
              left: c(52),
              top: c(108),
              width: c(372),
              textAlign: "left",
              color: "var(--inv-pink-text)",
            }}
          >
            <span ref={refA} style={script(68)}>
              {nameA}
            </span>
          </span>
          <span
            style={{
              position: "absolute",
              left: c(170),
              top: c(166),
              width: c(84),
              textAlign: "center",
              color: "#e8dcc0",
              ...script(58),
              fontFamily: F.amp,
              ["--fit" as string]: 1,
            }}
          >
            &amp;
          </span>
          <span
            style={{
              position: "absolute",
              left: c(20),
              top: c(184),
              width: c(372),
              textAlign: "right",
              color: "var(--inv-pink-text)",
            }}
          >
            <span ref={refB} style={script(68)}>
              {nameB}
            </span>
          </span>
        </h1>

        <p
          className="li-c-rise"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: c(312),
            textAlign: "center",
            fontFamily: F.serif,
            fontStyle: "italic",
            fontSize: c(24.5),
            lineHeight: 1.2,
            color: "#f4efe3",
            textDecoration: "underline",
            textDecorationThickness: c(1.4),
            textUnderlineOffset: c(4),
            ["--d" as string]: "0.25s",
          }}
        >
          Open The Invitation
        </p>

        <div
          className="li-c-lace"
          style={{
            position: "absolute",
            // sedikit melebihi tepi kanvas → pita setebal desain (±185 px)
            left: c(-28),
            top: c(372),
            width: c(486),
            height: c((486 * laceBand.height) / laceBand.width),
            filter: "drop-shadow(0 1px 1.5px rgb(0 0 0 / 0.3))",
          }}
        >
          <Image
            src={laceBand}
            alt=""
            fill
            priority
            sizes="(max-width: 440px) 100vw, 440px"
            style={{ objectFit: "fill" }}
          />
        </div>

        <div
          className="li-c-seal"
          style={{ position: "absolute", left: c(138), top: c(411), width: c(154), height: c(154) }}
        >
          <Image
            src={waxSeal}
            alt=""
            fill
            priority
            sizes="(max-width: 440px) 38vw, 170px"
            style={{ filter: "drop-shadow(0 3px 4px rgb(0 0 0 / 0.3))" }}
          />
        </div>

        {guestName && (
          <div
            className="li-c-rise"
            style={{
              position: "absolute",
              left: c(30),
              width: c(370),
              top: c(572),
              textAlign: "center",
              ["--d" as string]: "0.4s",
            }}
          >
            <p
              style={{
                fontFamily: F.serif,
                fontStyle: "italic",
                fontSize: c(12),
                lineHeight: 1.3,
                color: "#efe9d8",
              }}
            >
              Kepada Yth. Bapak/Ibu/Saudara/i
            </p>
            <p
              style={{
                display: "inline-block",
                maxWidth: "100%",
                marginTop: c(5),
                padding: `${c(2)} ${c(8)}`,
                background: "rgb(46 48 33 / 0.78)",
                fontFamily: F.serif,
                fontSize: c(21),
                lineHeight: 1.3,
                color: "#f2ede0",
                overflowWrap: "anywhere",
              }}
            >
              <span
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {guestName}
              </span>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
