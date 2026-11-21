"use client";

import Image from "next/image";

import { couple, displayFullName, parentsLines } from "../../_shared/format";
import { useInvitation } from "../../_shared/runtime/context";
import type { Person } from "@/schemas/wedding";
import { instagramUrl } from "@/lib/links";
import { Ampersand } from "../art/Ampersand";
import { FloralColumn } from "../art/FloralColumn";
import { LACE_H, LACE_HOLE, LACE_W, LaceFrame } from "../art/LaceFrame";
import { paperBg, greenBg } from "../art/textures";
import { F, Section, box, txt, u, useFit } from "../canvas";
import { SAGE_BLOCK, SALAM_H } from "./Salam";

/**
 * Mempelai (section `profil`): lanjutan blok sage dari salam — mempelai
 * pertama + "&" besar — lalu mempelai kedua di atas kertas krem dengan kolom
 * bunga kiri. Kertas krem bersambung ke Save The Date (blok krem CREAM_BLOCK,
 * kolom bunga kiri berpola global yang sama). Koordinat = px kanvas 430.
 */
const SAGE_H = SAGE_BLOCK - SALAM_H; // 588
/** Tinggi bagian krem di section mempelai. */
export const PAPER_H = 520;
/** Blok krem: mempelai kedua (PAPER_H) + Save The Date. */
export const CREAM_BLOCK = 810;

type Tone = "sage" | "paper";

interface CardLayout {
  /** Pusat horizontal isi. */
  cx: number;
  /** Tepi atas & lebar bingkai renda. */
  top: number;
  frameW: number;
  /** Tepi atas blok nama, ukuran nama, jarak ke orang tua & Instagram. */
  textTop: number;
  nameSize: number;
  gapParents: number;
  gapIg: number;
  igSize: number;
  /** Lebar blok nama/orang tua (px kanvas). */
  textW: number;
}

/** Mempelai pertama (sage) — gambar 5. */
const FIRST: CardLayout = {
  cx: 178,
  top: 10,
  frameW: LACE_W,
  textTop: 298,
  nameSize: 25,
  gapParents: 10,
  gapIg: 18,
  igSize: 48,
  textW: 300,
};
/** Mempelai kedua (krem) — gambar 6 & 7. */
const SECOND: CardLayout = {
  // tengah area kosong di kanan kolom bunga kiri (±75–430)
  cx: 246,
  top: 29,
  frameW: 220,
  textTop: 339,
  nameSize: 27,
  gapParents: 12,
  gapIg: 16,
  igSize: 46,
  textW: 270,
};

