"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";

import { useInvitation } from "../../_shared/runtime/context";
import type { CoverProps } from "../../types";
import { ordinal, Orn, Typewriter, useDecor, useNick } from "../canvas";
import { Cake, Ribbon, ScallopFrame, Sparkle } from "../ornaments";
import { CoverPhoto } from "../PhotoDecor";

/**
 * Cover (halaman 1 desain): "{NAMA} IS TURNING 19TH" + foto masa kecil dalam
 * bingkai scallop bertopi pesta, pita & kilau, tombol "Buka Undangan".
 *
 * Kanvas 430×932 diskalakan agar muat satu layar (--cu). Nama & nama tamu
 * terlihat sejak HTML pertama (LCP); hanya kata hiasan yang diketik.
 * Buka: cover terangkat ke atas (transform), isi sudah disiapkan di baliknya.
 * Ketuk lagi (> ±400 ms) → langsung terbuka; reduced motion → tanpa animasi.
 */
const STAGE_H = 932;
const SKIP_AFTER = 400;
const c = (px: number) => `calc(var(--cu) * ${px})`;

function Title() {
  const { inv } = useInvitation();
  const nick = useNick();
  const { lang } = useDecor();
  const age = inv.eventType === "BIRTHDAY" ? inv.data.celebrant.age : undefined;
  const lines =
    age !== undefined
      ? lang === "id"
        ? [nick, "GENAP", `${age} TAHUN`]
        : [nick, "IS TURNING", `${age}${ordinal(age)}`]
      : lang === "id"
        ? [nick, "ULANG", "TAHUN!"]
        : [`${nick}'S`, "BIRTHDAY", "PARTY!"];
  const size = (s: string) => (s.length > 9 ? Math.max(36, 66 * (9 / s.length)) : 66);
  return (
    <h1
      style={{
        position: "absolute",
        left: c(20),
        top: c(118),
        width: c(390),
        margin: 0,
        textAlign: "center",
        fontFamily: "var(--pk-hand), cursive",
        fontWeight: 700,
        color: "var(--inv-red)",
        lineHeight: 0.98,
        letterSpacing: c(5),
        textTransform: "uppercase",
      }}
    >
      {lines.map((l, i) => (
        <span key={i} style={{ display: "block", fontSize: c(size(l)), whiteSpace: "nowrap" }}>
          {/* nama (baris 1) langsung terlihat; kata hiasan diketik huruf per huruf */}
          <Typewriter text={l} instant={i === 0} delay={0.35 + i * 0.5} />
        </span>
      ))}
    </h1>
  );
}

