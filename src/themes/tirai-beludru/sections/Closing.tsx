"use client";

import { Butterfly, Petal, Tassel } from "../../_shared/ornaments";
import { couple, shortName } from "../../_shared/format";
import { Reveal } from "../../_shared/motion/Reveal";
import { useInvitation } from "../../_shared/runtime/context";
import { SectionShell } from "../../_shared/runtime/SectionShell";
import { Art } from "../art";
import { CText, F, Placed, canvasSectionStyle, canvasText, u } from "../canvas";
import {
  AccentBouquet,
  Drapery,
  EnvelopeBack,
  EnvelopeFront,
  EnvelopeLining,
  HangingBouquet,
} from "../scene";

/** Penutup desain: 440 × 836.5 — amplop terbuka, kartu marun berornamen, nama miring −7,33°. */
const CANVAS_H = 836.5;
const DEFAULT_MESSAGE = [
  "Menjadi sebuah kebahagiaan",
  "bagi kami apabila Bapak/Ibu/Saudara/i",
  "berkenan hadir dalam hari bahagia kami.",
  "Terimakasih atas segala ucapan, doa, dan",
  "perhatian yang diberikan.",
];
const SEE_YOU = "Sampai jumpa di hari pernikahan kami!";
const msg = (y: number, wrap = false) =>
  canvasText([98.97, y, 242.05], F.body, 11.3, 16.887, { renderScale: 0.31272, wrap });

/** Kelopak jatuh dari dua buket gantung (di atas hujan kelopak umum). */
const PETALS = [
  { at: [60, 250], size: 14, duration: 11, delay: 0.5, sway: 18 },
  { at: [300, 260], size: 15, duration: 12, delay: 1.8, sway: 20 },
  { at: [150, 270], size: 12, duration: 13, delay: 3.5, sway: -22 },
  { at: [380, 240], size: 13, duration: 14, delay: 5.5, sway: -16 },
  { at: [110, 230], size: 11, duration: 15, delay: 7.5, sway: 24 },
  { at: [340, 280], size: 14, duration: 11.5, delay: 9, sway: -20 },
  { at: [30, 290], size: 12, duration: 13.5, delay: 11, sway: 20 },
  { at: [410, 270], size: 11, duration: 12.5, delay: 12.5, sway: -18 },
] as const;

function NameLine({ text, center }: { text: string; center: [number, number] }) {
  return (
    <Reveal
      variant="blur"
      style={{
        position: "absolute",
        left: u(center[0] - 159.33 / 2),
        top: u(center[1] - 50.46 / 2),
        width: u(159.33),
        height: u(50.46),
        pointerEvents: "none",
      }}
    >
      <div style={{ position: "absolute", inset: 0, transform: "rotate(-7.33deg)" }}>
        <CText
          style={canvasText([0, 0, 159.33], F.script, 50.63, 50.44, {
            letterSpacing: -0.1017,
            renderScale: 0.25865,
          })}
        >
          {text}
        </CText>
      </div>
    </Reveal>
  );
}

