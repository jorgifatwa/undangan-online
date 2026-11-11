"use client";

import { motion } from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { AssetImg, useSlotAsset, type SlotProp } from "../assets";
import { laceEdgeAlong } from "./Lace";
import { r2 } from "./geom";
import { T } from "./tokens";
import { WaxSealBreak, type SealEmblem, type SealTone } from "./WaxSeal";

/**
 * Amplop orisinal yang terdiri dari bagian terpisah agar bisa dianimasikan:
 *   EnvelopeInside  – bagian dalam (lapisan beludru)
 *   EnvelopePocket  – kantong depan (menutupi bawah kartu)
 *   EnvelopeFlap    – tutup segitiga; sisi luar kertas + tepi renda, sisi dalam beludru
 *   EnvelopeClosed  – amplop tertutup utuh (badan + tutup), untuk cover
 * Semua memakai viewBox 300×200 dan mengisi kontainer (aspect-ratio 3/2).
 */

const W = 300;
const H = 200;
/** Ujung tutup amplop (saat tertutup) dari atas. */
export const FLAP_TIP = 128;

function usePaperGradient() {
  const id = useId().replace(/:/g, "");
  const defs = (
    <defs>
      <linearGradient id={`${id}p`} x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" style={{ stopColor: T.paper }} />
        <stop offset="1" style={{ stopColor: T.paperShade }} />
      </linearGradient>
      <linearGradient id={`${id}v`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: T.velvetDark }} />
        <stop offset="0.6" style={{ stopColor: T.velvet }} />
        <stop offset="1" style={{ stopColor: T.velvetLight }} />
      </linearGradient>
      <radialGradient id={`${id}s`} cx="50%" cy="0%" r="90%">
        <stop offset="0" stopOpacity="0.35" style={{ stopColor: "#000" }} />
        <stop offset="1" stopOpacity="0" style={{ stopColor: "#000" }} />
      </radialGradient>
    </defs>
  );
  return { id, defs, paper: `url(#${id}p)`, velvet: `url(#${id}v)`, shade: `url(#${id}s)` };
}

/** Bagian dalam amplop terbuka: beludru marun (terlihat di belakang kartu). */
function EnvelopeInsideSvg({ className }: { className?: string }) {
  const g = usePaperGradient();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden preserveAspectRatio="none">
      {g.defs}
      <rect x="2" y="0" width={W - 4} height={H} rx="4" style={{ fill: g.velvet }} />
      <rect x="2" y="0" width={W - 4} height={H} rx="4" style={{ fill: g.shade }} />
    </svg>
  );
}

/** Kantong depan: lipatan kiri, kanan, dan bawah (potongan V di atas). */
function EnvelopePocketSvg({ className }: { className?: string }) {
  const g = usePaperGradient();
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      aria-hidden
      style={{ overflow: "visible" }}
    >
      {g.defs}
      <path
        d={`M0 0 L150 112 L300 0 L300 196 Q300 200 296 200 L4 200 Q0 200 0 196 Z`}
        style={{ fill: g.paper }}
      />
      {/* bayangan lipatan */}
      <path
        d="M0 200 L138 120 M300 200 L162 120"
        fill="none"
        style={{ stroke: T.paperDark, strokeWidth: 1, opacity: 0.55 }}
      />
      <path
        d={`M0 0 L150 112 L300 0`}
        fill="none"
        style={{ stroke: T.paperDark, strokeWidth: 1.2, opacity: 0.7 }}
      />
      <path
        d={`M0 0 L150 112 L300 0 L300 20 L150 128 L0 20 Z`}
        style={{ fill: "#000", opacity: 0.06 }}
      />
    </svg>
  );
}