function Face() {
  const { inv, guestName } = useInvitation();
  const photo = inv.eventType === "BIRTHDAY" ? inv.data.celebrant.childPhoto : undefined;
  const btnTop = guestName ? 790 : 714;
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: "50%",
        width: c(430),
        transform: "translateX(-50%)",
        containerType: "inline-size",
      }}
    >
      <Title />

      {/* bingkai scallop + foto masa kecil */}
      <div
        data-ca
        style={{
          position: "absolute",
          left: c(113),
          top: c(386),
          width: c(209),
          height: c(270),
          ["--d" as string]: "0.1s",
        }}
      >
        {photo ? (
          // isi bingkai: koordinat relatif pembungkus (u() = satuan kanvas cover)
          <CoverPhoto
            photo={photo}
            box={{ l: 15, t: 15, w: 179, h: 239 }}
            origin={{ l: 128, t: 401 }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: `${c(15)} ${c(15)} ${c(16)}`,
              background: "#e6e1dc",
            }}
          >
            <div style={{ position: "absolute", inset: "8%" }}>
              <Cake />
            </div>
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, filter: "var(--inv-filter-tint)" }}>
          <OrnFill slot="scallop-frame" fallback={<ScallopFrame />} />
        </div>
      </div>

      <CoverOrn
        slot="ribbon-c"
        l={60}
        t={354}
        w={52}
        ratio={1.3}
        rotate={-8}
        d={0.45}
        fallback={<Ribbon />}
      />
      <CoverOrn
        slot="ribbon-b"
        l={320}
        t={460}
        w={50}
        ratio={1.36}
        rotate={6}
        d={0.55}
        fallback={<Ribbon />}
      />
      <CoverOrn
        slot="ribbon-a"
        l={53}
        t={562}
        w={44}
        ratio={1.02}
        rotate={-4}
        d={0.65}
        fallback={<Ribbon />}
      />
      <CoverOrn
        slot="sparkle-b"
        l={350}
        t={294}
        w={14}
        ratio={1.03}
        tint={false}
        d={0.5}
        fallback={<Sparkle />}
      />
      <CoverOrn
        slot="sparkle-pair"
        l={66}
        t={478}
        w={26}
        ratio={1.22}
        tint={false}
        d={0.6}
        fallback={<Sparkle />}
      />
      <CoverOrn
        slot="sparkle-a"
        l={337}
        t={582}
        w={18}
        ratio={1.37}
        tint={false}
        d={0.7}
        fallback={<Sparkle />}
      />

      {guestName && (
        <div
          data-ca="fade"
          style={{
            position: "absolute",
            left: c(40),
            top: c(684),
            width: c(350),
            textAlign: "center",
            fontFamily: "var(--pk-hand), cursive",
            color: "var(--inv-ink)",
            ["--d" as string]: "0.2s",
          }}
        >
          <p style={{ fontSize: c(15), letterSpacing: c(1), opacity: 0.75, margin: 0 }}>
            Kepada Yth. Bapak/Ibu/Saudara/i
          </p>
          <p
            style={{
              fontSize: c(26),
              fontWeight: 700,
              color: "var(--inv-deep)",
              margin: `${c(2)} 0 0`,
              lineHeight: 1.1,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              overflowWrap: "anywhere",
            }}
          >
            {guestName}
          </p>
        </div>
      )}

      <span
        className="pk-btn pk-open-btn"
        style={{
          position: "absolute",
          left: c(108),
          top: c(btnTop),
          width: c(214),
          height: c(42),
          fontSize: c(19),
          letterSpacing: c(2),
        }}
      >
        Buka Undangan
      </span>
    </div>
  );
}

/** Slot aset sebagai isi penuh pembungkusnya (bingkai). */
function OrnFill({ slot, fallback }: { slot: string; fallback: React.ReactNode }) {
  return <Orn slot={slot} l={0} t={0} w={209} ratio={1.29} tint={false} fallback={fallback} />;
}

/** Ornamen cover: koordinat kanvas cover (satuan --cu), muncul saat halaman dimuat. */
function CoverOrn({ l, t, w, d, ...rest }: React.ComponentProps<typeof Orn> & { d: number }) {
  return (
    <div
      data-ca
      style={{
        position: "absolute",
        left: c(l),
        top: c(t),
        width: c(w),
        height: c(w * rest.ratio),
        ["--d" as string]: `${d}s`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, containerType: "inline-size" }}>
        <Orn {...rest} l={0} t={0} w={430} />
      </div>
    </div>
  );
}

export function PitaKrayonCover({ onOpen, startMusic }: CoverProps) {
  const [stage, setStage] = useState<"closed" | "opening" | "skipped">("closed");
  const openedAt = useRef(0);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onOpen();
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
    // Cover mulai terangkat dulu (compositor), baru isi undangan ditampilkan.
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
      className={`pk-cover pk-focus ${stage === "opening" ? "pk-opening" : ""} ${stage === "skipped" ? "pk-skipped" : ""}`}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "var(--inv-bg)",
        containerType: "size",
        ["--cu" as string]: `min(calc(100cqw / 430), calc(100cqh / ${STAGE_H}))`,
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      // tetap terpasang selama terangkat (0,75 s), lalu dilepas
      exit={{ opacity: 0, transition: { duration: 0.01, delay: stage === "skipped" ? 0 : 0.75 } }}
    >
      <Face />
    </motion.div>
  );
}
