"use client";

import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";

import { couple, shortName } from "../../_shared/format";
import { useInvitation } from "../../_shared/runtime/context";
import { Lightbox } from "../../_shared/sections";
import { safeHref } from "@/lib/links";
import { BevelFrame, paperCard } from "../art/Ornaments";
import { F, Section, txt, u } from "../canvas";

/**
 * Dress code, galeri (polaroid dalam amplop + slider berbingkai pigura),
 * love story & live streaming — latar hijau botol seperti desain.
 */
const GREEN = "var(--inv-bottle)";

export function SuratMarunDressCode() {
  const { inv } = useInvitation();
  const dc = inv.data.dressCode;
  if (!dc || (!dc.text && dc.colors.length === 0)) return null;
  return (
    <Section
      id="dressCode"
      bg={GREEN}
      style={{ padding: `${u(30)} ${u(34)} ${u(56)}`, textAlign: "center" }}
    >
      <h2 data-a style={txt(F.serif, 20, 1.2, { italic: true, color: "#ece6d6" })}>
        Dress Code
      </h2>
      {dc.text && (
        <p
          data-a
          style={{
            ...txt(F.sans, 10, 1.65, { color: "#ece6d6" }),
            marginTop: u(14),
            whiteSpace: "pre-line",
            ["--d" as string]: "0.1s",
          }}
        >
          {dc.text}
        </p>
      )}
      {dc.colors.length > 0 && (
        <div
          data-a
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: u(10),
            margin: `${u(26)} auto 0`,
            maxWidth: u(240),
            ["--d" as string]: "0.2s",
          }}
        >
          {dc.colors.map((c) => (
            <span
              key={c}
              title={c}
              style={{
                width: u(38),
                height: u(38),
                borderRadius: "50%",
                background: c,
                boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.15)",
              }}
            />
          ))}
        </div>
      )}
    </Section>
  );
}

export function SuratMarunGallery() {
  const { inv } = useInvitation();
  const [active, setActive] = useState<number | null>(null);
  const [i, setI] = useState(0);
  if (inv.eventType !== "WEDDING") return null;
  const d = inv.data;
  const photos = d.gallery;
  const [a, b] = couple(d);
  const polaroid = d.photos.strip[2] ?? d.photos.cover;
  if (photos.length === 0 && !polaroid) return null;
  const n = photos.length;
  const go = (k: number) => setI((v) => (v + k + n) % n);

  return (
    <Section id="galeri" bg={GREEN} style={{ paddingBottom: u(60) }}>
      {/* polaroid dalam amplop putih */}
      {polaroid && (
        <div
          data-a
          style={{ position: "relative", width: u(240), height: u(300), margin: `${u(40)} auto 0` }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: u(190),
              background: "#e9e7e2",
              boxShadow: "0 8px 20px rgb(0 0 0 / 0.35)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: u(32),
              top: 0,
              width: u(176),
              height: u(214),
              background: "#f4f3ef",
              padding: `${u(8)} ${u(8)} ${u(40)}`,
              boxShadow: "0 4px 10px rgb(0 0 0 / 0.25)",
              transform: "rotate(-3deg)",
            }}
          >
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              <Image
                src={polaroid.url}
                alt={polaroid.alt ?? ""}
                fill
                sizes="200px"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
          {/* kantong amplop (V) di depan polaroid */}
          <svg
            viewBox="0 0 240 190"
            style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: u(190) }}
            aria-hidden
          >
            <path d="M0 40 L120 110 L240 40 V190 H0Z" fill="#efeeea" />
            <path
              d="M0 40 L120 110 L240 40"
              fill="none"
              stroke="rgb(0 0 0 / 0.08)"
              strokeWidth={1.5}
            />
          </svg>
          <p
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: u(40),
              ...txt(F.script, 22, 1, { color: "#6a2a30" }),
            }}
          >
            {shortName(a)} &amp; {shortName(b)}
          </p>
          <p
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: u(20),
              ...txt(F.sans, 7.5, 1, { color: "#6a2a30", weight: 700 }),
            }}
          >
            #{shortName(a)}And{shortName(b)}
          </p>
        </div>
      )}

      {n > 0 && (
        <div
          data-a
          style={{ width: u(300), margin: `${u(60)} auto 0`, ["--d" as string]: "0.15s" }}
        >
          <BevelFrame>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-label="Perbesar foto"
              style={{
                position: "relative",
                display: "block",
                width: "100%",
                aspectRatio: "4 / 3",
                background: "#1d2a1f",
                cursor: "zoom-in",
                pointerEvents: "auto",
              }}
            >
              <Image
                key={photos[i].url}
                src={photos[i].url}
                alt={photos[i].alt ?? ""}
                fill
                sizes="(max-width: 440px) 64vw, 280px"
                style={{ objectFit: "cover" }}
              />
            </button>
            {n > 1 &&
              ([-1, 1] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => go(k)}
                  aria-label={k < 0 ? "Foto sebelumnya" : "Foto berikutnya"}
                  style={{
                    position: "absolute",
                    top: "50%",
                    [k < 0 ? "left" : "right"]: u(4),
                    transform: "translateY(-50%)",
                    width: u(26),
                    height: u(26),
                    color: "#fff",
                    fontSize: u(18),
                    textShadow: "0 1px 3px rgb(0 0 0 / 0.6)",
                    pointerEvents: "auto",
                    cursor: "pointer",
                  }}
                >
                  {k < 0 ? "❮" : "❯"}
                </button>
              ))}
          </BevelFrame>
          <p
            style={{ ...txt(F.sans, 9, 1, { color: "rgb(236 230 214 / 0.7)" }), marginTop: u(12) }}
          >
            {i + 1} / {n}
          </p>
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

