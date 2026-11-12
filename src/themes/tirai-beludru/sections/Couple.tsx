"use client";

import Image from "next/image";

import { Basmalah, CapsuleFrame } from "../../_shared/ornaments";
import { VelvetTexture } from "../../_shared/textures";
import { couple, displayFullName, parentNames } from "../../_shared/format";
import { Reveal, type RevealVariant } from "../../_shared/motion/Reveal";
import { useInvitation } from "../../_shared/runtime/context";
import { SectionShell } from "../../_shared/runtime/SectionShell";
import type { Person } from "@/schemas/wedding";
import { Art } from "../art";
import { CText, F, Placed, canvasSectionStyle, canvasText, u, type Box } from "../canvas";
import { AccentBouquet, HangingBouquet } from "../scene";

/** Section 2 desain: 440 × 820.04 (salam + kedua mempelai). */
const CANVAS_H = 820.04;
/** Jendela foto berbentuk kapsul di dalam bingkai emas. */
const PHOTO_CLIP = `inset(2.425% 11.126% 2.355% 11.045% round ${u(59.71)})`;
const DEFAULT_GREETING = [
  "Dengan memohon rahmat & ridho Allah SWT,",
  "kami mengundang bapak/ibu/saudara/i",
  "untuk hadir pada pernikahan:",
];

const text = (
  box: readonly [number, number, number],
  font: string,
  size: number,
  lh: number,
  ls: number,
  align: React.CSSProperties["textAlign"],
) => canvasText(box, font, size, lh, { letterSpacing: ls, align, renderScale: 1 });