/** Tutup amplop. face="outside" = kertas + renda; "inside" = beludru. */
function EnvelopeFlapSvg({
  face = "outside",
  className,
}: {
  face?: "outside" | "inside";
  className?: string;
}) {
  const g = usePaperGradient();
  const lace = useMemo(() => {
    const left = laceEdgeAlong([0, 0], [150, FLAP_TIP], { size: 9, side: -1 });
    const right = laceEdgeAlong([150, FLAP_TIP], [300, 0], { size: 9, side: -1 });
    return { left, right };
  }, []);
  const tri = `M0 0 L300 0 L156 ${FLAP_TIP - 3} Q150 ${FLAP_TIP + 2} 144 ${FLAP_TIP - 3} Z`;

  if (face === "inside") {
    return (
      <svg viewBox={`0 0 ${W} ${FLAP_TIP + 14}`} className={className} aria-hidden>
        {g.defs}
        <path d={tri} style={{ fill: g.velvet }} />
        <path d={tri} style={{ fill: "#fff", opacity: 0.05 }} transform="translate(0 -2)" />
      </svg>
    );
  }
  return (
    <svg
      viewBox={`0 0 ${W} ${FLAP_TIP + 14}`}
      className={className}
      aria-hidden
      style={{ overflow: "visible" }}
    >
      {g.defs}
      <path d={tri} transform="translate(0 3)" style={{ fill: "#000", opacity: 0.18 }} />
      {/* tepi renda bergelombang + lubang */}
      <path
        d={`${lace.left.scallops} ${lace.right.scallops.replace(/^M[^A]+/, "")} L300 0 L0 0 Z`}
        style={{ fill: T.lace }}
      />
      {[...lace.left.holes, ...lace.right.holes].map(([x, y], i) => (
        <circle key={i} cx={r2(x)} cy={r2(y)} r="1.6" style={{ fill: T.laceShade }} />
      ))}
      <path d={tri} style={{ fill: g.paper }} transform="translate(0 -1)" />
      <path
        d={`M10 4 L150 ${FLAP_TIP - 10} L290 4`}
        fill="none"
        style={{ stroke: T.paperDark, strokeWidth: 0.7, strokeDasharray: "2 3", opacity: 0.8 }}
      />
    </svg>
  );
}

/** Badan amplop tertutup (tampak belakang, tanpa tutup). */
function EnvelopeBodySvg({ className }: { className?: string }) {
  const g = usePaperGradient();
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      aria-hidden
      style={{ overflow: "visible" }}
    >
      {g.defs}
      <rect
        x="0"
        y="0"
        width={W}
        height={H}
        rx="5"
        transform="translate(2 5)"
        style={{ fill: "#000", opacity: 0.25 }}
      />
      <rect x="0" y="0" width={W} height={H} rx="5" style={{ fill: g.paper }} />
      <path
        d="M0 200 L138 108 M300 200 L162 108"
        fill="none"
        style={{ stroke: T.paperDark, strokeWidth: 1, opacity: 0.5 }}
      />
    </svg>
  );
}

/* -----------------------------------------------------------------------------
 * Versi yang bisa ditukar dengan file asli.
 *
 * File asli referensi punya geometri sendiri: tiap file diposisikan & dipotong
 * pada kanvas 440 px (koordinat dari desain pemilik, src/components/
 * introEnvelope.tsx di referensi Jorgi). Semua koordinat di bawah dihitung
 * relatif ke BADAN amplop, sehingga mengikuti ukuran komponen apa pun.
 *   back     – amplop belakang termasuk tutup yang berdiri (di atas engsel)
 *   lining   – beludru dalam, dipotong poligon LINING_POLY
 *   front    – kantong depan (file lebih besar dari area yang tampak)
 *   closed   – amplop tertutup utuh; tutup = poligon CLOSED_FLAP_POLY
 * -------------------------------------------------------------------------- */
type Box = readonly [x: number, y: number, w: number, h: number];
const BODY: Box = [68.3, 531, 301.3, 191];
const GEO = {
  back: { img: [68.3, 402.3, 301.3, 320.6] as Box },
  lining: { img: [72.2, 281.7, 293.6, 522.5] as Box, clip: [72.2, 421.7, 293.5, 242.5] as Box },
  front: { img: [32.6, 366.8, 375.5, 469.4] as Box, clip: [67.7, 532.2, 308.6, 190.7] as Box },
};
const LINING_POLY =
  "polygon(49.68% 0%, 51.01% 0.11%, 52.25% 0.84%, 73% 19.99%, 88.5% 35.08%, 100% 47.16%, 99.91% 47.27%, 99.95% 99.72%, 99.77% 100%, 0.23% 100%, 0.09% 99.89%, 0% 99.67%, 0.05% 47.22%, 6.21% 41.04%, 20.01% 27.84%, 31.74% 16.37%, 46.23% 2.78%, 47.88% 1%, 48.99% 0.22%)";
