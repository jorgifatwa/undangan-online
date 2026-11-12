"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { useInvitation } from "../../_shared/runtime/context";
import { SealArt, Sparkles } from "../../_shared/ornaments";
import { coupleNames } from "../../_shared/format";
import type { CoverProps } from "../../types";
import { Art } from "../art";
import { CText, F, Placed, canvasText, u, type Box } from "../canvas";
import { useTirai } from "../context";
import {
  ClosedEnvelopePart,
  Drapery,
  EnvelopeBack,
  EnvelopeFront,
  EnvelopeLining,
  ENVELOPE_BODY,
  ENVELOPE_HINGE_Y,
  FloorBouquet,
  HangingBouquet,
  LaceCard,
  SECTION1_DRAPERY,
  SECTION1_H,
  section1Fit,
  Verse,
} from "../scene";

/**
 * Cover amplop — port koreografi EnvelopeLanding desain referensi.
 * Kanvas cover 440 × 782.22 selalu selebar layar dan di tengah vertikal; tirai
 * berlanjut ke atas & bawah (salinan dicerminkan) alih-alih bilah kosong.
 *
 * Satu jam dari ketukan (ms): segel bergetar & retak (0–220) lalu pecah
 * 3 keping (220–1000) · tutup tertutup melipat (200–650) · tutup beludru berdiri
 * 3D (650–1150) · kartu naik sambil amplop berpindah ke posisi Section 1
 * (1050–2300) · kelopak menyembur (1700) · isi undangan dipasang (2300) lalu
 * cover memudar (2400–2750). Ketukan kedua (>500 ms) melewati sisa animasi.
 */

const CANVAS_H = 782.22;
const BG: Box = [-112.86, -17.74, 597.03, 897];
const TEXT = "var(--inv-cream, #fdf9f6)";

const CLOSED_ENVELOPE: Box = [81.93, 328.6, 276.13, 185.34];
const CLOSED_PAPER = {
  x: CLOSED_ENVELOPE[0] + CLOSED_ENVELOPE[2] * 0.02,
  y: CLOSED_ENVELOPE[1] + CLOSED_ENVELOPE[3] * 0.019,
  w: CLOSED_ENVELOPE[2] * 0.96,
  h: CLOSED_ENVELOPE[3] * 0.962,
};
const BODY_CENTER = {
  x: ENVELOPE_BODY[0] + ENVELOPE_BODY[2] / 2,
  y: ENVELOPE_BODY[1] + ENVELOPE_BODY[3] / 2,
};
const PAPER_CENTER = {
  x: CLOSED_PAPER.x + CLOSED_PAPER.w / 2,
  y: CLOSED_PAPER.y + CLOSED_PAPER.h / 2,
};
const FIT = "var(--s1-fit, 1)";
/** Amplop terbuka mulai tepat di atas amplop tertutup (diskalakan), lalu "berjalan" ke tempatnya di Section 1. */
const TRAVEL_FROM = {
  "--travel-x": `calc(${u(220 - BODY_CENTER.x)} + ${u(PAPER_CENTER.x - 220)} / ${FIT})`,
  "--travel-y": `calc((50cqh - ${u(CANVAS_H / 2 - PAPER_CENTER.y)}) / ${FIT} - ${u(BODY_CENTER.y)})`,
  "--travel-sx": `calc(${(CLOSED_PAPER.w / ENVELOPE_BODY[2]).toFixed(4)} / ${FIT})`,
  "--travel-sy": `calc(${(CLOSED_PAPER.h / ENVELOPE_BODY[3]).toFixed(4)} / ${FIT})`,
  "--card-drop": u(ENVELOPE_HINGE_Y - 130.1 + 10),
} as React.CSSProperties;

const SEAL_BOX = { x: 220 - 47.49 / 2, y: 427.9 - 49.99 / 2, w: 47.49, h: 49.99 };
const SEAL_TURN = -176;
const SEAL_CRACKS = [
  "52,47 55,30 48,15 50,7",
  "52,47 38,58 30,72 15,81",
  "52,47 68,52 80,44 93,48",
];
const SEAL_SHARDS = [
  {
    clip: "0 0, 51% 0, 48% 15%, 55% 30%, 52% 47%, 38% 58%, 30% 72%, 0 85%",
    center: [26, 34],
    spin: -38,
  },
  {
    clip: "51% 0, 100% 0, 100% 50%, 80% 44%, 68% 52%, 52% 47%, 55% 30%, 48% 15%",
    center: [76, 24],
    spin: 44,
  },
  {
    clip: "0 85%, 30% 72%, 38% 58%, 52% 47%, 68% 52%, 80% 44%, 100% 50%, 100% 100%, 0 100%",
    center: [52, 80],
    spin: -24,
  },
];