/** Nama lengkap dipecah 2 baris di spasi terdekat ke tengah (seperti desain). */
function twoLines(name: string): string {
  if (name.length <= 14 || !name.includes(" ")) return name;
  const mid = name.length / 2;
  let best = -1;
  for (let i = 0; i < name.length; i++)
    if (name[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return `${name.slice(0, best)}\n${name.slice(best + 1)}`;
}

/** Baris orang tua: ["Putri pertama dari", "Bapak X", "& Ibu Y"]. */
function bioLines(p: Person, lead: string): string[] {
  const names = parentNames(p.father, p.mother);
  if (names.length === 0) return [];
  return [
    p.childOrder ? `${p.childOrder} dari` : lead,
    names[0],
    ...(names[1] ? [`& ${names[1]}`] : []),
  ];
}

function Portrait({
  person,
  clip,
  frame,
  reveal,
}: {
  person: Person;
  clip: Box;
  frame: Box;
  reveal: RevealVariant;
}) {
  return (
    <>
      <Placed img={clip} clipPath={PHOTO_CLIP} reveal={reveal} style={{ background: "#2e050c" }}>
        {person.photo && (
          <Image
            src={person.photo.url}
            alt={person.fullName}
            fill
            sizes="(max-width: 440px) 35vw, 154px"
            style={{
              objectFit: "cover",
              objectPosition: `${person.photo.focusX ?? 50}% ${person.photo.focusY ?? 30}%`,
            }}
          />
        )}
      </Placed>
      <Placed img={frame} reveal={reveal}>
        <Art
          slot="capsule-frame"
          w={154}
          fallback={<CapsuleFrame slot={false} className="absolute inset-0 h-full w-full" />}
        />
      </Placed>
    </>
  );
}

/** Tautan Instagram (ikon + @nama) di bawah baris orang tua; hanya bila diisi. */
function Instagram({ handle, x, y, w, align }: { handle?: string; x: number; y: number; w: number; align: "left" | "right" }) {
  if (!handle) return null;
  return (
    <Reveal variant={align === "left" ? "right" : "left"} style={{ position: "absolute", left: u(x), top: u(y), width: u(w), display: "flex", justifyContent: align === "left" ? "flex-start" : "flex-end" }}>
      <a
        href={`https://instagram.com/${encodeURIComponent(handle)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Instagram @${handle}`}
        style={{ display: "inline-flex", alignItems: "center", gap: u(5), padding: `${u(3)} ${u(9)}`, border: `${u(1)} solid rgb(250 243 237 / 0.55)`, borderRadius: 999, color: "var(--inv-cream)", fontFamily: F.body, fontSize: u(11.5), lineHeight: u(16), textDecoration: "none" }}
      >
        <svg viewBox="0 0 24 24" aria-hidden style={{ width: u(12), height: u(12) }} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
        @{handle}
      </a>
    </Reveal>
  );
}

export function TiraiCouple() {
  const { inv } = useInvitation();
  if (inv.eventType !== "WEDDING") return null;
  const d = inv.data;
  const [a, b] = couple(d);
  const lead = (p: Person) => (p === d.bride ? "Putri dari" : "Putra dari");
  const islami = d.greeting?.style === "islami";
  const custom = d.greeting?.openingText;

  return (
    <SectionShell
      id="profil"
      className="tb-canvas"
      style={{ ...canvasSectionStyle(CANVAS_H, "#3a050f"), overflow: "visible", zIndex: 10 }}
    >
      <Placed img={[-137.4, -29.02, 714.78, 1270.73]} clip={[0, 0, 440, CANVAS_H]}>
        <Art
          slot="velvet-bg"
          w={715}
          filter="var(--inv-filter-velvet)"
          fallback={<VelvetTexture slot={false} />}
        />
      </Placed>

      {islami && (
        <Placed img={[119.71, 66.36, 176, 38.72]} reveal="blur" style={{ overflow: "visible" }}>
          <Art
            slot="basmalah"
            w={176}
            fit="contain"
            fallback={
              <Basmalah
                slot={false}
                style={{
                  color: "var(--inv-cream)",
                  fontSize: u(26),
                  textAlign: "center",
                  margin: 0,
                }}
              />
            }
          />
        </Placed>
      )}

      {custom ? (
        <CText
          style={{
            ...text([58.24, 145.24, 310.65], F.body, 13.648, 17, -0.0273, "center"),
            whiteSpace: "normal",
          }}
          reveal="fade"
          maxLines={5}
        >
          {custom}
        </CText>
      ) : (
        DEFAULT_GREETING.map((line, i) => (
          <CText
            key={i}
            style={text(
              [58.24, 145.24 + i * 13.26, 310.65],
              F.body,
              13.648,
              13.268,
              -0.0273,
              "center",
            )}
          >
            {line}
          </CText>
        ))
      )}

      {/* Mempelai pertama: foto kiri, nama & orang tua kanan */}
      <Portrait
        person={a}
        clip={[31.82, 252.42, 153.45, 183.05]}
        frame={[31.78, 252.42, 153.53, 183.05]}
        reveal="left"
      />
      <CText
        style={{
          ...text([207.71, 280.4, 222], F.script, 38.661, 38.661, -0.0773, "left"),
          whiteSpace: "pre-line",
        }}
        reveal="right"
        maxLines={2}
      >
        {twoLines(displayFullName(a))}
      </CText>
      {bioLines(a, lead(a)).map((line, i) => (
        <CText
          key={i}
          style={text(
            [205.95, 362.91 + i * 13.525, 218.72],
            F.body,
            13.74,
            13.525,
            -0.0275,
            "left",
          )}
          reveal="right"
        >
          {line}
        </CText>
      ))}
      <Instagram
        handle={a.instagram}
        x={205.95}
        y={362.91 + bioLines(a, lead(a)).length * 13.525 + 7}
        w={218.72}
        align="left"
      />

      <Reveal
        variant="pop"
        style={{
          position: "absolute",
          left: u(209.8),
          top: u(461.82),
          width: u(24.58),
          pointerEvents: "none",
        }}
      >
        <p
          style={{
            ...text([0, 0, 24.58], F.script, 34.203, 34.203, -0.068, "center"),
            position: "relative",
          }}
        >
          &amp;
        </p>
      </Reveal>

      {/* Mempelai kedua: nama & orang tua kiri, foto kanan */}
      <CText
        style={{
          ...text([16.63, 520, 210.2], F.script, 38.627, 38.627, -0.0773, "right"),
          whiteSpace: "pre-line",
        }}
        reveal="left"
        maxLines={2}
      >
        {twoLines(displayFullName(b))}
      </CText>
      {bioLines(b, lead(b)).map((line, i) => (
        <CText
          key={i}
          style={text(
            [21.97, 600.87 + i * 13.525, 199.61],
            F.body,
            13.74,
            13.525,
            -0.0275,
            "right",
          )}
          reveal="left"
        >
          {line}
        </CText>
      ))}
      <Instagram
        handle={b.instagram}
        x={21.97}
        y={600.87 + bioLines(b, lead(b)).length * 13.525 + 7}
        w={199.61}
        align="right"
      />
      <Portrait
        person={b}
        clip={[241.74, 522.91, 153.45, 183.05]}
        frame={[241.7, 522.91, 153.53, 183.05]}
        reveal="right"
      />

      <Placed
        img={[-149.38, 513.26, 277.59, 346.98]}
        clip={[0, 637.08, 128.22, 183.97]}
        reveal="rise"
        parallax="floor"
      >
        <AccentBouquet w={278} />
      </Placed>
      {/* Buket kanan bawah: sebagian di section ini, lanjutannya menutupi tepi atas section berikutnya */}
      <Placed
        img={[330.27, 748.67, 163.25, 204.08]}
        clip={[330.27, 748.67, 109.73, CANVAS_H - 748.67]}
      >
        <HangingBouquet w={163} />
      </Placed>
      <Placed img={[324.37, 755.28, 188.47, 235.58]} clip={[351.34, CANVAS_H, 88.66, 170.82]}>
        <HangingBouquet w={188} />
      </Placed>
    </SectionShell>
  );
}