const CLOSED_FLAP_POLY = "polygon(0% 0%, 100% 0%, 100% 1.9%, 50% 68%, 0% 1.9%)";
const CLOSED_REST_POLY = "polygon(0% 1.9%, 50% 68%, 100% 1.9%, 100% 100%, 0% 100%)";
/** File amplop tertutup punya margin transparan 2% / 1.9% di sekeliling kertas. */
const CLOSED_IMG: Box = [-0.02 / 0.96, -0.019 / 0.962, 1 / 0.96, 1 / 0.962];

const pct = (n: number) => `${(n * 100).toFixed(3)}%`;
/** Kotak `b` sebagai posisi % di dalam kotak `ref` (koordinat kanvas). */
function boxIn(b: Box, ref: Box): React.CSSProperties {
  return {
    position: "absolute",
    left: pct((b[0] - ref[0]) / ref[2]),
    top: pct((b[1] - ref[1]) / ref[3]),
    width: pct(b[2] / ref[2]),
    height: pct(b[3] / ref[3]),
  };
}

type Img = NonNullable<ReturnType<typeof useSlotAsset>>;

/** Satu potongan file: kotak potong (clip) berisi gambar pada kotak img-nya. */
function Piece({
  image,
  img,
  clip = img,
  poly,
  fit = "fill",
}: {
  image: Img;
  img: Box;
  clip?: Box;
  poly?: string;
  fit?: "fill" | "cover";
}) {
  return (
    <span style={{ ...boxIn(clip, BODY), overflow: "hidden", clipPath: poly }}>
      <span style={boxIn(img, clip)}>
        <AssetImg image={image} mode="fill" fit={fit} />
      </span>
    </span>
  );
}

/** Wadah setinggi badan amplop di dalam kotak tutup (tingginya FLAP_TIP+14 dari H). */
const BODY_IN_FLAP: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: "100%",
  height: `${(H / (FLAP_TIP + 14)) * 100}%`,
};

export function EnvelopeInside({ className, slot }: { className?: string } & SlotProp) {
  const back = useSlotAsset(undefined, "envelope-back");
  const lining = useSlotAsset(slot, "envelope-lining");
  if (!back && !lining) return <EnvelopeInsideSvg className={className} />;
  return (
    <span className={className} style={{ display: "block", overflow: "hidden" }} aria-hidden>
      <span style={{ position: "absolute", inset: 0 }}>
        {back && <Piece image={back} img={GEO.back.img} clip={BODY} />}
        {lining && (
          <Piece image={lining} img={GEO.lining.img} clip={GEO.lining.clip} poly={LINING_POLY} />
        )}
      </span>
    </span>
  );
}

export function EnvelopePocket({ className, slot }: { className?: string } & SlotProp) {
  const img = useSlotAsset(slot, "envelope-pocket");
  if (!img) return <EnvelopePocketSvg className={className} />;
  return (
    <span className={className} style={{ display: "block" }} aria-hidden>
      <span style={{ position: "absolute", inset: 0 }}>
        <Piece image={img} img={GEO.front.img} clip={GEO.front.clip} />
      </span>
    </span>
  );
}

/** Amplop tertutup (file asli) dipotong poligon: tutup atau sisanya. */
function ClosedPart({ image, part }: { image: Img; part: "flap" | "rest" }) {
  return (
    <span
      style={{
        position: "absolute",
        left: pct(CLOSED_IMG[0]),
        top: pct(CLOSED_IMG[1]),
        width: pct(CLOSED_IMG[2]),
        height: pct(CLOSED_IMG[3]),
        clipPath: part === "flap" ? CLOSED_FLAP_POLY : CLOSED_REST_POLY,
      }}
    >
      <AssetImg image={image} mode="fill" fit="fill" />
    </span>
  );
}

export function EnvelopeBody({ className, slot }: { className?: string } & SlotProp) {
  const img = useSlotAsset(slot, "envelope-closed");
  if (!img) return <EnvelopeBodySvg className={className} />;
  return (
    <span className={className} style={{ display: "block" }} aria-hidden>
      <ClosedPart image={img} part="rest" />
    </span>
  );
}

/** Lapisan "sisa amplop tertutup" (file asli) — dipakai AnimatedEnvelope selama tertutup. */
export function EnvelopeClosedRest({ className }: { className?: string }) {
  const img = useSlotAsset(undefined, "envelope-closed");
  if (!img) return null;
  return (
    <span className={className} style={{ display: "block" }} aria-hidden>
      <ClosedPart image={img} part="rest" />
    </span>
  );
}