function PersonCard({
  person,
  lead,
  tone,
  L,
}: {
  person: Person;
  lead: string;
  tone: Tone;
  L: CardLayout;
}) {
  const name = displayFullName(person);
  const nameRef = useFit<HTMLHeadingElement>(name);
  const parents = parentsLines(person.childOrder, person.father, person.mother, lead);
  const ig = instagramUrl(person.instagram);
  const ink = tone === "sage" ? "var(--inv-cream)" : "var(--inv-ink)";
  // ikon Instagram: pink muda di sage (seperti nama), tinta di kertas krem
  const igInk = tone === "sage" ? "var(--inv-pink-text)" : "var(--inv-ink)";
  const nameInk = tone === "sage" ? "var(--inv-pink-text)" : "var(--inv-ink)";
  const k = L.frameW / LACE_W;
  const fl = L.cx - L.frameW / 2;
  const photo = person.photo;
  return (
    <>
      {/* foto + bingkai renda */}
      <div
        data-a="zoom"
        style={{ ...box(0, 0, 430, L.top + LACE_H * k + 10), ["--d" as string]: "0.1s" }}
      >
        <div
          style={{
            ...box(fl + LACE_HOLE.x * k, L.top + LACE_HOLE.y * k, LACE_HOLE.w * k, LACE_HOLE.h * k),
            overflow: "hidden",
            borderRadius: u(4 * k),
            background: "linear-gradient(160deg, #c9d6de, #e9eef0)",
          }}
        >
          {photo && (
            <Image
              src={photo.url}
              alt={photo.alt ?? name}
              fill
              sizes="(max-width: 440px) 32vw, 140px"
              style={{
                objectFit: "cover",
                objectPosition: `${photo.focusX ?? 50}% ${photo.focusY ?? 30}%`,
              }}
            />
          )}
        </div>
        <LaceFrame
          style={{
            ...box(fl, L.top, L.frameW, LACE_H * k),
            filter: "drop-shadow(0 1px 2px rgb(40 40 30 / 0.25))",
          }}
        />
      </div>

      {/* nama, orang tua, Instagram */}
      <div
        style={{
          ...box(L.cx - L.textW / 2, L.textTop, L.textW),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h3
          ref={nameRef}
          data-a
          style={{
            ...txt(F.serif, L.nameSize, 1.3, { italic: true, color: nameInk }),
            fontSize: `calc(${u(L.nameSize)} * var(--fit, 1))`,
            whiteSpace: "nowrap",
            alignSelf: "stretch",
            ["--d" as string]: "0.3s",
          }}
        >
          {name}
        </h3>
        {parents && (
          <p
            data-a
            style={{
              ...txt(F.serif, 13.4, 1.5, { color: ink }),
              marginTop: u(L.gapParents),
              textWrap: "balance",
              ["--d" as string]: "0.45s",
            }}
          >
            {parents.lead} {parents.names}
          </p>
        )}
        {ig && (
          <a
            data-a
            href={ig}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Instagram @${person.instagram}`}
            style={{
              marginTop: u(L.gapIg),
              width: u(L.igSize),
              height: u(L.igSize),
              color: igInk,
              pointerEvents: "auto",
              ["--d" as string]: "0.6s",
            }}
          >
            <svg
              viewBox="0 0 44 44"
              fill="none"
              stroke="currentColor"
              style={{ width: "100%", height: "100%" }}
            >
              <circle cx={22} cy={22} r={20.5} strokeWidth={1.6} />
              <rect x={12.5} y={12.5} width={19} height={19} rx={5.5} strokeWidth={1.6} />
              <circle cx={22} cy={22} r={4.6} strokeWidth={1.6} />
              <circle cx={27.4} cy={16.6} r={1.1} fill="currentColor" stroke="none" />
            </svg>
          </a>
        )}
      </div>
    </>
  );
}

export function LiliCouple() {
  const { inv } = useInvitation();
  if (inv.eventType !== "WEDDING") return null;
  const d = inv.data;
  const [a, b] = couple(d);
  const lead = (p: Person) => (p === d.bride ? "Putri dari" : "Putra dari");

  return (
    <Section id="profil" z={2}>
      {/* blok sage: mempelai pertama + "&" */}
      <div
        style={{
          position: "relative",
          height: u(SAGE_H),
          ...greenBg(SALAM_H),
        }}
      >
        <FloralColumn from={SALAM_H} height={SAGE_H} />
        <PersonCard person={a} lead={lead(a)} tone="sage" L={FIRST} />
        <div
          data-a="zoom"
          style={{
            // ±108 × 78 kanvas seperti desain, tengah kolom isi (x 178)
            ...box(124, 458, 108, 78),
            color: "var(--inv-pink-text)",
            ["--d" as string]: "0.2s",
          }}
        >
          <Ampersand style={{ width: "100%", height: "100%" }} />
        </div>
      </div>

      {/* kertas krem: mempelai kedua, kolom bunga kiri */}
      <div style={{ position: "relative", height: u(PAPER_H), ...paperBg() }}>
        <FloralColumn from={0} height={PAPER_H} side="left" />
        <PersonCard person={b} lead={lead(b)} tone="paper" L={SECOND} />
      </div>
    </Section>
  );
}
