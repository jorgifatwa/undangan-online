"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useLayoutEffect, useRef } from "react";

import { firstEvent } from "@/lib/datetime";

import { couple, shortName } from "../../_shared/format";
import { useInvitation } from "../../_shared/runtime/context";
import type { CoverProps } from "../../types";
import { EmbossOval, OVAL } from "../art/EmbossOval";
import { linenBg } from "../art/textures";
import { F } from "../canvas";

/**
 * Cover Surat Marun: latar marun berbingkai garis tipis membulat, kartu
 * linen krem (nama serif hijau "NAMA / Nama &", "THE WEDDING OF", bingkai
 * oval timbul berisi foto sampul, baris "SAVE THE DATE · hari · tanggal"),
 * lalu "Dear" + nama tamu + tombol "Open Invitation".
 * Kanvas 430 × STAGE_H diskalakan agar muat layar (--cu).
 */
const STAGE_H = 932;
const c = (px: number) => `calc(var(--cu) * ${px})`;
const MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];
const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const ord = (d: number) =>
  d % 10 === 1 && d !== 11
    ? "ST"
    : d % 10 === 2 && d !== 12
      ? "ND"
      : d % 10 === 3 && d !== 13
        ? "RD"
        : "TH";

/** Kecilkan teks satu baris bila melebihi kotaknya (setelah font dimuat). */
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

