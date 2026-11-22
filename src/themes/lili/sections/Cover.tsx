"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";

import { couple, shortName } from "../../_shared/format";
import { useInvitation } from "../../_shared/runtime/context";
import type { CoverProps } from "../../types";
import laceBand from "../art/lace-band.webp";
import waxSeal from "../art/wax-seal.webp";
import { envelopeBg, paperBg } from "../art/textures";
import { F } from "../canvas";

/**
 * Cover Lili — "A Love Letter From": amplop sage, nama skrip pink dengan "&"
 * krem, "Open The Invitation" bergaris bawah, pita renda melintang dengan
 * segel lilin lili (foto milik pemilik), lalu kotak gelap nama tamu. Pita renda = foto renda milik
 * pemilik yang sudah dilengkungkan (art/lace-band.webp).
 *
 * Kanvas 430 × STAGE_H (= layar screenshot desain) diskalakan agar MUAT di
 * layar: --cu = min(100cqw/430, 100cqh/STAGE_H). Latar amplop & garis tutup
 * amplop tetap memenuhi layar.
 *
 * Membuka (±2,4 s, kelas `li-opening`, keyframes di theme.css):
 *  1. cap lilin retak zig-zag → dua belahan jatuh + serpihan
 *  2. pita renda terbelah di bekas cap, kiri & kanan keluar layar
 *  3. tutup amplop (bidang di atas garis V) berputar ke atas (3D)
 *  4. surat (kertas polos) naik dari kantong amplop, kantong turun
 *  5. surat membesar memenuhi layar → onOpen(): isi hero muncul berurutan
 * Lapisan (belakang → depan): bagian dalam amplop, surat, kantong depan,
 * tutup amplop (judul & nama ikut), renda, cap. Ketuk lagi = lewati.
 */
const STAGE_H = 698;
const c = (px: number) => `calc(var(--cu) * ${px})`;
/** Durasi pembukaan sampai surat memenuhi layar (ms, sebelum skala lite). */
const OPEN_MS = 2350;
/** Ketukan kedua sebelum ini dianggap ketukan ganda tak sengaja. */
const SKIP_AFTER = 400;

/** Titik kanvas → koordinat layar (untuk clip-path lapisan selayar penuh). */
const pt = (x: number, y: number) =>
  `calc(50% + var(--cu) * ${x - 215}) calc(50% + var(--cu) * ${y - STAGE_H / 2})`;
/** Garis tutup amplop (kanvas): ujung kiri, ujung bawah (di bawah cap), ujung kanan. */
const V = { l: [-400, 84], tip: [215, 498], r: [830, 113] } as const;
const FLAP_CLIP = `polygon(${pt(-400, -4000)}, ${pt(830, -4000)}, ${pt(...V.r)}, ${pt(...V.tip)}, ${pt(...V.l)})`;
const POCKET_CLIP = `polygon(${pt(...V.l)}, ${pt(...V.tip)}, ${pt(...V.r)}, ${pt(830, 4000)}, ${pt(-400, 4000)})`;
/** Garis retak zig-zag cap (persen kotak cap). */
const CRACK = [
  [52, 0],
  [46, 17],
  [55, 33],
  [45, 50],
  [56, 66],
  [47, 83],
  [53, 100],
] as const;
const SEAL_L = `polygon(0 0, ${CRACK.map(([x, y]) => `${x}% ${y}%`).join(", ")}, 0 100%)`;
const SEAL_R = `polygon(100% 0, ${CRACK.map(([x, y]) => `${x}% ${y}%`).join(", ")}, 100% 100%)`;
/** Serpihan lilin: arah (derajat) & jarak terbang (px kanvas). */
const SHARDS = [
  [-150, 70],
  [-110, 92],
  [-60, 80],
  [-20, 64],
  [30, 86],
  [80, 74],
  [140, 90],
] as const;

