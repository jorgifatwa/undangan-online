"use client";

import { motion } from "framer-motion";

import { eventDateLabel, firstEvent } from "@/lib/datetime";

import { useInvitation } from "../_shared/runtime/context";
import { GuestGreeting } from "../_shared/sections";
import type { CoverProps } from "../types";
import { Balloon, Bunting, Twinkle } from "./ornaments";

const BALLOONS = [
  { left: "-4%", top: "18%", w: 70, color: "var(--inv-primary)", delay: 0, dur: 6 },
  { left: "8%", top: "52%", w: 54, color: "var(--inv-accent-2)", delay: 1.2, dur: 7 },
  { left: "78%", top: "14%", w: 64, color: "var(--inv-accent)", delay: 0.6, dur: 6.5 },
  { left: "84%", top: "48%", w: 58, color: "var(--inv-accent-3)", delay: 1.8, dur: 7.5 },
  { left: "66%", top: "70%", w: 46, color: "var(--inv-primary)", delay: 0.9, dur: 8 },
];

const TWINKLES = [
  { left: "22%", top: "12%", size: 14 },
  { left: "70%", top: "34%", size: 10 },
  { left: "16%", top: "40%", size: 9 },
  { left: "60%", top: "8%", size: 12 },
];

export function ConfettiCover({ onOpen }: CoverProps) {
  const { inv, lite } = useInvitation();
  if (inv.eventType !== "BIRTHDAY") return null;
  const c = inv.data.celebrant;
  const event = firstEvent(inv.data.events);
  const balloons = lite ? BALLOONS.slice(0, 3) : BALLOONS;

  return (
    <motion.div
      className="cp-cover relative flex h-full flex-col items-center justify-center overflow-hidden px-6 text-center text-white"
      style={{ background: "var(--inv-cover-bg)" }}
      exit={{ opacity: 0, scale: 1.12 }}
      transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
    >
      <Bunting
        className="absolute top-0 left-0 h-16 w-full text-white"
        colors={[
          "var(--inv-accent)",
          "#ffffff",
          "var(--inv-accent-2)",
          "var(--inv-primary)",
          "var(--inv-accent-3)",
        ]}
      />

      {balloons.map((b, i) => (
        <Balloon
          key={i}
          color={b.color}
          className="cp-float absolute text-white"
          style={{
            left: b.left,
            top: b.top,
            width: b.w,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
            filter: "drop-shadow(0 6px 10px rgb(0 0 0 / .15))",
          }}
        />
      ))}

      {TWINKLES.map((t, i) => (
        <Twinkle
          key={i}
          className="cp-twinkle absolute text-white"
          style={{ left: t.left, top: t.top, width: t.size, animationDelay: `${i * 0.5}s` }}
        />
      ))}

      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 0.7, 0.2, 1] }}
      >
        <p className="text-sm font-semibold tracking-[0.25em] uppercase opacity-95">
          Kamu diundang ke pesta
        </p>

        {c.age !== undefined && (
          <motion.div
            className="cp-age relative mt-5 grid size-40 place-items-center rounded-full"
            initial={{ scale: 0.3, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 12, delay: 0.2 }}
          >
            <span className="cp-age-number">{c.age}</span>
            <span className="cp-age-label">tahun</span>
          </motion.div>
        )}

        <h1 className="cp-name mt-5">{c.nickname ?? c.name}</h1>
        <p className="mt-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm">
          {eventDateLabel(event)}
        </p>

        <GuestGreeting className="mt-6 rounded-2xl bg-white/15 px-5 py-3" />

        <button type="button" onClick={onOpen} className="cp-open-btn pointer-events-auto mt-8">
          🎉 Buka Undangan
        </button>
      </motion.div>
    </motion.div>
  );
}