export function SuratMarunCover({ onOpen, startMusic }: CoverProps) {
  const { inv, guestName } = useInvitation();
  const done = useRef(false);
  const d = inv.eventType === "WEDDING" ? inv.data : null;
  const [a, b] = d ? couple(d) : [null, null];
  const nameA = a ? shortName(a).toUpperCase() : "";
  const nameB = b ? shortName(b) : "";
  const refA = useFitLine(nameA);
  const refB = useFitLine(nameB);
  const ev = firstEvent(inv.data.events);
  const [y, m, day] = ev.date.split("-").map(Number);
  const weekday = DAYS[new Date(Date.UTC(y, m - 1, day)).getUTCDay()];
  const photo = d?.photos.cover;

  const open = () => {
    if (done.current) return;
    done.current = true;
    startMusic();
    onOpen();
  };

  const card = { l: 17, t: 123, w: 396, h: 528 };
  const ov = { l: card.l + (card.w - OVAL.w) / 2, t: 240 };
  const sans = (size: number, weight = 700): React.CSSProperties => ({
    fontFamily: F.sans,
    fontSize: c(size),
    fontWeight: weight,
    lineHeight: 1.2,
    color: "var(--inv-ink)",
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
      className="sm-cover pointer-events-auto"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        containerType: "size",
        ["--cu" as string]: `min(calc(100cqw / 430), calc(100cqh / ${STAGE_H}))`,
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
        background: "var(--inv-maroon)",
      }}
      exit={{ opacity: 0, y: "-4%", transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }}
    >
      {/* garis bingkai tipis membulat di tepi layar */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 13,
          border: "1.5px solid rgb(234 231 226 / 0.45)",
          borderRadius: 12,
          pointerEvents: "none",
        }}
      />
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
        {/* kartu linen */}
        <div
          className="sm-c-card"
          style={{
            position: "absolute",
            left: c(card.l),
            top: c(card.t),
            width: c(card.w),
            height: c(card.h),
            ...linenBg(),
            boxShadow: `0 ${c(6)} ${c(18)} rgb(0 0 0 / 0.35)`,
          }}
        >
          <h1 style={{ margin: 0 }}>
            <span style={{ position: "absolute", left: c(48), top: c(36), width: c(230) }}>
              <span
                ref={refA}
                style={{
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  fontFamily: F.serif,
                  fontWeight: 400,
                  fontSize: `calc(var(--cu) * 39 * var(--fit, 1))`,
                  lineHeight: 1,
                  color: "var(--inv-ink)",
                }}
              >
                {nameA}
              </span>
            </span>
            <span style={{ position: "absolute", left: c(44), top: c(73), width: c(240) }}>
              <span
                ref={refB}
                style={{
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  fontFamily: F.serif,
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: `calc(var(--cu) * 41 * var(--fit, 1))`,
                  lineHeight: 1,
                  color: "var(--inv-ink)",
                }}
              >
                {nameB} <span style={{ fontSize: "0.72em" }}>&amp;</span>
              </span>
            </span>
          </h1>
          <p style={{ position: "absolute", right: c(42), top: c(44), textAlign: "right" }}>
            <span style={{ display: "block", ...sans(17.5) }}>THE</span>
            <span style={{ display: "block", ...sans(9, 400), marginTop: c(1) }}>WEDDING OF</span>
          </p>

          {/* foto oval + bingkai timbul */}
          <div
            style={{
              position: "absolute",
              left: c(ov.l - card.l),
              top: c(ov.t - card.t),
              width: c(OVAL.w),
              height: c(OVAL.h),
            }}
          >
            <div
              style={{
                position: "absolute",
                left: c(OVAL.cx - OVAL.rx),
                top: c(OVAL.cy - OVAL.ry),
                width: c(OVAL.rx * 2),
                height: c(OVAL.ry * 2),
                borderRadius: "50%",
                overflow: "hidden",
                background: "var(--inv-paper-dark)",
                boxShadow: "inset 0 2px 6px rgb(0 0 0 / 0.25)",
              }}
            >
              {photo && (
                <Image
                  src={photo.url}
                  alt={photo.alt ?? "Foto pasangan"}
                  fill
                  priority
                  sizes="(max-width: 440px) 50vw, 220px"
                  style={{
                    objectFit: "cover",
                    objectPosition: `${photo.focusX ?? 50}% ${photo.focusY ?? 40}%`,
                  }}
                />
              )}
            </div>
            <EmbossOval style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          </div>

          {/* baris bawah */}
          <div
            style={{
              position: "absolute",
              left: c(48),
              right: c(42),
              top: c(484),
              display: "flex",
              justifyContent: "space-between",
              ...sans(8.6),
              letterSpacing: c(0.2),
            }}
          >
            <span>SAVE THE DATE</span>
            <span>{weekday}</span>
            <span>
              {MONTHS[m - 1]} {day}
              <sup style={{ fontSize: "0.6em" }}>{ord(day)}</sup>, {y}
            </span>
          </div>
        </div>

        {/* tamu & tombol */}
        <div
          className="sm-c-rise"
          style={{
            position: "absolute",
            left: c(20),
            width: c(390),
            top: c(700),
            textAlign: "center",
            color: "#fff",
          }}
        >
          {guestName && (
            <>
              <p style={{ fontFamily: F.sans, fontWeight: 700, fontSize: c(13) }}>Dear</p>
              <p
                style={{
                  marginTop: c(4),
                  fontFamily: F.sans,
                  fontSize: c(17),
                  lineHeight: 1.3,
                  overflowWrap: "anywhere",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {guestName}
              </p>
            </>
          )}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: c(6),
              marginTop: c(guestName ? 16 : 40),
              padding: `${c(5)} ${c(14)}`,
              borderRadius: 999,
              border: `${c(2)} solid #fff`,
              fontFamily: F.sans,
              fontWeight: 700,
              fontSize: c(13),
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: c(14), height: c(14) }} aria-hidden>
              <path
                fill="currentColor"
                d="M12 6.2C10.2 4.9 7.7 4.3 4.6 4.3c-.9 0-1.8.1-2.6.2v14.3c.8-.1 1.7-.2 2.6-.2 3.1 0 5.6.6 7.4 1.9 1.8-1.3 4.3-1.9 7.4-1.9.9 0 1.8.1 2.6.2V4.5c-.8-.1-1.7-.2-2.6-.2-3.1 0-5.6.6-7.4 1.9Z"
              />
            </svg>
            Open Invitation
          </span>
        </div>
      </div>
    </motion.div>
  );
}
