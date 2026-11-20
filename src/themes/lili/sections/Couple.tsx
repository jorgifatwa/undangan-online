"use client";

import Image from "next/image";

import { couple, displayFullName, parentsLines } from "../../_shared/format";
import { useInvitation } from "../../_shared/runtime/context";
import type { Person } from "@/schemas/wedding";
import { instagramUrl } from "@/lib/links";
import { Bunnies, RoseSpray } from "../art/Critters";
import { FloralColumn, smoke } from "../art/FloralColumn";
import { LACE_H, LACE_HOLE, LACE_W, LaceFrame } from "../art/LaceFrame";
import { paperBg } from "../art/textures";
import { F, Section, box, txt, u, useFit } from "../canvas";
import { SAGE_BLOCK, SALAM_H } from "./Salam";

/**
 * Mempelai (section `profil`): lanjutan blok sage dari salam — mempelai
 * pertama (bingkai renda, mawar, kelinci, nama, orang tua, Instagram) + "&"
 * besar — lalu mempelai kedua di atas kertas krem. Koordinat lokal kanvas;
 * kolom bunga kanan memakai koordinat blok sage (mulai SALAM_H).
 */
const SAGE_H = SAGE_BLOCK - SALAM_H; // 588
const PAPER_H = 640;

type Tone = "sage" | "paper";

function PersonCard({
  person,
  lead,
  tone,
  cx,
  top,
}: {
  person: Person;
  lead: string;
  tone: Tone;
  /** Pusat horizontal kolom isi (px kanvas). */
  cx: number;
  /** Tepi atas bingkai (px kanvas, lokal section). */
  top: number;
}) {
  const name = displayFullName(person);
  const nameRef = useFit<HTMLHeadingElement>(name);
  const parents = parentsLines(person.childOrder, person.father, person.mother, lead);
  const ig = instagramUrl(person.instagram);
  const ink = tone === "sage" ? "var(--inv-cream)" : "var(--inv-ink)";
  const nameInk = tone === "sage" ? "var(--inv-pink-text)" : "var(--inv-ink)";
  const fl = cx - LACE_W / 2;
  const photo = person.photo;
  return (
    <>
      {/* foto + bingkai renda + hiasan */}
      <div
        data-a="zoom"
        style={{ ...box(0, 0, 430, top + LACE_H + 10), ["--d" as string]: "0.1s" }}
      >
        <div
          style={{
            ...box(fl + LACE_HOLE.x, top + LACE_HOLE.y, LACE_HOLE.w, LACE_HOLE.h),
            overflow: "hidden",
            borderRadius: u(14),
            background: "linear-gradient(160deg, #c9d6de, #e9eef0)",
          }}
        >
          {photo && (
            <Image
              src={photo.url}
              alt={photo.alt ?? name}
              fill
              sizes="(max-width: 440px) 30vw, 130px"
              style={{
                objectFit: "cover",
                objectPosition: `${photo.focusX ?? 50}% ${photo.focusY ?? 30}%`,
              }}
            />
          )}
        </div>
        <LaceFrame
          style={{
            ...box(fl, top, LACE_W, LACE_H),
            filter: "drop-shadow(0 1px 2px rgb(40 40 30 / 0.25))",
          }}
        />
      </div>
      <div data-a="fade" style={{ ...box(fl + 140, top - 46, 58, 82), ["--d" as string]: "0.45s" }}>
        <RoseSpray style={{ width: "100%", height: "100%" }} />
      </div>
      <div data-a="fade" style={{ ...box(fl + 20, top + 193, 52, 48), ["--d" as string]: "0.55s" }}>
        <Bunnies style={{ width: "100%", height: "100%" }} />
      </div>

      {/* nama, orang tua, Instagram */}
      <div
        style={{
          ...box(cx - 150, top + 288, 300),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h3
          ref={nameRef}
          data-a
          style={{
            ...txt(F.serif, 25, 1.3, { italic: true, color: nameInk }),
            fontSize: `calc(${u(25)} * var(--fit, 1))`,
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
              marginTop: u(10),
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
              marginTop: u(18),
              width: u(43),
              height: u(43),
              color: ink,
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
          background: `${smoke([
            { x: 14, y: 70, w: 48, h: 24, a: 0.26 },
            { x: 50, y: 86, w: 55, h: 18, a: 0.2 },
            { x: 70, y: 60, w: 30, h: 20, a: 0.14 },
            { x: 85, y: 30, w: 30, h: 22, a: 0.12 },
          ])}, var(--inv-sage)`,
        }}
      >
        <FloralColumn from={SALAM_H} height={SAGE_H} total={SAGE_BLOCK} />
        <PersonCard person={a} lead={lead(a)} tone="sage" cx={178} top={10} />
        <p
          data-a="zoom"
          aria-hidden
          style={{
            ...box(112, 440, 140),
            ...txt(F.amp, 112, 1.2, { color: "var(--inv-pink-text)" }),
            ["--d" as string]: "0.2s",
          }}
        >
          &amp;
        </p>
      </div>

      {/* kertas krem: mempelai kedua (disempurnakan di bagian berikutnya) */}
      <div style={{ position: "relative", height: u(PAPER_H), ...paperBg() }}>
        <PersonCard person={b} lead={lead(b)} tone="paper" cx={222} top={50} />
      </div>
    </Section>
  );
}
