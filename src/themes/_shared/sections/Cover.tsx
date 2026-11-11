"use client";

import { motion } from "framer-motion";

import { firstEvent, eventDateLabel } from "@/lib/datetime";

import { coupleNames } from "../format";
import { useInvitation } from "../runtime/context";
import type { CoverProps } from "../../types";
import { FillPhoto } from "./ui";

/** Judul utama undangan (nama pasangan / yang berulang tahun). */
export function useInvitationTitle(): { kicker: string; title: string } {
  const { inv } = useInvitation();
  if (inv.eventType === "WEDDING")
    return { kicker: "The Wedding of", title: coupleNames(inv.data) };
  const c = inv.data.celebrant;
  return {
    kicker: c.age !== undefined ? `Ulang Tahun ke-${c.age}` : "Undangan Ulang Tahun",
    title: c.nickname ?? c.name,
  };
}

/** Sapaan tamu di cover ("Kepada Yth. Bapak/Ibu/Saudara/i" + nama). */
export function GuestGreeting({ className }: { className?: string }) {
  const { guestName } = useInvitation();
  if (!guestName) return null;
  return (
    <div className={className}>
      <p className="text-[11px] tracking-[0.18em] uppercase opacity-80">
        Kepada Yth. Bapak/Ibu/Saudara/i
      </p>
      <p className="mt-1.5 text-xl font-semibold [overflow-wrap:anywhere]">{guestName}</p>
    </div>
  );
}

/** Cover default: foto latar + nama + tanggal + nama tamu + tombol buka. */
export function DefaultCover({ onOpen }: CoverProps) {
  const { inv } = useInvitation();
  const { kicker, title } = useInvitationTitle();
  const photo = inv.eventType === "WEDDING" ? inv.data.photos.cover : inv.data.celebrant.photo;
  const date = eventDateLabel(firstEvent(inv.data.events));

  return (
    <motion.div
      className="relative flex h-full flex-col items-center justify-end overflow-hidden px-6 pb-16 text-center"
      style={{ background: "var(--inv-bg)", color: "var(--inv-cover-text, var(--inv-text))" }}
      exit={{ opacity: 0, y: "-100%" }}
      transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
    >
      {photo && (
        <div className="absolute inset-0">
          <FillPhoto photo={photo} priority />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/75" />
        </div>
      )}
      <div className="relative" style={{ color: photo ? "#fff" : undefined }}>
        <p className="text-xs tracking-[0.3em] uppercase opacity-90">{kicker}</p>
        <h1
          className="my-3 text-5xl leading-tight"
          style={{ fontFamily: "var(--inv-font-script)" }}
        >
          {title}
        </h1>
        <p className="text-sm opacity-90">{date}</p>
        <GuestGreeting className="mt-8" />
        <button type="button" onClick={onOpen} className="inv-btn pointer-events-auto mt-8">
          Buka Undangan
        </button>
      </div>
    </motion.div>
  );
}