/** Kanvas 430 × STAGE_H di tengah layar (dipakai tiap lapisan). */
function Stage({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
  );
}

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
  const { inv, guestName, lite } = useInvitation();
  const [stage, setStage] = useState<"closed" | "opening">("closed");
  const openedAt = useRef(0);
  const done = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const [a, b] = inv.eventType === "WEDDING" ? couple(inv.data) : [null, null];
  const nameA = a ? shortName(a) : "";
  const nameB = b ? shortName(b) : "";
  const refA = useFitLine(nameA);
  const refB = useFitLine(nameB);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    window.clearTimeout(timer.current);
    onOpen(); // isi undangan (sudah disiapkan di balik cover) mulai animasi masuk
  };

  const open = () => {
    if (stage === "opening") {
      // ketukan kedua = lewati animasi
      if (Date.now() - openedAt.current > SKIP_AFTER) finish();
      return;
    }
    startMusic(); // langsung di gesture tamu → diizinkan browser
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
    openedAt.current = Date.now();
    setStage("opening");
    timer.current = window.setTimeout(finish, OPEN_MS * (lite ? 0.6 : 1));
  };

  const script = (size: number): React.CSSProperties => ({
    display: "inline-block",
    whiteSpace: "nowrap",
    fontFamily: F.script,
    fontWeight: 400,
    fontSize: `calc(var(--cu) * ${size} * var(--fit, 1))`,
    lineHeight: 1.3,
  });

  const layer: React.CSSProperties = { position: "absolute", inset: 0 };

  return (
    <motion.div
      onClick={open}
      role="button"
      tabIndex={0}
      aria-label="Buka undangan"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") open();
      }}
      className={`li-cover pointer-events-auto ${stage === "opening" ? "li-opening" : ""}`}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        containerType: "size",
        perspective: "1400px",
        ["--cu" as string]: `min(calc(100cqw / 430), calc(100cqh / ${STAGE_H}))`,
        ["--k" as string]: lite ? 0.6 : 1,
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
        // bagian dalam amplop (terlihat saat tutup terangkat): sage lebih gelap
        ...envelopeBg("var(--inv-sage-dark)"),
      }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: "easeOut" } }}
    >
      {/* bayangan lembut di dalam amplop, makin gelap ke arah lipatan */}
      <div
        aria-hidden
        style={{
          ...layer,
          background: `radial-gradient(ellipse 70% 40% at 50% calc(50% + var(--cu) * ${V.tip[1] - STAGE_H / 2}), rgb(0 0 0 / 0.28), transparent 70%)`,
        }}
      />

      {/* surat: kertas polos, mulai tersembunyi di kantong amplop */}
      <div aria-hidden className="li-letter" style={{ ...layer, ...paperBg() }} />

      {/* kantong depan amplop (di bawah garis V) + nama tamu */}
      <div className="li-pocket" style={{ ...layer, ...envelopeBg(), clipPath: POCKET_CLIP }}>
        <div aria-hidden style={{ ...layer, background: "rgb(0 0 0 / 0.045)" }} />
        <Stage>
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
            <path
              d={`M${V.l.join(" ")} L${V.tip.join(" ")} L${V.r.join(" ")}`}
              fill="none"
              stroke="rgb(0 0 0 / 0.2)"
              strokeWidth={3}
              transform="translate(0 1.6)"
            />
          </svg>
          {guestName && (
            <div
              className="li-c-rise"
              style={{
                position: "absolute",
                left: c(30),
                width: c(370),
                top: c(588),
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
        </Stage>
      </div>

      {/* tutup amplop (di atas garis V): judul, nama, ajakan — ikut terangkat */}
      <div className="li-flap" style={{ ...layer, ...envelopeBg(), clipPath: FLAP_CLIP }}>
        <Stage>
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
            <path
              d={`M${V.l.join(" ")} L${V.tip.join(" ")} L${V.r.join(" ")}`}
              fill="none"
              stroke="rgb(255 255 255 / 0.14)"
              strokeWidth={2.4}
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
        </Stage>
      </div>

      <Stage>
        {/* pita renda: dua belahan (kiri & kanan bekas cap) */}
        <div
          className="li-c-lace"
          style={{
            position: "absolute",
            // pita lebih lebar dari kanvas (ditengahkan) → medalion jatuh di
            // x ±70 & ±360 dan tebal pita ±185 px seperti desain
            left: c(-100),
            top: c(338),
            width: c(630),
            height: c((630 * laceBand.height) / laceBand.width),
            filter: "drop-shadow(0 1px 1.5px rgb(0 0 0 / 0.3))",
          }}
        >
          {(["l", "r"] as const).map((side) => (
            <div
              key={side}
              className={`li-lace-${side}`}
              style={{
                position: "absolute",
                inset: 0,
                clipPath: side === "l" ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)",
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
          ))}
        </div>

        {/* cap lilin: dua belahan zig-zag + garis retak + serpihan */}
        <div
          className="li-c-seal"
          style={{ position: "absolute", left: c(149), top: c(432), width: c(132), height: c(132) }}
        >
          {(["l", "r"] as const).map((side) => (
            <div
              key={side}
              className={`li-seal-${side}`}
              style={{ position: "absolute", inset: 0, clipPath: side === "l" ? SEAL_L : SEAL_R }}
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
          ))}
          <svg
            aria-hidden
            className="li-crack"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            <polyline
              points={CRACK.map(([x, y]) => `${x},${y}`).join(" ")}
              fill="none"
              stroke="rgb(90 88 80 / 0.55)"
              strokeWidth={1.2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {SHARDS.map(([deg, dist], i) => (
            <span
              key={i}
              aria-hidden
              className="li-shard"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: c(5 + (i % 3) * 2),
                height: c(4 + (i % 2) * 2),
                borderRadius: "40%",
                background: "#f3f2ee",
                boxShadow: "0 1px 1px rgb(0 0 0 / 0.25)",
                ["--sx" as string]: c(
                  Math.round(Math.cos((deg * Math.PI) / 180) * dist * 100) / 100,
                ),
                ["--sy" as string]: c(
                  Math.round(Math.sin((deg * Math.PI) / 180) * dist * 100) / 100,
                ),
              }}
            />
          ))}
        </div>
      </Stage>
    </motion.div>
  );
}