export function EnvelopeFlap({
  face = "outside",
  className,
  slot,
}: { face?: "outside" | "inside"; className?: string } & SlotProp) {
  const closed = useSlotAsset(face === "outside" ? slot : undefined, "envelope-closed");
  const back = useSlotAsset(undefined, "envelope-back");
  const lining = useSlotAsset(face === "inside" ? slot : undefined, "envelope-lining");

  if (face === "outside") {
    if (!closed) return <EnvelopeFlapSvg face="outside" className={className} />;
    return (
      <span className={className} style={{ display: "block", position: "relative" }} aria-hidden>
        <span style={BODY_IN_FLAP}>
          <ClosedPart image={closed} part="flap" />
        </span>
      </span>
    );
  }

  if (!back && !lining) return <EnvelopeFlapSvg face="inside" className={className} />;
  // Sisi dalam = bagian file DI ATAS engsel (tutup yang berdiri), dicerminkan
  // vertikal; rotasi 180° tutup membuatnya tegak kembali.
  return (
    <span
      className={className}
      style={{ display: "block", position: "relative", overflow: "hidden" }}
      aria-hidden
    >
      <span style={{ ...BODY_IN_FLAP, transform: "scaleY(-1)", transformOrigin: "50% 0%" }}>
        {back && <Piece image={back} img={GEO.back.img} />}
        {lining && (
          <Piece image={lining} img={GEO.lining.img} clip={GEO.lining.clip} poly={LINING_POLY} />
        )}
      </span>
    </span>
  );
}

/** Amplop tertutup statis (badan + tutup luar). Segel ditambahkan pemakai. */
export function EnvelopeClosed({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={className} style={{ position: "relative", aspectRatio: "3 / 2", ...style }}>
      <EnvelopeBody className="absolute inset-0 h-full w-full" />
      <div
        className="absolute inset-x-0 top-0"
        style={{ height: `${((FLAP_TIP + 14) / H) * 100}%` }}
      >
        <EnvelopeFlap className="h-full w-full" />
      </div>
    </div>
  );
}

export type EnvelopeStage = "closed" | "opening" | "open";

/**
 * Amplop beranimasi: segel retak → tutup terbuka (3D) → kartu naik.
 *
 *  stage "closed"  : tertutup, segel utuh (berputar pelan)
 *  stage "opening" : jalankan urutan animasi; onPetals dipanggil saat kartu
 *                    mulai naik (titik mulut amplop, koordinat viewport),
 *                    onOpened saat selesai.
 *  stage "open"    : langsung keadaan akhir (mis. setelah dilewati).
 *
 * lite: tanpa perspektif 3D (tutup dibalik 2D), tanpa retakan, lebih singkat.
 */