export function TiraiClosing() {
  const { inv, lite } = useInvitation();
  if (inv.eventType !== "WEDDING") return null;
  const [a, b] = couple(inv.data);
  const custom = inv.data.greeting?.closingText;

  return (
    <SectionShell
      id="penutup"
      className="tb-canvas"
      style={canvasSectionStyle(CANVAS_H, "#060e0a")}
    >
      <Placed img={[-163.74, -58.8, 792.67, 1190.95]} clip={[0, 0, 440, CANVAS_H]}>
        <Drapery />
      </Placed>
      {/* Amplop terbuka (adegan Section 1, 31,6 px lebih bawah) + bunga kanan */}
      <EnvelopeBack reveal="rise" dy={31.61} />
      <EnvelopeLining reveal="rise" dy={31.59} />
      <EnvelopeFront reveal="rise" dy={31.61} />
      <Placed
        img={[144.94, 457.5, 295.05, 368.81]}
        clip={[250.18, 589.11, 189.81, 237.2]}
        reveal="rise"
      >
        <AccentBouquet w={295} />
      </Placed>
      <Placed
        img={[234.79, -54.94, 282.95, 353.69]}
        clip={[234.79, 0, 205.21, 298.75]}
        flipX
        reveal="sway-right"
        parallax="hanging"
      >
        <HangingBouquet w={283} />
      </Placed>

      {/* Kartu marun berornamen + rumbai hijau */}
      <Placed img={[41.26, 41.5, 361.5, 642.66]} clip={[55.87, 96.89, 332.27, 587.27]}>
        <Art
          slot="ornate-card"
          w={362}
          fallback={
            <div
              style={{
                position: "absolute",
                inset: "8% 10%",
                background: "var(--inv-velvet)",
                borderRadius: "48% 48% 6% 6% / 30% 30% 4% 4%",
                border: "2px solid var(--inv-gold)",
              }}
            />
          }
        />
      </Placed>
      <Reveal
        variant="drop"
        style={{
          position: "absolute",
          left: u(209.14),
          top: u(534.67),
          width: u(21.61),
          height: u(21.61),
          borderRadius: "50%",
          background: "#381410",
          pointerEvents: "none",
        }}
      >
        <span />
      </Reveal>
      <Placed
        img={[219.945 - 58.66 / 2, 599.47 - 120.68 / 2, 58.66, 120.68]}
        reveal="drop"
        rotate={1.234}
        style={{ overflow: "visible" }}
      >
        <Art
          slot="tassel-alt"
          w={59}
          fallback={<Tassel tone="drape" slot={false} className="absolute inset-0 h-full w-full" />}
        />
      </Placed>

      {/* Pesan penutup */}
      {custom ? (
        <CText style={msg(202.82, true)} reveal="blur" maxLines={7}>
          {custom}
        </CText>
      ) : (
        DEFAULT_MESSAGE.map((t, i) => (
          <CText key={i} style={msg(202.82 + i * 16.887)} reveal="blur">
            {t}
          </CText>
        ))
      )}
      <CText style={msg(304.16)} reveal="blur">
        {SEE_YOU}
      </CText>

      {/* Nama pasangan */}
      <NameLine text={shortName(a)} center={[213.5, 384.09]} />
      <NameLine text="&" center={[219.95, 434.13]} />
      <NameLine text={shortName(b)} center={[226.39, 484.17]} />

      <Placed img={[266.85, 146.1, 66.72, 69.66]} reveal="pop">
        <Art
          slot="butterfly"
          w={67}
          fallback={<Butterfly slot={false} className="absolute inset-0 h-full w-full" />}
        />
      </Placed>
      <Placed
        img={[-69.33, -54.94, 282.95, 353.69]}
        clip={[0, 0, 213.63, 298.75]}
        reveal="sway"
        parallax="hanging"
      >
        <HangingBouquet w={283} />
      </Placed>

      {/* Kelopak dari buket (dikurangi di mode ringan) */}
      <Reveal variant="rise" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {PETALS.slice(0, lite ? 2 : PETALS.length).map((p, i) => (
          <div
            key={i}
            className="tb-falling-petal"
            style={
              {
                left: u(p.at[0]),
                top: u(p.at[1]),
                width: u(p.size),
                "--fall": u(CANVAS_H + 20 - p.at[1]),
                "--sway": u(p.sway),
                "--duration": `${p.duration}s`,
                "--delay": `${p.delay}s`,
              } as React.CSSProperties
            }
          >
            <Petal
              style={{ width: "100%" }}
              color={i % 3 === 0 ? "#fbe4ea" : i % 3 === 1 ? "var(--inv-petal)" : "#f6bfcd"}
            />
          </div>
        ))}
      </Reveal>
    </SectionShell>
  );
}