export function SuratMarunLoveStory() {
  const { inv } = useInvitation();
  if (inv.eventType !== "WEDDING") return null;
  const items = inv.data.loveStory;
  if (items.length === 0) return null;
  return (
    <Section id="loveStory" bg={GREEN} style={{ padding: `${u(20)} ${u(36)} ${u(56)}` }}>
      <h2 data-a style={txt(F.serif, 30, 1.2, { color: "#ece6d6" })}>
        Our Story
      </h2>
      {items.map((it, k) => (
        <div
          key={`${it.title}-${k}`}
          data-a
          style={{
            ...paperCard(),
            marginTop: u(k ? 16 : 22),
            padding: `${u(18)} ${u(20)}`,
            ["--d" as string]: `${0.1 + k * 0.1}s`,
          }}
        >
          {it.date && (
            <p style={txt(F.sans, 8.5, 1.3, { color: "#7a5a50", ls: 1.6 })}>
              {it.date.toUpperCase()}
            </p>
          )}
          <h3
            style={{
              ...txt(F.serif, 20, 1.2, { italic: true, color: "var(--inv-ink)" }),
              marginTop: u(4),
            }}
          >
            {it.title}
          </h3>
          {it.text && (
            <p style={{ ...txt(F.sans, 10.5, 1.6, { color: "#4a4a44" }), marginTop: u(8) }}>
              {it.text}
            </p>
          )}
        </div>
      ))}
    </Section>
  );
}

export function SuratMarunLiveStream() {
  const { inv } = useInvitation();
  const ls = inv.data.liveStream;
  const href = safeHref(ls?.url, "liveStream");
  if (!ls || !href) return null;
  return (
    <Section
      id="liveStream"
      bg={GREEN}
      style={{ padding: `${u(10)} ${u(46)} ${u(56)}`, textAlign: "center" }}
    >
      <h2 data-a style={txt(F.serif, 20, 1.2, { italic: true, color: "#ece6d6" })}>
        Live Streaming
      </h2>
      <p
        data-a
        style={{
          ...txt(F.sans, 10, 1.65, { color: "#ece6d6" }),
          marginTop: u(12),
          ["--d" as string]: "0.1s",
        }}
      >
        {ls.note ?? "Bagi yang berhalangan hadir, saksikan momen bahagia kami secara langsung."}
      </p>
      <a
        data-a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          marginTop: u(16),
          padding: `${u(8)} ${u(14)}`,
          background: "#efe9df",
          ...txt(F.sans, 9.5, 1, { color: "#4a2a2a" }),
          textDecoration: "none",
          pointerEvents: "auto",
          ["--d" as string]: "0.2s",
        }}
      >
        Tonton {ls.platform ? `di ${ls.platform}` : "Siaran"}
      </a>
    </Section>
  );
}