export function AnimatedEnvelope({
  stage,
  card,
  cardRise = 0.72,
  lite = false,
  sealTone = "red",
  sealEmblem = "floral",
  onPetals,
  onOpened,
  className,
  style,
}: {
  stage: EnvelopeStage;
  /** Isi kartu (mis. LaceDoily + teks ayat). Lebar kartu = 88% amplop. */
  card?: React.ReactNode;
  /** Seberapa jauh kartu naik (× tinggi kartu itu sendiri). */
  cardRise?: number;
  lite?: boolean;
  sealTone?: SealTone;
  sealEmblem?: SealEmblem;
  onPetals?: (x: number, y: number) => void;
  onOpened?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const mouthRef = useRef<HTMLDivElement | null>(null);
  // Mode file asli: proporsi badan amplop mengikuti referensi (301,3 × 191).
  const closedImg = useSlotAsset(undefined, "envelope-closed");
  const pocketImg = useSlotAsset(undefined, "envelope-pocket");
  const imageMode = Boolean(closedImg || pocketImg);
  // Fase internal: seal → flap → card → done
  const [phase, setPhase] = useState<"idle" | "seal" | "flap" | "card" | "done">(
    stage === "open" ? "done" : "idle",
  );

  useEffect(() => {
    if (stage === "open") setPhase("done");
    else if (stage === "opening") setPhase((p) => (p === "idle" ? "seal" : p));
    else setPhase("idle");
  }, [stage]);

  const flapOpen = phase === "flap" || phase === "card" || phase === "done";
  const cardUp = phase === "card" || phase === "done";
  const instant = stage === "open";

  useEffect(() => {
    if (phase === "card" && !instant) {
      const r = mouthRef.current?.getBoundingClientRect();
      if (r) onPetals?.(r.left + r.width / 2, r.top);
    }
  }, [phase, instant, onPetals]);

  const flapH = `${((FLAP_TIP + 14) / H) * 100}%`;
  const dur = lite ? 0.45 : 0.75;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        aspectRatio: imageMode ? "301.3 / 191" : "3 / 2",
        perspective: lite ? undefined : 900,
        ...style,
      }}
    >
      {/* 1. bagian dalam (beludru) */}
      <EnvelopeInside className="absolute inset-0 h-full w-full" />

      {/* 2. kartu: awalnya terselip (atas kartu = mulut amplop), lalu naik.
             Pembungkus 5× tinggi amplop, rata bawah amplop, overflow hidden →
             kartu terpotong tepi bawah amplop, bebas keluar ke atas. */}
      {card && (
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ height: "500%", overflow: "hidden", pointerEvents: "none" }}
        >
          <motion.div
            className="absolute left-[6%] w-[88%]"
            style={{ top: "81%", zIndex: 2 }}
            initial={false}
            animate={{ y: cardUp ? `-${cardRise * 100}%` : "0%" }}
            transition={
              instant ? { duration: 0 } : { duration: lite ? 0.6 : 1.1, ease: [0.22, 0.7, 0.2, 1] }
            }
            onAnimationComplete={() => {
              if (phase === "card") {
                setPhase("done");
                onOpened?.();
              }
            }}
          >
            {card}
          </motion.div>
        </div>
      )}

      {/* 3. tutup amplop: 3D rotateX (luar = kertas, dalam = beludru) */}
      <motion.div
        className="absolute inset-x-0 top-0"
        style={{
          height: flapH,
          transformOrigin: "50% 0%",
          transformStyle: lite ? undefined : "preserve-3d",
          zIndex: cardUp ? 1 : 4,
        }}
        initial={false}
        animate={lite ? { scaleY: flapOpen ? -1 : 1 } : { rotateX: flapOpen ? 180 : 0 }}
        transition={instant ? { duration: 0 } : { duration: dur, ease: [0.45, 0, 0.25, 1] }}
        onAnimationComplete={() => {
          if (phase === "flap") setPhase("card");
        }}
      >
        {lite ? (
          // 2D: tampilkan sisi luar saat tertutup, sisi dalam saat terbuka.
          <EnvelopeFlap face={flapOpen ? "inside" : "outside"} className="h-full w-full" />
        ) : (
          <>
            <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
              <EnvelopeFlap face="outside" className="h-full w-full" />
            </div>
            <div
              className="absolute inset-0"
              style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg) scaleY(-1)" }}
            >
              <EnvelopeFlap face="inside" className="h-full w-full" />
            </div>
          </>
        )}
      </motion.div>

      {/* 3b. mode file asli: "sisa amplop tertutup" menutupi badan selama tertutup,
             memudar saat tutup mulai terbuka (serah-terima seperti referensi) */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-[4]"
        initial={false}
        animate={{ opacity: flapOpen ? 0 : 1 }}
        transition={instant ? { duration: 0 } : { duration: 0.35, delay: 0.15 }}
      >
        <EnvelopeClosedRest className="absolute inset-0 h-full w-full" />
      </motion.div>

      {/* 4. kantong depan (di atas kartu) */}
      <EnvelopePocket className="pointer-events-none absolute inset-0 z-[3] h-full w-full" />

      {/* 5. segel di ujung tutup */}
      {/* tetap terpasang selama fase "flap" agar keping selesai berjatuhan */}
      {(phase === "idle" || phase === "seal" || phase === "flap") && (
        <WaxSealBreak
          state={phase === "idle" ? "whole" : "broken"}
          tone={sealTone}
          emblem={sealEmblem}
          spin={phase === "idle"}
          lite={lite}
          onBroken={() => setPhase((p) => (p === "seal" ? "flap" : p))}
          className="absolute z-[5]"
          style={{
            left: "42%",
            width: "16%",
            aspectRatio: "1",
            top: `${(FLAP_TIP / H) * 100 - 12}%`,
          }}
        />
      )}

      {/* titik mulut amplop (asal semburan kelopak) */}
      <div ref={mouthRef} className="absolute top-0 left-1/2 h-px w-px" />
    </div>
  );
}