const PETAL_BURST_AT = 1700;
const SECTION_READY_AT = 2300;
const FADE_OUT_AT = 2400;
const SKIP_AFTER = 500;

const canvasStyle: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: "100cqw",
  aspectRatio: `440 / ${CANVAS_H}`,
  transform: "translate(-50%, -50%)",
  containerType: "inline-size",
};

function Seal() {
  return <Art slot="wax-seal" w={48} priority fallback={<SealArt slot={false} />} />;
}

/** Potongan Section 1 (dibatasi pita horizontal) — tutup amplop & badan dipotong terpisah. */
function Slice({
  top,
  height,
  className,
  children,
}: {
  top: number;
  height: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        left: 0,
        top: u(top),
        width: "100%",
        height: u(height),
        overflow: "hidden",
        willChange: "transform",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: u(-top),
          width: "100%",
          height: u(SECTION1_H),
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function TiraiCover({ onOpen, startMusic, firstSection }: CoverProps) {
  const { inv, guestName, lite } = useInvitation();
  const { burst, setIntroPlayed } = useTirai();
  const [stage, setStage] = useState<"closed" | "opening">("closed");
  const timers = useRef<number[]>([]);
  const opened = useRef(false);
  const openedAt = useRef(0);
  const mouthRef = useRef<HTMLDivElement | null>(null);
  const sealSpinRef = useRef<HTMLDivElement | null>(null);
  const sealPiecesRef = useRef<HTMLDivElement | null>(null);
  // Transisi "berjalan" ke Section 1 hanya bila section pertama memang kartu ayat.
  const travels = firstSection === "ayat";

  const names = inv.eventType === "WEDDING" ? coupleNames(inv.data) : "";
  const quote = inv.data.quote;

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const reveal = () => {
    if (opened.current) return;
    opened.current = true;
    setIntroPlayed(travels);
    onOpen(); // pasang isi undangan; cover memudar lewat animasi keluarnya
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const landing = e.currentTarget;
    if (stage === "opening") {
      // Ketukan kedua melewati sisa transisi (bukan ketukan ganda tak sengaja)
      if (Date.now() - openedAt.current < SKIP_AFTER) return;
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      reveal();
      return;
    }
    startMusic(); // langsung di gesture tamu → diizinkan browser

    // Bekukan segel pada sudut putarannya sekarang; keping dilempar menjauhi tengah.
    const spin = sealSpinRef.current && getComputedStyle(sealSpinRef.current).transform;
    const spinAngle =
      spin && spin !== "none"
        ? (Math.atan2(new DOMMatrix(spin).b, new DOMMatrix(spin).a) * 180) / Math.PI
        : 0;
    const angle = SEAL_TURN + spinAngle;
    const pieces = sealPiecesRef.current;
    if (pieces) {
      pieces.style.setProperty("--seal-angle", `${angle}deg`);
      const rad = (angle * Math.PI) / 180;
      pieces.querySelectorAll<HTMLElement>(".tb-seal-shard").forEach((el, i) => {
        const [cx, cy] = SEAL_SHARDS[i].center;
        const lx = cx - 50;
        const ly = cy - 50;
        const len = Math.hypot(lx, ly) || 1;
        el.style.setProperty("--dx", u(((lx * Math.cos(rad) - ly * Math.sin(rad)) / len) * 26));
        el.style.setProperty("--dy", u(((lx * Math.sin(rad) + ly * Math.cos(rad)) / len) * 18));
      });
    }
    landing.style.setProperty("--s1-fit", section1Fit(landing.clientWidth).toFixed(4));
    setStage("opening");
    openedAt.current = Date.now();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      at(120, reveal);
      return;
    }
    if (!lite && travels) {
      at(PETAL_BURST_AT, () => {
        const m = mouthRef.current?.getBoundingClientRect();
        if (m) burst(m.left + m.width / 2, m.top);
      });
    }
    at(travels ? SECTION_READY_AT : 1300, reveal);
  };

  return (
    <motion.div
      onClick={handleTap}
      role="button"
      tabIndex={0}
      aria-label="Buka undangan"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") (e.currentTarget as HTMLDivElement).click();
      }}
      className={`tb-cover pointer-events-auto ${stage === "opening" ? "tb-opening" : ""}`}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        containerType: "size",
        backgroundColor: "#0a160f",
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      exit={{
        opacity: 0,
        transition: { duration: 0.35, delay: FADE_OUT_AT - SECTION_READY_AT > 0 ? 0.1 : 0 },
      }}
    >
      {/* Lapisan 1: tirai, bunga lantai, judul */}
      <div style={canvasStyle}>
        {[BG[1] - BG[3], BG[1] + BG[3]].map((y) => (
          <div
            key={y}
            style={{
              position: "absolute",
              left: u(BG[0]),
              top: u(y),
              width: u(BG[2]),
              height: u(BG[3]),
              transform: "scaleY(-1)",
            }}
          >
            <Drapery />
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            left: u(BG[0]),
            top: u(BG[1]),
            width: u(BG[2]),
            height: u(BG[3]),
          }}
        >
          <Drapery priority />
        </div>
        <Placed
          img={[298.06, 522.92, 237.47, 296.84]}
          clip={[298.06, 522.92, 141.94, 296.84]}
          className="tb-bouquet"
        >
          <FloorBouquet w={237} />
        </Placed>

        {/* Judul — teks SSR, langsung terlihat tanpa menunggu JavaScript */}
        <p
          className="tb-fade"
          style={canvasText([77.07, 157.7, 39.78], F.saveDate, 20.835, 28.524, {
            letterSpacing: 1.458,
            renderScale: 0.75064,
            color: TEXT,
          })}
        >
          G
        </p>
        <p
          className="tb-fade"
          style={canvasText([116.14, 152.37, 247.51], F.cormorant, 25.338, 35.252, {
            letterSpacing: 1.774,
            align: "left",
            renderScale: 0.75004,
            color: TEXT,
          })}
        >
          ETTING MARRIED
        </p>
        <p
          className="tb-fade"
          style={canvasText([155.57, 107.36, 128.87], F.saveDate, 29.79, 41.597, {
            renderScale: 0.40781,
            color: TEXT,
          })}
        >
          We&rsquo;re
        </p>
        <div className="tb-fade">
          <CText
            style={canvasText([57.59, 189.4, 328.46], F.script, 45.496, 63.318, {
              letterSpacing: 3.64,
              renderScale: 0.79147,
              color: TEXT,
            })}
          >
            {names}
          </CText>
        </div>
        <p
          className="tb-fade"
          style={canvasText([100, 523.17, 240], F.cormorant, 10.004, 11.409, {
            letterSpacing: 1.13,
            renderScale: 0.40745,
            color: TEXT,
          })}
        >
          KETUK AMPLOP UNTUK MEMBUKA
        </p>
        {guestName && (
          <div
            className="tb-fade"
            style={{
              position: "absolute",
              left: u(90),
              top: u(546),
              width: u(260),
              textAlign: "center",
              color: TEXT,
              pointerEvents: "none",
            }}
          >
            <div style={{ fontFamily: F.cormorant, fontSize: u(9.5), letterSpacing: u(1.1) }}>
              KEPADA YTH. BAPAK/IBU/SAUDARA/I
            </div>
            <div
              style={{
                marginTop: u(6),
                fontFamily: F.cormorant,
                fontWeight: 700,
                fontSize: u(17),
                lineHeight: 1.2,
                overflowWrap: "anywhere",
              }}
            >
              {guestName}
            </div>
          </div>
        )}
        <Placed
          img={[-73.9, 607.77, 194.16, 242.7]}
          clip={[0, 607.77, 120.26, 242.7]}
          className="tb-bouquet"
        >
          <FloorBouquet w={194} />
        </Placed>
      </div>

      {/* Lapisan 2–3: Section 1 seperti tergambar di layar ini (mengecil di layar pendek) */}
      {travels && stage === "opening" && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: u(SECTION1_H),
            transformOrigin: "50% 0",
            scale: FIT,
            pointerEvents: "none",
          }}
        >
          <div
            className="tb-section-bg"
            style={{ position: "absolute", left: 0, top: 0, width: "100%", height: u(SECTION1_H) }}
          >
            <Placed
              img={SECTION1_DRAPERY}
              clip={[SECTION1_DRAPERY[0], 0, SECTION1_DRAPERY[2], SECTION1_H]}
            >
              <Drapery />
            </Placed>
          </div>
          <div
            className="tb-open-scene"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: u(SECTION1_H),
              transformOrigin: `${u(BODY_CENTER.x)} ${u(BODY_CENTER.y)}`,
              ...TRAVEL_FROM,
            }}
          >
            <Slice top={0} height={ENVELOPE_HINGE_Y} className="tb-open-flap">
              <EnvelopeBack skip />
              <EnvelopeLining skip />
            </Slice>
            <Slice top={ENVELOPE_HINGE_Y - 1} height={SECTION1_H - ENVELOPE_HINGE_Y + 1}>
              <EnvelopeBack skip />
              <EnvelopeLining skip />
            </Slice>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: u(722),
                overflow: "hidden",
              }}
            >
              <div className="tb-card" style={{ position: "absolute", inset: 0 }}>
                <LaceCard skip />
                {quote?.translation && (
                  <Verse text={quote.translation} source={quote.source} skip />
                )}
              </div>
            </div>
            <EnvelopeFront skip />
            <div
              ref={mouthRef}
              style={{
                position: "absolute",
                left: u(220),
                top: u(ENVELOPE_HINGE_Y),
                width: 1,
                height: 1,
              }}
            />
          </div>
        </div>
      )}

      {/* Lapisan 4: amplop tertutup (badan + tutup), kilau, segel, bunga */}
      <div style={canvasStyle}>
        <ClosedEnvelopePart box={CLOSED_ENVELOPE} part="rest" className="tb-closed-rest" />
        <ClosedEnvelopePart box={CLOSED_ENVELOPE} part="flap" className="tb-flap" />
        <div className="tb-fade" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {[
            [340.945, 347.035],
            [96.825, 513.955],
          ].map(([x, y]) => (
            <Sparkles
              key={x}
              style={{
                position: "absolute",
                left: u(x - 51.23 / 2),
                top: u(y - 72.13 / 2),
                width: u(51.23),
                height: u(72.13),
                transform: "rotate(40.43deg) scaleY(-1)",
              }}
            />
          ))}
        </div>
        <div
          className="tb-seal"
          role="img"
          aria-label="Segel lilin"
          style={{
            position: "absolute",
            left: u(SEAL_BOX.x),
            top: u(SEAL_BOX.y),
            width: u(SEAL_BOX.w),
            height: u(SEAL_BOX.h),
            transform: `rotate(${SEAL_TURN}deg)`,
            pointerEvents: "none",
          }}
        >
          <div
            ref={sealSpinRef}
            className="tb-seal-spin"
            style={{ position: "relative", width: "100%", height: "100%" }}
          >
            <Seal />
          </div>
        </div>
        <div ref={sealPiecesRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {SEAL_SHARDS.map((s, i) => (
            <div
              key={i}
              className="tb-seal-shard"
              style={
                {
                  position: "absolute",
                  left: u(SEAL_BOX.x),
                  top: u(SEAL_BOX.y),
                  width: u(SEAL_BOX.w),
                  height: u(SEAL_BOX.h),
                  transform: "rotate(var(--seal-angle, 0deg))",
                  clipPath: `polygon(${s.clip})`,
                  "--spin": `${s.spin}deg`,
                } as React.CSSProperties
              }
            >
              <Seal />
            </div>
          ))}
          <svg
            className="tb-seal-crack"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
            style={{
              position: "absolute",
              left: u(SEAL_BOX.x),
              top: u(SEAL_BOX.y),
              width: u(SEAL_BOX.w),
              height: u(SEAL_BOX.h),
              overflow: "visible",
              transform: "rotate(var(--seal-angle, 0deg))",
            }}
          >
            {SEAL_CRACKS.map((points) => (
              <polyline
                key={points}
                points={points}
                pathLength={1}
                fill="none"
                stroke="#1e0606"
                strokeWidth={2.6}
                strokeLinejoin="round"
              />
            ))}
          </svg>
        </div>
        <Placed img={[13.65, 267.44, 197.2, 246.5]} className="tb-bouquet">
          <HangingBouquet w={197} />
        </Placed>
        <Placed img={[298.06, 452.92, 98.08, 122.61]} className="tb-bouquet">
          <HangingBouquet w={98} />
        </Placed>
      </div>
    </motion.div>
  );
}
